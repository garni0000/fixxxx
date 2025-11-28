import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  // Autoriser uniquement les requêtes POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Vérifier l'authentification admin
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

    const rapidApiKey = process.env.RAPIDAPI_KEY;

    if (!rapidApiKey) {
      console.error('RapidAPI key not configured');
      return res.status(500).json({ 
        success: false, 
        error: 'RapidAPI key not configured' 
      });
    }

    const { date, league, limit = 100 } = req.body;

    // Date par défaut : aujourd'hui
    const targetDate = date || new Date().toISOString().split('T')[0];
    const now = new Date();

    // IDs des grandes compétitions prioritaires
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

    // Récupérer les matchs du jour
    const fixturesUrl = `https://api-football-v1.p.rapidapi.com/v3/fixtures?date=${targetDate}${league ? `&league=${league}` : ''}`;
    
    console.log('Fetching fixtures from:', fixturesUrl);

    const fixturesResponse = await fetch(fixturesUrl, {
      method: 'GET',
      headers: {
        'x-rapidapi-host': 'api-football-v1.p.rapidapi.com',
        'x-rapidapi-key': rapidApiKey
      }
    });

    const fixturesData = await fixturesResponse.json();

    if (fixturesData.errors && Object.keys(fixturesData.errors).length > 0) {
      console.error('API Football errors:', fixturesData.errors);
      return res.status(400).json({
        success: false,
        error: 'API Football error',
        details: fixturesData.errors
      });
    }

    const allFixtures = fixturesData.response || [];

    // Filtrer UNIQUEMENT les matchs à venir
    const allUpcoming = allFixtures.filter(fixture => {
      const fixtureDate = new Date(fixture.fixture?.date);
      const status = fixture.fixture?.status?.short;
      const isUpcoming = status === 'NS' || status === 'TBD';
      const isFuture = fixtureDate > now;
      return isUpcoming && isFuture;
    });

    // Séparer les grandes compétitions des autres
    const topLeagueFixtures = allUpcoming.filter(f => topLeagueIds.includes(f.league?.id));
    const otherFixtures = allUpcoming.filter(f => !topLeagueIds.includes(f.league?.id));

    // Trier par heure
    const sortByTime = (a, b) => new Date(a.fixture?.date) - new Date(b.fixture?.date);
    topLeagueFixtures.sort(sortByTime);
    otherFixtures.sort(sortByTime);

    // Priorité aux grandes compétitions
    const upcomingFixtures = [...topLeagueFixtures, ...otherFixtures].slice(0, limit);

    console.log(`Total: ${allFixtures.length}, Upcoming: ${allUpcoming.length}, Top leagues: ${topLeagueFixtures.length}`);

    console.log(`Found ${upcomingFixtures.length} upcoming fixtures`);

    // Pour chaque match, récupérer le H2H (historique des confrontations)
    const fixturesWithH2H = await Promise.all(
      upcomingFixtures.map(async (fixture) => {
        try {
          const homeTeamId = fixture.teams.home.id;
          const awayTeamId = fixture.teams.away.id;

          const h2hUrl = `https://api-football-v1.p.rapidapi.com/v3/fixtures/headtohead?h2h=${homeTeamId}-${awayTeamId}&last=10`;
          
          const h2hResponse = await fetch(h2hUrl, {
            method: 'GET',
            headers: {
              'x-rapidapi-host': 'api-football-v1.p.rapidapi.com',
              'x-rapidapi-key': rapidApiKey
            }
          });

          const h2hData = await h2hResponse.json();

          return {
            fixture: fixture.fixture,
            league: fixture.league,
            teams: fixture.teams,
            goals: fixture.goals,
            h2h: h2hData.response || []
          };
        } catch (h2hError) {
          console.error('H2H fetch error:', h2hError);
          return {
            fixture: fixture.fixture,
            league: fixture.league,
            teams: fixture.teams,
            goals: fixture.goals,
            h2h: []
          };
        }
      })
    );

    return res.status(200).json({
      success: true,
      date: targetDate,
      count: fixturesWithH2H.length,
      totalFetched: allFixtures.length,
      upcomingCount: upcomingFixtures.length,
      fixtures: fixturesWithH2H
    });

  } catch (error) {
    console.error('Fetch fixtures error:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch fixtures',
      details: error.message
    });
  }
}
