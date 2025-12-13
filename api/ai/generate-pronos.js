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
            content: `Tu es un expert en pronostics sportifs avec un taux de réussite très élevé. Génère des pronostics de HAUTE QUALITÉ.

STRUCTURE DE GÉNÉRATION OBLIGATOIRE:
Tu dois générer EXACTEMENT 15 pronostics individuels SAFE (cotes entre 1.20 et 1.90) pour permettre de créer:
- 3 pronostics FREE (safe, confiance élevée)
- 5 pronostics BASIC (safe, confiance élevée)  
- 1 pronostic PRO safe + 2 matchs pour combiné PRO
- 4 matchs supplémentaires pour les 2 COMBINÉS VIP

CRITÈRES DE SÉLECTION (TRÈS STRICT):
1. PRIORITÉ ABSOLUE aux grandes compétitions: Champions League, Europa League, Premier League, La Liga, Serie A, Bundesliga, Ligue 1
2. Choisis UNIQUEMENT des paris avec une forte probabilité de succès
3. Utilise l'historique H2H fourni pour valider tes choix
4. Équipes en forme uniquement - vérifie les tendances récentes
5. ÉVITE les matchs imprévisibles ou avec beaucoup de surprises

TYPES DE PARIS RECOMMANDÉS (SAFE):
- Double chance (1X, X2, 12)
- Plus/Moins de buts avec des seuils réalistes
- BTTS Oui/Non basé sur les stats
- Victoire équipe favorite à domicile

RÈGLES STRICTES:
- Tous les pronostics doivent avoir des cotes entre 1.20 et 1.90 (paris safe)
- Confidence: 4 ou 5 uniquement (haute confiance)
- prono_type: "safe" pour tous
- Analyse approfondie basée sur les données H2H
- Prends des décisions intelligentes et calculées

STRUCTURE JSON OBLIGATOIRE:
{
  "pronos": [
    {
      "fixture_id": 123456,
      "home_team": "Real Madrid",
      "away_team": "Barcelona",
      "competition": "La Liga",
      "sport": "football",
      "tip": "Double chance 1X",
      "odd": 1.35,
      "confidence": 5,
      "prono_type": "safe",
      "analysis": "Real Madrid invaincu à domicile depuis 8 matchs. Le H2H montre 5V-2N-1D pour Madrid. Pari très sûr.",
      "title": "El Clasico: Madrid ne perdra pas"
    }
  ]
}

- RETOURNE UNIQUEMENT LE JSON, rien d'autre
- Génère EXACTEMENT 15 pronostics safe de haute qualité`
          },
          {
            role: 'user',
            content: `Génère 15 pronostics SAFE de haute qualité pour ces matchs:\n${JSON.stringify(fixturesForAnalysis, null, 2)}`
          }
        ],
        temperature: 0.3,
        max_tokens: 5000
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
    const safePronos = [];
    const validPronoTypes = ['safe', 'risk', 'vip'];
    
    for (const prono of (generatedPronos.pronos || [])) {
      if (!prono.home_team || !prono.away_team || !prono.tip || !prono.title) {
        console.warn('Skipping prono with missing required fields:', prono);
        continue;
      }
      
      const odd = parseFloat(prono.odd) || 1.50;
      const confidence = parseInt(prono.confidence) || 4;
      
      const validOdd = Math.max(1.10, Math.min(2.0, odd));
      const validConfidence = Math.max(4, Math.min(5, confidence));
      
      safePronos.push({
        ...prono,
        odd: validOdd,
        confidence: validConfidence,
        prono_type: 'safe'
      });
    }

    if (safePronos.length < 15) {
      return res.status(400).json({
        success: false,
        error: 'Not enough valid pronos generated',
        details: `AI generated only ${safePronos.length} valid pronos, minimum 15 required for tier distribution (3 free + 5 basic + 1 pro safe + 2 pro combo + 4 vip combo)`
      });
    }

    // Distribution des pronos selon les tiers:
    // FREE: 3 safe pronos
    // BASIC: 5 safe pronos
    // PRO: 1 safe + 1 combiné (2 matchs)
    // VIP: 2 combinés (2 matchs chacun)
    
    const validatedPronos = [];
    let pronoIndex = 0;
    
    // 3 FREE safe pronos
    for (let i = 0; i < 3 && pronoIndex < safePronos.length; i++) {
      validatedPronos.push({
        ...safePronos[pronoIndex],
        access_tier: 'free',
        prono_type: 'safe'
      });
      pronoIndex++;
    }
    
    // 5 BASIC safe pronos
    for (let i = 0; i < 5 && pronoIndex < safePronos.length; i++) {
      validatedPronos.push({
        ...safePronos[pronoIndex],
        access_tier: 'basic',
        prono_type: 'safe'
      });
      pronoIndex++;
    }
    
    // PRO: 1 safe prono
    if (pronoIndex < safePronos.length) {
      validatedPronos.push({
        ...safePronos[pronoIndex],
        access_tier: 'pro',
        prono_type: 'safe'
      });
      pronoIndex++;
    }
    
    // PRO: 1 combined prono (combiner 2 matchs pour un pari plus sûr)
    if (pronoIndex + 1 < safePronos.length) {
      const match1 = safePronos[pronoIndex];
      const match2 = safePronos[pronoIndex + 1];
      const combinedOdd = parseFloat((match1.odd * match2.odd).toFixed(2));
      
      validatedPronos.push({
        home_team: match1.home_team,
        away_team: match1.away_team,
        competition: match1.competition,
        sport: match1.sport || 'football',
        tip: `${match1.home_team} vs ${match1.away_team} / ${match1.tip}\n${match2.home_team} vs ${match2.away_team} / ${match2.tip}`,
        odd: combinedOdd,
        confidence: Math.min(match1.confidence, match2.confidence),
        prono_type: 'safe',
        access_tier: 'pro',
        analysis: `Pari combiné sécurisé:\n1) ${match1.home_team} vs ${match1.away_team}: ${match1.tip} (cote ${match1.odd}) - ${match1.analysis}\n2) ${match2.home_team} vs ${match2.away_team}: ${match2.tip} (cote ${match2.odd}) - ${match2.analysis}`,
        title: `Combiné Pro: ${match1.home_team} + ${match2.home_team}`,
        combined_matches: [
          { home: match1.home_team, away: match1.away_team, tip: match1.tip, odd: match1.odd },
          { home: match2.home_team, away: match2.away_team, tip: match2.tip, odd: match2.odd }
        ]
      });
      pronoIndex += 2;
    }
    
    // VIP: 2 combined pronos (chacun combine 2 matchs)
    for (let combo = 0; combo < 2 && pronoIndex + 1 < safePronos.length; combo++) {
      const match1 = safePronos[pronoIndex];
      const match2 = safePronos[pronoIndex + 1];
      const combinedOdd = parseFloat((match1.odd * match2.odd).toFixed(2));
      
      validatedPronos.push({
        home_team: match1.home_team,
        away_team: match1.away_team,
        competition: match1.competition,
        sport: match1.sport || 'football',
        tip: `${match1.home_team} vs ${match1.away_team} / ${match1.tip}\n${match2.home_team} vs ${match2.away_team} / ${match2.tip}`,
        odd: combinedOdd,
        confidence: Math.min(match1.confidence, match2.confidence),
        prono_type: 'safe',
        access_tier: 'vip',
        analysis: `Pari combiné VIP haute confiance:\n1) ${match1.home_team} vs ${match1.away_team}: ${match1.tip} (cote ${match1.odd}) - ${match1.analysis}\n2) ${match2.home_team} vs ${match2.away_team}: ${match2.tip} (cote ${match2.odd}) - ${match2.analysis}`,
        title: `Combiné VIP #${combo + 1}: ${match1.home_team} + ${match2.home_team}`,
        combined_matches: [
          { home: match1.home_team, away: match1.away_team, tip: match1.tip, odd: match1.odd },
          { home: match2.home_team, away: match2.away_team, tip: match2.tip, odd: match2.odd }
        ]
      });
      pronoIndex += 2;
    }

    if (validatedPronos.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No valid pronos generated',
        details: 'AI response did not contain valid prono data'
      });
    }

    console.log(`Validated ${validatedPronos.length} pronos (3 free, 5 basic, 2 pro, 2 vip)`);

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
        console.error('Failed to insert pronos:', JSON.stringify(insertError, null, 2));
        return res.status(500).json({
          success: false,
          error: 'Failed to save pronos to database',
          details: insertError.message,
          code: insertError.code,
          hint: insertError.hint,
          supabaseUrl: supabaseUrl ? 'configured' : 'missing',
          serviceKeySet: supabaseServiceKey ? 'yes' : 'no'
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
