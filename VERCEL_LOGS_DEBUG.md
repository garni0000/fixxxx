# 🔍 Guide de Débogage - Logs Vercel

## Comment Voir les Logs de l'API MoneyFusion sur Vercel

### 1️⃣ Accéder aux Logs

1. Connectez-vous sur [Vercel](https://vercel.com)
2. Sélectionnez votre projet **fixx**
3. Cliquez sur **"Deployments"** (en haut)
4. Cliquez sur le **dernier déploiement** (celui qui est actif)
5. Cliquez sur l'onglet **"Functions"** ou **"Runtime Logs"**

### 2️⃣ Tester et Voir les Logs en Temps Réel

1. **Ouvrez votre site Vercel** dans un onglet
2. **Gardez les logs Vercel ouverts** dans un autre onglet
3. **Essayez de faire un paiement** :
   - Allez dans "Offres"
   - Cliquez sur "Souscrire"
   - Remplissez le formulaire
   - Cliquez sur "Procéder au paiement"

4. **Revenez aux logs Vercel** et cherchez :
   ```
   MoneyFusion API Response: {...}
   Response status: ...
   ```

### 3️⃣ Analyser les Logs

#### ✅ Logs de Succès

Si le paiement fonctionne, vous verrez :

```json
MoneyFusion API Response: {
  "statut": true,
  "url": "https://www.pay.moneyfusion.net/...",
  "token": "abc123...",
  "message": "Payment initiated successfully"
}
Response status: 200
```

#### ❌ Logs d'Erreur

Si le paiement échoue, vous verrez :

```json
MoneyFusion API Response: {
  "statut": false,
  "message": "Error message here",
  "error": "Details about what went wrong"
}
Response status: 400 (ou 500)
```

**Erreurs courantes** :

| Message d'Erreur | Cause | Solution |
|------------------|-------|----------|
| `Invalid API URL` | URL MoneyFusion incorrecte | Vérifier `MONEYFUSION_API_URL` dans les variables d'environnement |
| `Missing required fields` | Champs manquants | Vérifier que tous les champs sont remplis (nom, téléphone, etc.) |
| `Invalid phone number` | Format de numéro incorrect | Utiliser le format international : `+22960123456` |
| `Unauthorized` | API Key incorrecte | Vérifier les credentials MoneyFusion |
| `Invalid amount` | Montant invalide | Vérifier que le montant est > 0 |

### 4️⃣ Logs des Données Envoyées

Les logs montrent aussi ce qui a été envoyé à MoneyFusion :

```json
MoneyFusion API error: {
  "status": 400,
  "response": {...},
  "sentData": {
    "totalPrice": 2500,
    "article": [{
      "libelle": "Abonnement BASIC - FixedPronos",
      "prix": 2500
    }],
    "personal_Info": [{
      "userId": "abc-123",
      "plan": "basic",
      "timestamp": "2025-11-24T12:00:00.000Z"
    }],
    "numeroSend": "+22960123456",
    "nomclient": "John Doe",
    "return_url": "https://votre-site.vercel.app/payment/callback",
    "webhook_url": "https://votre-site.vercel.app/api/webhooks/moneyfusion"
  }
}
```

**Vérifiez** :
- ✅ `totalPrice` = montant correct
- ✅ `numeroSend` = numéro au bon format
- ✅ `return_url` et `webhook_url` = URL correctes de votre site Vercel

### 5️⃣ Erreurs Spécifiques MoneyFusion

#### Problème : "Payment system not configured"

**Cause** : Variable `MONEYFUSION_API_URL` manquante

**Solution** :
```bash
1. Vercel → Settings → Environment Variables
2. Ajoutez : MONEYFUSION_API_URL
3. Valeur : https://www.pay.moneyfusion.net/fixedapp/53c47152846ca6e2/pay/
4. Cochez : Production, Preview, Development
5. Redéployez
```

#### Problème : "Failed to create payment session"

**Causes possibles** :
1. URL MoneyFusion incorrecte
2. Format de données incorrect
3. Credentials MoneyFusion invalides
4. Compte MoneyFusion suspendu/inactif

**Solution** :
1. Vérifiez les logs Vercel pour voir la réponse exacte de MoneyFusion
2. Contactez le support MoneyFusion si le format est correct
3. Vérifiez que votre compte MoneyFusion est actif

#### Problème : "Supabase credentials not configured"

**Cause** : Variables Supabase manquantes (pour le webhook)

**Solution** :
```bash
1. Vercel → Settings → Environment Variables
2. Ajoutez les 3 variables Supabase
3. Redéployez
```

### 6️⃣ Logs du Webhook (Confirmation de Paiement)

Après qu'un utilisateur paie, MoneyFusion envoie une confirmation via webhook.

**Cherchez dans les logs** :
```
MoneyFusion webhook received: {...}
✅ Subscription activated for user xxx - Plan: basic
```

Si vous voyez :
```
❌ Payment payin.session.cancelled for user xxx
```
→ Le paiement a été annulé par l'utilisateur ou a échoué.

### 7️⃣ Copier les Logs pour Support

Si vous avez besoin d'aide, copiez ces informations :

1. **Timestamp** de l'erreur
2. **Message d'erreur complet** de MoneyFusion
3. **Données envoyées** (sans informations sensibles)
4. **Code de réponse HTTP**

**Exemple** :
```
[2025-11-24 12:30:45] 
ERROR: Failed to create payment session
MoneyFusion Response: {"statut": false, "message": "Invalid API credentials"}
HTTP Status: 401
Sent Data: {totalPrice: 2500, numeroSend: "+22960123456"}
```

### 8️⃣ Alternative : Logs via CLI Vercel

Vous pouvez aussi voir les logs en temps réel via terminal :

```bash
# Installer Vercel CLI
npm install -g vercel

# Se connecter
vercel login

# Voir les logs en temps réel
vercel logs --follow
```

### 9️⃣ Activer les Logs de Debugging (Temporaire)

Pour plus de détails, vous pouvez temporairement ajouter plus de logs :

**Dans `api/payment/initiate-moneyfusion.js`** :
```javascript
console.log('🔍 DEBUG - Request Body:', req.body);
console.log('🔍 DEBUG - API URL:', apiUrl);
console.log('🔍 DEBUG - Payment Data:', paymentData);
```

**N'oubliez pas de les retirer après le débogage !**

---

## ✅ Checklist de Débogage

Avant de contacter le support :

- [ ] Variables d'environnement Vercel configurées
- [ ] Logs Vercel consultés pour voir la réponse MoneyFusion
- [ ] Format des données envoyées vérifié
- [ ] Compte MoneyFusion actif et fonctionnel
- [ ] URL de l'API MoneyFusion correcte
- [ ] Numéro de téléphone au bon format
- [ ] Montant valide (> 0)
- [ ] Webhook URL accessible publiquement

---

## 🆘 Support

Si le problème persiste après avoir suivi ce guide :

1. **Contactez MoneyFusion** :
   - Email : support@moneyfusion.net
   - Fournissez les logs Vercel

2. **Vérifiez la documentation MoneyFusion** :
   - Format exact des données requises
   - Limites de montant
   - Pays/opérateurs supportés

3. **Testez avec des données de test** :
   - Numéro test fourni par MoneyFusion
   - Petit montant (ex: 100 XOF)
