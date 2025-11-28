import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  // Autoriser uniquement les requêtes POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const openrouterKey = process.env.OPENROUTER_API_KEY;
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return res.status(500).json({ 
        success: false, 
        error: 'Supabase credentials not configured' 
      });
    }

    // Vérifier l'authentification admin
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, error: 'Unauthorized - Token required' });
    }

    const token = authHeader.split(' ')[1];
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Vérifier le token et obtenir l'utilisateur
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return res.status(401).json({ success: false, error: 'Invalid token' });
    }

    // Vérifier si l'utilisateur est admin
    const adminEmails = (process.env.VITE_ADMIN_EMAILS || '').split(',').map(e => e.trim());
    if (!adminEmails.includes(user.email)) {
      return res.status(403).json({ success: false, error: 'Admin access required' });
    }

    if (!openrouterKey) {
      return res.status(500).json({ 
        success: false, 
        error: 'OpenRouter API key not configured' 
      });
    }

    const { fixtures, autoPublish = false } = req.body;

    if (!fixtures || !Array.isArray(fixtures) || fixtures.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No fixtures provided'
      });
    }

    console.log(`Generating pronos for ${fixtures.length} fixtures`);

    // Préparer les données pour l'analyse AI
    const fixturesForAnalysis = fixtures.map(f => ({
      id: f.fixture.id,
      date: f.fixture.date,
      homeTeam: f.teams.home.name,
      awayTeam: f.teams.away.name,
      league: f.league.name,
      country: f.league.country,
      h2hSummary: summarizeH2H(f.h2h, f.teams.home.id, f.teams.away.id)
    }));

    // Appeler OpenRouter avec GPT-4.1-mini
    const aiResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openrouterKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': req.headers.origin || 'https://fixedpronos.com',
        'X-Title': 'FixedPronos AI'
      },
      body: JSON.stringify({
        model: 'openai/gpt-4.1-mini',
        messages: [
          {
            role: 'system',
            content: `Tu es un expert en pronostics sportifs. Génère EXACTEMENT 10 pronostics pour les matchs fournis.

CRITÈRES DE SÉLECTION:
1. PRIORITÉ ABSOLUE aux grandes compétitions: Champions League, Europa League, Premier League, La Liga, Serie A, Bundesliga, Ligue 1
2. VARIER les horaires: choisis des matchs à différentes heures pour couvrir toute la journée
3. Équipes connues uniquement
4. Utilise l'historique H2H fourni pour renforcer ton analyse

RELATION COTE-CONFIANCE (TRÈS IMPORTANT):
- Cote 1.20-1.50 = confidence 5 (très sûr, pari safe)
- Cote 1.51-1.80 = confidence 4-5 (sûr, pari safe)
- Cote 1.81-2.20 = confidence 3 (moyen, pari vip)
- Cote 2.21-3.00 = confidence 2 (risqué, pari risk)
- Cote 3.01-5.00 = confidence 1 (très risqué, pari risk)

STRUCTURE JSON OBLIGATOIRE:
{
  "pronos": [
    {
      "fixture_id": 123456,
      "home_team": "Real Madrid",
      "away_team": "Barcelona",
      "competition": "La Liga",
      "sport": "football",
      "tip": "Victoire Real Madrid",
      "odd": 1.45,
      "confidence": 5,
      "prono_type": "safe",
      "analysis": "Real Madrid en forme à domicile avec 5 victoires consécutives.",
      "title": "El Clasico: Les Madrilènes favoris"
    }
  ]
}

RÈGLES:
- Génère EXACTEMENT 10 pronostics variés
- VARIE les cotes: inclus des paris à faible cote (1.20-1.60) ET des paris à cote élevée (2.50-4.00)
- La confiance DOIT correspondre à la cote selon le tableau ci-dessus
- prono_type: "safe" si confidence>=4, "risk" si confidence<=2, sinon "vip"
- Varie les types de paris: 1X2, Plus/Moins de buts, BTTS, Double chance, etc.
- RETOURNE UNIQUEMENT LE JSON, rien d'autre`
          },
          {
            role: 'user',
            content: `Génère 10 pronostics pour ces matchs:\n${JSON.stringify(fixturesForAnalysis, null, 2)}`
          }
        ],
        temperature: 0.5,
        max_tokens: 4000
      })
    });

    const aiData = await aiResponse.json();

    if (!aiResponse.ok) {
      console.error('OpenRouter API error:', aiData);
      return res.status(500).json({
        success: false,
        error: 'AI analysis failed',
        details: aiData.error?.message || 'Unknown error'
      });
    }

    // Parser la réponse AI
    let generatedPronos;
    try {
      const content = aiData.choices[0]?.message?.content || '';
      console.log('AI raw response:', content.substring(0, 500));
      
      let cleanContent = content
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      
      const jsonMatch = cleanContent.match(/\{[\s\S]*"pronos"[\s\S]*\}/);
      if (jsonMatch) {
        cleanContent = jsonMatch[0];
      }
      
      generatedPronos = JSON.parse(cleanContent);
      
      if (!generatedPronos.pronos) {
        generatedPronos = { pronos: Array.isArray(generatedPronos) ? generatedPronos : [] };
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', aiData.choices[0]?.message?.content);
      console.error('Parse error:', parseError.message);
      return res.status(500).json({
        success: false,
        error: 'Failed to parse AI response',
        details: parseError.message,
        rawResponse: aiData.choices[0]?.message?.content?.substring(0, 1000)
      });
    }

    console.log(`AI generated ${generatedPronos.pronos?.length || 0} pronos`);

    // Valider et normaliser les pronos générés
    const validatedPronos = [];
    const validPronoTypes = ['safe', 'risk', 'vip'];
    
    for (const prono of (generatedPronos.pronos || [])) {
      // Valider les champs obligatoires
      if (!prono.home_team || !prono.away_team || !prono.tip || !prono.title) {
        console.warn('Skipping prono with missing required fields:', prono);
        continue;
      }
      
      // Normaliser les valeurs numériques
      const odd = parseFloat(prono.odd) || 1.50;
      const confidence = parseInt(prono.confidence) || 3;
      
      // Valider les bornes
      const validOdd = Math.max(1.10, Math.min(10.0, odd));
      const validConfidence = Math.max(1, Math.min(5, confidence));
      
      // Déterminer prono_type et access_tier basés sur confidence
      let pronoType = prono.prono_type?.toLowerCase();
      if (!validPronoTypes.includes(pronoType)) {
        pronoType = validConfidence >= 4 ? 'safe' : validConfidence <= 2 ? 'risk' : 'vip';
      }
      
      // Mapper access_tier selon la confiance
      // Haute confiance = free/basic, moyenne = pro, faible = vip
      let accessTier;
      if (validConfidence >= 4) {
        accessTier = 'free';
      } else if (validConfidence === 3) {
        accessTier = 'basic';
      } else if (validConfidence === 2) {
        accessTier = 'pro';
      } else {
        accessTier = 'vip';
      }
      
      validatedPronos.push({
        ...prono,
        odd: validOdd,
        confidence: validConfidence,
        prono_type: pronoType,
        access_tier: accessTier
      });
    }

    if (validatedPronos.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No valid pronos generated',
        details: 'AI response did not contain valid prono data'
      });
    }

    console.log(`Validated ${validatedPronos.length} pronos`);

    // Si autoPublish est activé, insérer dans Supabase
    if (autoPublish && validatedPronos.length > 0) {
      const pronosToInsert = validatedPronos.map(prono => ({
        home_team: prono.home_team,
        away_team: prono.away_team,
        competition: prono.competition || 'Football',
        sport: prono.sport || 'football',
        tip: prono.tip,
        odd: prono.odd,
        confidence: prono.confidence,
        prono_type: prono.prono_type,
        access_tier: prono.access_tier,
        analysis: prono.analysis || '',
        title: prono.title,
        match_time: fixtures.find(f => f.fixture?.id === prono.fixture_id)?.fixture?.date || new Date().toISOString(),
        status: 'published',
        published_at: new Date().toISOString(),
        result: 'pending'
      }));

      const { data: insertedPronos, error: insertError } = await supabase
        .from('pronos')
        .insert(pronosToInsert)
        .select();

      if (insertError) {
        console.error('Failed to insert pronos:', insertError);
        return res.status(500).json({
          success: false,
          error: 'Failed to save pronos to database',
          details: insertError.message,
          generatedPronos: generatedPronos.pronos
        });
      }

      console.log(`Successfully published ${insertedPronos.length} pronos`);

      return res.status(200).json({
        success: true,
        published: true,
        count: insertedPronos.length,
        pronos: insertedPronos
      });
    }

    // Retourner les pronos validés sans les publier
    return res.status(200).json({
      success: true,
      published: false,
      count: validatedPronos.length,
      pronos: validatedPronos
    });

  } catch (error) {
    console.error('Generate pronos error:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to generate pronos',
      details: error.message
    });
  }
}

// Fonction pour résumer le H2H
function summarizeH2H(h2hMatches, homeTeamId, awayTeamId) {
  if (!h2hMatches || h2hMatches.length === 0) {
    return 'Aucun historique disponible';
  }

  let homeWins = 0;
  let awayWins = 0;
  let draws = 0;
  let totalGoals = 0;

  h2hMatches.forEach(match => {
    const homeGoals = match.goals.home || 0;
    const awayGoals = match.goals.away || 0;
    totalGoals += homeGoals + awayGoals;

    if (match.teams.home.id === homeTeamId) {
      if (homeGoals > awayGoals) homeWins++;
      else if (homeGoals < awayGoals) awayWins++;
      else draws++;
    } else {
      if (awayGoals > homeGoals) homeWins++;
      else if (awayGoals < homeGoals) awayWins++;
      else draws++;
    }
  });

  const avgGoals = (totalGoals / h2hMatches.length).toFixed(1);

  return `${h2hMatches.length} derniers matchs: ${homeWins}V-${draws}N-${awayWins}D. Moyenne ${avgGoals} buts/match.`;
}
