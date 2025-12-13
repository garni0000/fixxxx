import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';
import webpush from 'web-push';

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 3001;

// Configure web-push with VAPID keys
const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:contact@fixedpronos.com';

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
  console.log('Web Push configured successfully');
} else {
  console.warn('VAPID keys not configured - push notifications disabled');
}

// In-memory storage for push subscriptions (will be moved to DB)
const pushSubscriptions = new Map();

async function verifyAdmin(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Unauthorized - Token required' });
  }

  const token = authHeader.split(' ')[1];
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    return res.status(500).json({ success: false, error: 'Supabase not configured' });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) {
    return res.status(401).json({ success: false, error: 'Invalid token' });
  }

  const adminEmails = (process.env.VITE_ADMIN_EMAILS || '').split(',').map(e => e.trim());
  if (!adminEmails.includes(user.email)) {
    return res.status(403).json({ success: false, error: 'Admin access required' });
  }

  req.user = user;
  next();
}

app.post('/api/ai/fetch-fixtures', verifyAdmin, async (req, res) => {
  try {
    const rapidApiKey = process.env.RAPIDAPI_KEY;

    if (!rapidApiKey) {
      console.error('RapidAPI key not configured');
      return res.status(500).json({ 
        success: false, 
        error: 'RapidAPI key not configured' 
      });
    }

    const { league, limit = 100 } = req.body;
    const today = new Date().toISOString().split('T')[0];
    const now = new Date();

    const topLeagueIds = [
      2,    // UEFA Champions League
      3,    // UEFA Europa League
      848,  // UEFA Europa Conference League
      39,   // Premier League (England)
      140,  // La Liga (Spain)
      135,  // Serie A (Italy)
      78,   // Bundesliga (Germany)
      61,   // Ligue 1 (France)
      94,   // Primeira Liga (Portugal)
      88,   // Eredivisie (Netherlands)
      144,  // Belgian Pro League
      203,  // Super Lig (Turkey)
      1,    // World Cup / International
      4,    // Euro
    ];

    let url = `https://api-football-v1.p.rapidapi.com/v3/fixtures?date=${today}`;
    if (league) {
      url += `&league=${league}`;
    }

    console.log(`Fetching fixtures from: ${url}`);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': rapidApiKey,
        'X-RapidAPI-Host': 'api-football-v1.p.rapidapi.com'
      }
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('RapidAPI error:', data);
      return res.status(response.status).json({ 
        success: false, 
        error: data.message || 'API Football error',
        details: data
      });
    }

    const allFixtures = data.response || [];
    
    const upcomingFixtures = allFixtures.filter(fixture => {
      const fixtureDate = new Date(fixture.fixture?.date);
      const status = fixture.fixture?.status?.short;
      const isUpcoming = status === 'NS' || status === 'TBD';
      const isFuture = fixtureDate > now;
      return isUpcoming && isFuture;
    });

    const topLeagueFixtures = upcomingFixtures.filter(f => 
      topLeagueIds.includes(f.league?.id)
    );
    
    const otherFixtures = upcomingFixtures.filter(f => 
      !topLeagueIds.includes(f.league?.id)
    );

    const sortByTime = (a, b) => new Date(a.fixture?.date) - new Date(b.fixture?.date);
    topLeagueFixtures.sort(sortByTime);
    otherFixtures.sort(sortByTime);

    const prioritizedFixtures = [...topLeagueFixtures, ...otherFixtures].slice(0, limit);

    console.log(`Total: ${allFixtures.length}, Upcoming: ${upcomingFixtures.length}, Top leagues: ${topLeagueFixtures.length}, Returning: ${prioritizedFixtures.length}`);

    return res.status(200).json({
      success: true,
      count: prioritizedFixtures.length,
      totalFetched: allFixtures.length,
      upcomingCount: upcomingFixtures.length,
      topLeagueCount: topLeagueFixtures.length,
      date: today,
      fixtures: prioritizedFixtures
    });

  } catch (error) {
    console.error('Fetch fixtures error:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch fixtures',
      details: error.message
    });
  }
});

app.post('/api/ai/generate-pronos', verifyAdmin, async (req, res) => {
  try {
    const openrouterKey = process.env.OPENROUTER_API_KEY;
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

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

    const fixturesForAnalysis = fixtures.map(f => ({
      id: f.fixture?.id,
      date: f.fixture?.date,
      home_team: f.teams?.home?.name,
      away_team: f.teams?.away?.name,
      league: f.league?.name,
      country: f.league?.country
    }));

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
3. Équipes en forme uniquement - vérifie les tendances récentes
4. ÉVITE les matchs imprévisibles ou avec beaucoup de surprises

TYPES DE PARIS RECOMMANDÉS (SAFE):
- Double chance (1X, X2, 12)
- Plus/Moins de buts avec des seuils réalistes
- BTTS Oui/Non basé sur les stats
- Victoire équipe favorite à domicile

RÈGLES STRICTES:
- Tous les pronostics doivent avoir des cotes entre 1.20 et 1.90 (paris safe)
- Confidence: 4 ou 5 uniquement (haute confiance)
- prono_type: "safe" pour tous
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
      "analysis": "Real Madrid invaincu à domicile depuis 8 matchs. Pari très sûr.",
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
        details: `AI generated only ${safePronos.length} valid pronos, minimum 15 required`
      });
    }

    // Distribution des pronos selon les tiers:
    // FREE: 3 safe pronos, BASIC: 5 safe pronos
    // PRO: 1 safe + 1 combiné (2 matchs), VIP: 2 combinés (2 matchs chacun)
    
    const validatedPronos = [];
    let pronoIndex = 0;
    
    // 3 FREE safe pronos
    for (let i = 0; i < 3 && pronoIndex < safePronos.length; i++) {
      validatedPronos.push({ ...safePronos[pronoIndex], access_tier: 'free', prono_type: 'safe' });
      pronoIndex++;
    }
    
    // 5 BASIC safe pronos
    for (let i = 0; i < 5 && pronoIndex < safePronos.length; i++) {
      validatedPronos.push({ ...safePronos[pronoIndex], access_tier: 'basic', prono_type: 'safe' });
      pronoIndex++;
    }
    
    // PRO: 1 safe prono
    if (pronoIndex < safePronos.length) {
      validatedPronos.push({ ...safePronos[pronoIndex], access_tier: 'pro', prono_type: 'safe' });
      pronoIndex++;
    }
    
    // PRO: 1 combined prono (2 matchs)
    if (pronoIndex + 1 < safePronos.length) {
      const match1 = safePronos[pronoIndex];
      const match2 = safePronos[pronoIndex + 1];
      const combinedOdd = parseFloat((match1.odd * match2.odd).toFixed(2));
      
      validatedPronos.push({
        home_team: 'Combiné PRO',
        away_team: '2 matchs sûrs',
        competition: `${match1.competition} / ${match2.competition}`,
        sport: match1.sport || 'football',
        tip: `Match 1: ${match1.home_team} vs ${match1.away_team} → ${match1.tip}\nMatch 2: ${match2.home_team} vs ${match2.away_team} → ${match2.tip}`,
        odd: combinedOdd,
        confidence: Math.min(match1.confidence, match2.confidence),
        prono_type: 'vip',
        access_tier: 'pro',
        analysis: `Pari combiné sécurisé avec 2 matchs safe:\n\n📍 MATCH 1: ${match1.home_team} vs ${match1.away_team}\n   Pronostic: ${match1.tip} @ ${match1.odd}\n   ${match1.analysis || ''}\n\n📍 MATCH 2: ${match2.home_team} vs ${match2.away_team}\n   Pronostic: ${match2.tip} @ ${match2.odd}\n   ${match2.analysis || ''}\n\n💰 Cote totale: ${combinedOdd}`,
        title: `Combiné PRO - 2 matchs`
      });
      pronoIndex += 2;
    }
    
    // VIP: 2 combined pronos (2 matchs chacun)
    for (let combo = 0; combo < 2 && pronoIndex + 1 < safePronos.length; combo++) {
      const match1 = safePronos[pronoIndex];
      const match2 = safePronos[pronoIndex + 1];
      const combinedOdd = parseFloat((match1.odd * match2.odd).toFixed(2));
      
      validatedPronos.push({
        home_team: `Combiné VIP #${combo + 1}`,
        away_team: '2 matchs sûrs',
        competition: `${match1.competition} / ${match2.competition}`,
        sport: match1.sport || 'football',
        tip: `Match 1: ${match1.home_team} vs ${match1.away_team} → ${match1.tip}\nMatch 2: ${match2.home_team} vs ${match2.away_team} → ${match2.tip}`,
        odd: combinedOdd,
        confidence: Math.min(match1.confidence, match2.confidence),
        prono_type: 'vip',
        access_tier: 'vip',
        analysis: `Pari combiné VIP haute confiance avec 2 matchs safe:\n\n📍 MATCH 1: ${match1.home_team} vs ${match1.away_team}\n   Pronostic: ${match1.tip} @ ${match1.odd}\n   ${match1.analysis || ''}\n\n📍 MATCH 2: ${match2.home_team} vs ${match2.away_team}\n   Pronostic: ${match2.tip} @ ${match2.odd}\n   ${match2.analysis || ''}\n\n💰 Cote totale: ${combinedOdd}`,
        title: `Combiné VIP #${combo + 1} - 2 matchs`
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

    if (autoPublish && validatedPronos.length > 0) {
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      
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
          generatedPronos: validatedPronos
        });
      }

      console.log(`Successfully published ${insertedPronos.length} pronos`);

      // Send push notification to all subscribers
      const freeCount = insertedPronos.filter(p => p.access_tier === 'free').length;
      const paidCount = insertedPronos.length - freeCount;
      
      await sendPushNotificationToAll(
        '🎯 Nouveaux Pronos Disponibles!',
        `${freeCount} pronos gratuits et ${paidCount} pronos VIP viennent d'être publiés. Consultez-les maintenant!`,
        '/pronos/today'
      );

      return res.status(200).json({
        success: true,
        published: true,
        count: insertedPronos.length,
        pronos: insertedPronos
      });
    }

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
});

// Push notification endpoints
app.get('/api/push/vapid-public-key', (req, res) => {
  if (!vapidPublicKey) {
    return res.status(500).json({ error: 'VAPID not configured' });
  }
  res.json({ publicKey: vapidPublicKey });
});

app.post('/api/push/subscribe', async (req, res) => {
  try {
    const subscription = req.body;
    
    // Validate required subscription fields
    if (!subscription || 
        typeof subscription.endpoint !== 'string' || 
        !subscription.endpoint.startsWith('https://') ||
        !subscription.keys ||
        typeof subscription.keys.p256dh !== 'string' ||
        typeof subscription.keys.auth !== 'string') {
      return res.status(400).json({ error: 'Invalid subscription format' });
    }

    // Sanitize: only keep required fields
    const sanitizedSubscription = {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth
      }
    };
    if (subscription.expirationTime) {
      sanitizedSubscription.expirationTime = subscription.expirationTime;
    }

    // Store subscription with endpoint as key
    pushSubscriptions.set(sanitizedSubscription.endpoint, sanitizedSubscription);
    
    // Also save to database for persistence
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (supabaseUrl && supabaseServiceKey) {
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      
      // Upsert sanitized subscription in database
      await supabase.from('push_subscriptions').upsert({
        endpoint: sanitizedSubscription.endpoint,
        subscription_data: sanitizedSubscription,
        created_at: new Date().toISOString()
      }, { onConflict: 'endpoint' });
    }

    console.log(`Push subscription added. Total: ${pushSubscriptions.size}`);
    res.status(201).json({ success: true, message: 'Subscription saved' });
  } catch (error) {
    console.error('Subscribe error:', error);
    res.status(500).json({ error: 'Failed to save subscription' });
  }
});

app.post('/api/push/unsubscribe', async (req, res) => {
  try {
    const { endpoint } = req.body;
    
    if (!endpoint) {
      return res.status(400).json({ error: 'Endpoint required' });
    }

    pushSubscriptions.delete(endpoint);
    
    // Also remove from database
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (supabaseUrl && supabaseServiceKey) {
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      await supabase.from('push_subscriptions').delete().eq('endpoint', endpoint);
    }

    console.log(`Push subscription removed. Total: ${pushSubscriptions.size}`);
    res.json({ success: true, message: 'Unsubscribed' });
  } catch (error) {
    console.error('Unsubscribe error:', error);
    res.status(500).json({ error: 'Failed to unsubscribe' });
  }
});

// Function to send push notification to all subscribers
async function sendPushNotificationToAll(title, body, url = '/pronos/today') {
  if (!vapidPublicKey || !vapidPrivateKey) {
    console.warn('Cannot send push: VAPID not configured');
    return { sent: 0, failed: 0 };
  }

  const payload = JSON.stringify({
    title,
    body,
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    url,
    timestamp: Date.now()
  });

  // Load subscriptions from database
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  let allSubscriptions = Array.from(pushSubscriptions.values());
  
  if (supabaseUrl && supabaseServiceKey) {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { data: dbSubs } = await supabase.from('push_subscriptions').select('subscription_data');
    
    if (dbSubs) {
      dbSubs.forEach(row => {
        if (row.subscription_data && !pushSubscriptions.has(row.subscription_data.endpoint)) {
          allSubscriptions.push(row.subscription_data);
        }
      });
    }
  }

  console.log(`Sending push notification to ${allSubscriptions.length} subscribers`);

  let sent = 0;
  let failed = 0;

  for (const subscription of allSubscriptions) {
    try {
      await webpush.sendNotification(subscription, payload);
      sent++;
    } catch (error) {
      failed++;
      console.error('Push send error:', error.statusCode, error.message);
      
      // Remove expired/invalid subscriptions (410 Gone or 404 Not Found)
      if (error.statusCode === 410 || error.statusCode === 404) {
        pushSubscriptions.delete(subscription.endpoint);
        if (supabaseUrl && supabaseServiceKey) {
          const supabase = createClient(supabaseUrl, supabaseServiceKey);
          await supabase.from('push_subscriptions').delete().eq('endpoint', subscription.endpoint);
        }
      }
    }
  }

  console.log(`Push notifications: ${sent} sent, ${failed} failed`);
  return { sent, failed };
}

// Track app installation
app.post('/api/push/track-install', async (req, res) => {
  try {
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (supabaseUrl && supabaseServiceKey) {
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      const userAgent = req.headers['user-agent'] || 'unknown';
      
      await supabase.from('app_installs').insert({
        user_agent: userAgent,
        created_at: new Date().toISOString()
      });
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Track install error:', error);
    res.json({ success: false });
  }
});

// Get install stats (admin only)
app.get('/api/admin/install-stats', verifyAdmin, async (req, res) => {
  try {
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return res.status(500).json({ error: 'Database not configured' });
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { count: totalInstalls } = await supabase
      .from('app_installs')
      .select('*', { count: 'exact', head: true });
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const { count: todayInstalls } = await supabase
      .from('app_installs')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', today.toISOString());
    
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    const { count: weekInstalls } = await supabase
      .from('app_installs')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', weekAgo.toISOString());
    
    res.json({
      success: true,
      stats: {
        total: totalInstalls || 0,
        today: todayInstalls || 0,
        thisWeek: weekInstalls || 0
      }
    });
  } catch (error) {
    console.error('Get install stats error:', error);
    res.status(500).json({ error: 'Failed to get stats' });
  }
});

// Admin endpoint to manually send notification
app.post('/api/push/send', verifyAdmin, async (req, res) => {
  try {
    const { title, body, url } = req.body;
    
    if (!title || !body) {
      return res.status(400).json({ error: 'Title and body required' });
    }

    const result = await sendPushNotificationToAll(title, body, url);
    res.json({ success: true, ...result });
  } catch (error) {
    console.error('Send notification error:', error);
    res.status(500).json({ error: 'Failed to send notifications' });
  }
});

// Export for use in generate-pronos
export { sendPushNotificationToAll };

app.listen(PORT, '0.0.0.0', () => {
  console.log(`AI API server running on port ${PORT}`);
});
