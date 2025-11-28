import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  // Autoriser uniquement les requêtes POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const webhookData = req.body;
    
    console.log('MoneyFusion webhook received:', JSON.stringify(webhookData, null, 2));

    // Initialiser le client Supabase avec la service role key pour contourner RLS
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Supabase credentials not configured');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Extraire les informations du webhook (supporte 2 formats)
    const { 
      event, 
      personal_Info, 
      tokenPay, 
      numeroSend, 
      nomclient,
      Montant,
      statut: paymentStatus,
      data: webhookDataNested
    } = webhookData;

    // Support des formats nested (quand les données sont dans 'data')
    const actualPersonalInfo = personal_Info || webhookDataNested?.personal_Info;
    const actualTokenPay = tokenPay || webhookDataNested?.tokenPay;
    const actualNumeroSend = numeroSend || webhookDataNested?.numeroSend;
    const actualNomclient = nomclient || webhookDataNested?.nomclient;
    const actualMontant = Montant || webhookDataNested?.Montant;
    const actualStatut = paymentStatus || webhookDataNested?.statut;

    // Déterminer l'événement (format avec 'event' ou avec 'statut')
    let eventType = event;
    if (!eventType && actualStatut) {
      // Format alternatif : utiliser le statut pour déterminer l'événement
      if (actualStatut === 'paid') eventType = 'payin.session.completed';
      else if (actualStatut === 'pending') eventType = 'payin.session.pending';
      else if (actualStatut === 'failure' || actualStatut === 'no paid') eventType = 'payin.session.cancelled';
    }

    // Récupérer les informations personnalisées
    const userId = actualPersonalInfo?.[0]?.userId;
    const plan = actualPersonalInfo?.[0]?.plan;

    // Validation complète des données requises
    if (!userId || !plan) {
      console.error('Missing user info in webhook:', webhookData);
      return res.status(400).json({ error: 'Missing user information' });
    }

    if (!actualTokenPay) {
      console.error('Missing payment token in webhook:', webhookData);
      return res.status(400).json({ error: 'Missing payment token' });
    }

    if (!actualMontant) {
      console.error('Missing amount in webhook:', webhookData);
      return res.status(400).json({ error: 'Missing payment amount' });
    }

    // Traiter selon l'événement
    if (eventType === 'payin.session.completed') {
      // Paiement réussi - Activer l'abonnement

      // 1. Vérifier si une transaction existe déjà pour ce token (idempotence)
      const { data: existingTransaction } = await supabase
        .from('transactions')
        .select('*')
        .eq('provider_id', actualTokenPay)
        .single();

      if (existingTransaction && existingTransaction.status === 'completed') {
        console.log('Payment already processed (idempotent):', actualTokenPay);
        return res.status(200).json({ message: 'Already processed' });
      }

      // 2. Créer un nouveau paiement (sans écraser l'ancien)
      const paymentData = {
        user_id: userId,
        amount: actualMontant,
        currency: 'XOF',
        plan: plan,
        method: 'mobile_money',
        mobile_number: actualNumeroSend,
        status: 'approved',
        notes: `MoneyFusion Token: ${actualTokenPay}\nClient: ${actualNomclient}\nPaiement automatique validé`
      };

      const { data: payment, error: paymentError } = await supabase
        .from('payments')
        .insert(paymentData)
        .select()
        .single();

      if (paymentError) {
        console.error('Error creating payment:', paymentError);
        return res.status(500).json({ error: 'Failed to record payment' });
      }

      // 3. Activer/Mettre à jour l'abonnement
      const { data: existingSubscription } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .single();

      const now = new Date();
      let startDate;
      let endDate;

      if (existingSubscription && existingSubscription.status === 'active') {
        // Prolonger l'abonnement existant
        const currentEndDate = new Date(existingSubscription.current_period_end);
        startDate = currentEndDate > now ? currentEndDate : now;
      } else {
        // Nouvel abonnement ou abonnement expiré
        startDate = now;
      }

      // Calculer la date de fin (30 jours)
      endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 30);

      const subscriptionData = {
        user_id: userId,
        plan: plan,
        status: 'active',
        current_period_start: startDate.toISOString(),
        current_period_end: endDate.toISOString(),
        cancel_at_period_end: false
      };

      const { error: subError } = await supabase
        .from('subscriptions')
        .upsert(subscriptionData, { onConflict: 'user_id' });

      if (subError) {
        console.error('Error updating subscription:', subError);
        return res.status(500).json({ error: 'Failed to activate subscription' });
      }

      // 4. Créer une transaction dans l'historique
      const { error: txError } = await supabase
        .from('transactions')
        .insert({
          user_id: userId,
          type: 'payment',
          amount: actualMontant,
          currency: 'XOF',
          status: 'completed',
          provider: 'moneyfusion',
          provider_id: actualTokenPay,
          metadata: {
            plan: plan,
            payment_method: 'mobile_money',
            phone: actualNumeroSend
          }
        });

      if (txError) {
        console.error('Error creating transaction:', txError);
      }

      console.log(`✅ Subscription activated for user ${userId} - Plan: ${plan}`);
      return res.status(200).json({ message: 'Subscription activated successfully' });

    } else if (eventType === 'payin.session.cancelled' || eventType === 'payin.session.failed') {
      // Paiement échoué ou annulé
      console.log(`❌ Payment ${eventType} for user ${userId}`);
      return res.status(200).json({ message: 'Payment failed/cancelled' });

    } else if (eventType === 'payin.session.pending') {
      // Paiement en attente - ne rien faire
      console.log(`⏳ Payment pending for user ${userId}`);
      return res.status(200).json({ message: 'Payment pending' });
    }

    return res.status(200).json({ message: 'Webhook received' });

  } catch (error) {
    console.error('Webhook processing error:', error);
    return res.status(500).json({ error: 'Webhook processing failed' });
  }
}
