export default async function handler(req, res) {
  // Autoriser uniquement les requêtes POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId, amount, plan, phoneNumber, customerName } = req.body;

    // Validation des données
    if (!userId || !amount || !plan || !phoneNumber || !customerName) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields' 
      });
    }

    // Configuration MoneyFusion
    const apiUrl = process.env.MONEYFUSION_API_URL;

    if (!apiUrl) {
      console.error('MoneyFusion API URL not configured');
      return res.status(500).json({ 
        success: false, 
        error: 'Payment system not configured' 
      });
    }

    // Préparer les données de paiement selon la documentation MoneyFusion
    const amountNumber = parseFloat(amount);
    const paymentData = {
      totalPrice: amountNumber,
      article: [
        {
          nom: `Abonnement ${plan.toUpperCase()} - FixedPronos`,
          montant: amountNumber
        }
      ],
      personal_Info: [
        {
          userId: userId,
          plan: plan,
          timestamp: new Date().toISOString()
        }
      ],
      numeroSend: phoneNumber,
      nomclient: customerName,
      return_url: `${req.headers.origin}/payment/callback`,
      webhook_url: `${req.headers.origin}/api/webhooks/moneyfusion`
    };

    // Appeler l'API MoneyFusion
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(paymentData)
    });

    const data = await response.json();
    
    // Logger toute la réponse pour debugging
    console.log('MoneyFusion API Response:', JSON.stringify(data, null, 2));
    console.log('Response status:', response.status);

    // Vérifier la réponse
    if (data.statut && data.url && data.token) {
      return res.status(200).json({
        success: true,
        paymentUrl: data.url,
        paymentToken: data.token,
        message: data.message
      });
    } else {
      console.error('MoneyFusion API error:', {
        status: response.status,
        response: data,
        sentData: paymentData
      });
      return res.status(500).json({
        success: false,
        error: 'Failed to create payment session',
        details: data.message || data.error || 'Unknown error from MoneyFusion API'
      });
    }

  } catch (error) {
    console.error('Payment initiation error:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to initiate payment' 
    });
  }
}
