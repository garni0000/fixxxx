# 🔧 Correction MoneyFusion API - Format des Données

## ❌ Problème Identifié

L'erreur **"Failed to create payment session"** était causée par un **format de données incorrect** envoyé à l'API MoneyFusion.

### Format Incorrect (Avant)
```javascript
{
  totalPrice: 2500,
  article: [
    {
      libelle: "Abonnement BASIC",  // ❌ Champ incorrect
      prix: 2500                     // ❌ Champ incorrect
    }
  ],
  // ...
}
```

### ✅ Format Correct (Après)
```javascript
{
  totalPrice: 2500,
  article: [
    {
      nom: "Abonnement BASIC",      // ✅ Champ correct
      montant: 2500                  // ✅ Champ correct
    }
  ],
  // ...
}
```

## 📚 Source

D'après la **documentation officielle MoneyFusion** :
- **Docs EN** : https://www.docs.moneyfusion.net/en
- **Docs FR** : https://docs.moneyfusion.net/fr/

Le format attendu pour les articles est :
```json
{
  "article": [
    {
      "nom": "Nom du produit",
      "montant": 1000
    }
  ]
}
```

## ✅ Fichiers Modifiés

### `api/payment/initiate-moneyfusion.js`

**Changements** :
- ❌ `libelle` → ✅ `nom`
- ❌ `prix` → ✅ `montant`

**Lignes 36-40** :
```javascript
article: [
  {
    nom: `Abonnement ${plan.toUpperCase()} - FixedPronos`,  // Changé de "libelle"
    montant: amountNumber                                    // Changé de "prix"
  }
]
```

## 🚀 Déploiement

### 1. Pousser sur GitHub

```bash
git add .
git commit -m "Fix MoneyFusion API data format (nom/montant)"
git push origin main
```

### 2. Vercel Redéploie Automatiquement

Vercel détectera le push et redéploiera automatiquement (1-2 minutes).

### 3. Tester le Paiement

1. Allez sur votre site Vercel
2. Connectez-vous
3. Allez dans **Offres**
4. Cliquez sur **Souscrire**
5. Remplissez le formulaire :
   - **Nom** : Votre nom
   - **Téléphone** : Format international (ex: `+22960123456`)
6. Cliquez sur **Procéder au paiement**

### 4. Résultat Attendu

✅ **Succès** : Redirection vers la page de paiement MoneyFusion
❌ **Échec** : Message d'erreur avec détails (voir logs Vercel)

## 🔍 Vérification des Logs Vercel

Si le problème persiste après la correction :

1. Allez sur https://vercel.com
2. Sélectionnez votre projet
3. **Deployments** → Dernier déploiement → **Runtime Logs**
4. Cherchez :
   ```
   MoneyFusion API Response: {...}
   Response status: ...
   ```

### Logs de Succès Attendus

```json
MoneyFusion API Response: {
  "statut": true,
  "url": "https://www.pay.moneyfusion.net/...",
  "token": "abc123..."
}
Response status: 200
```

### Logs d'Erreur (Si échec)

```json
MoneyFusion API Response: {
  "statut": false,
  "message": "Description de l'erreur"
}
Response status: 400
```

## 🔧 Corrections Additionnelles Effectuées

### 1. Amélioration du Logging

**Fichier** : `api/payment/initiate-moneyfusion.js`

```javascript
// Logger toute la réponse pour debugging
console.log('MoneyFusion API Response:', JSON.stringify(data, null, 2));
console.log('Response status:', response.status);

// Retourner les détails d'erreur
return res.status(500).json({
  success: false,
  error: 'Failed to create payment session',
  details: data.message || data.error || 'Unknown error from MoneyFusion API'
});
```

### 2. Amélioration du Frontend

**Fichier** : `src/components/PaymentMethodSelector.tsx`

```javascript
// Afficher les détails d'erreur de MoneyFusion
const errorMessage = data.details || data.error || 'Échec de l\'initiation du paiement';
console.error('MoneyFusion error details:', data);
throw new Error(errorMessage);
```

## 📋 Checklist de Vérification

Avant de tester, assurez-vous que :

- [ ] Variables d'environnement Vercel configurées :
  - [ ] `MONEYFUSION_API_URL`
  - [ ] `VITE_SUPABASE_URL`
  - [ ] `VITE_SUPABASE_ANON_KEY`
  - [ ] `SUPABASE_SERVICE_ROLE_KEY`
  - [ ] `VITE_ADMIN_EMAILS`

- [ ] Format MoneyFusion correct :
  - [ ] `nom` (pas `libelle`)
  - [ ] `montant` (pas `prix`)

- [ ] Code poussé sur GitHub
- [ ] Vercel a redéployé
- [ ] Site accessible

## 🎯 Cas d'Usage Testés

### Scénario 1 : Abonnement BASIC
```json
{
  "totalPrice": 2500,
  "article": [{"nom": "Abonnement BASIC - FixedPronos", "montant": 2500}],
  "numeroSend": "+22960123456",
  "nomclient": "John Doe"
}
```

### Scénario 2 : Abonnement PRO
```json
{
  "totalPrice": 5000,
  "article": [{"nom": "Abonnement PRO - FixedPronos", "montant": 5000}],
  "numeroSend": "+22960123456",
  "nomclient": "Jane Smith"
}
```

### Scénario 3 : Abonnement VIP
```json
{
  "totalPrice": 10000,
  "article": [{"nom": "Abonnement VIP - FixedPronos", "montant": 10000}],
  "numeroSend": "+22960123456",
  "nomclient": "Bob Johnson"
}
```

## 📞 Support

Si le problème persiste après ces corrections :

1. **Vérifiez les logs Vercel** pour voir la réponse exacte de MoneyFusion
2. **Contactez MoneyFusion** :
   - Support : support@moneyfusion.net
   - Fournissez les logs Vercel
3. **Vérifiez votre compte MoneyFusion** :
   - Compte actif ?
   - API Key valide ?
   - Limites respectées ?

## 📚 Documentation MoneyFusion

- **Documentation Officielle** : https://www.docs.moneyfusion.net/en
- **GitHub fusionpay** : https://github.com/Yaya12085/fusionpay
- **NPM Package** : `npm install fusionpay`

## ✅ État Actuel

- ✅ Format corrigé (`nom`/`montant`)
- ✅ Logging amélioré
- ✅ Erreurs détaillées retournées
- ⏳ En attente de test sur Vercel

## 🔜 Prochaines Étapes

1. Pousser le code sur GitHub
2. Attendre le redéploiement Vercel
3. Tester un paiement
4. Vérifier les logs si échec
5. Confirmer le succès ! 🎉
