# Configuration MoneyFusion - Guide de Déploiement

## ✅ Intégration Complétée

L'intégration MoneyFusion est **prête pour la production** avec paiements automatiques Mobile Money (Orange, MTN, Moov).

## 📋 Variables d'Environnement Requises

### Sur Vercel (Production)

Configurez ces variables dans votre dashboard Vercel :

```bash
# MoneyFusion API
MONEYFUSION_API_URL=https://www.pay.moneyfusion.net/fixedapp/53c47152846ca6e2/pay/

# Supabase
VITE_SUPABASE_URL=votre_url_supabase
VITE_SUPABASE_ANON_KEY=votre_cle_publique_supabase
SUPABASE_SERVICE_ROLE_KEY=votre_cle_service_role_supabase  # ⚠️ REQUIS pour webhook
```

### Comment trouver SUPABASE_SERVICE_ROLE_KEY

1. Allez sur [supabase.com](https://supabase.com)
2. Sélectionnez votre projet
3. **Project Settings** (⚙️) → **API**
4. Copiez la clé **"service_role"** (marquée comme Secret)

⚠️ **IMPORTANT** : Cette clé donne un accès complet à votre base de données. Ne la partagez JAMAIS publiquement !

## 🔄 Flux de Paiement Automatique

### 1. Initiation du Paiement
```
Utilisateur → Frontend → /api/payment/initiate-moneyfusion → MoneyFusion API
```

### 2. Paiement Mobile Money
```
MoneyFusion → Page de paiement → Utilisateur paie → Confirmation
```

### 3. Activation Automatique
```
MoneyFusion → /api/webhooks/moneyfusion → Supabase → Abonnement activé
```

## 📁 Fichiers Importants

### Backend (Vercel Serverless Functions)
- `api/payment/initiate-moneyfusion.ts` - Initie les paiements
- `api/webhooks/moneyfusion.ts` - Reçoit les notifications et active les abonnements

### Frontend
- `src/components/PaymentMethodSelector.tsx` - Interface de paiement
- `src/pages/PaymentCallback.tsx` - Page de retour après paiement

### Configuration
- `vercel.json` - Configuration Vercel pour serverless functions

## 🚀 Déploiement sur Vercel

### 1. Installation

```bash
npm install -g vercel
vercel login
```

### 2. Configuration

```bash
# Dans le dossier du projet
vercel

# Suivez les instructions :
# - Link to existing project? No
# - Project name: fixedpronos
# - Directory: ./ (racine)
```

### 3. Variables d'Environnement

```bash
# Ajouter les variables une par une
vercel env add MONEYFUSION_API_URL
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY
```

Ou configurez-les directement dans le dashboard Vercel :
`Project Settings` → `Environment Variables`

### 4. Déploiement

```bash
# Déploiement de production
vercel --prod
```

## 🔔 Configuration du Webhook

Après le déploiement, votre webhook sera automatiquement disponible à :
```
https://votre-domaine.vercel.app/api/webhooks/moneyfusion
```

Cette URL est déjà configurée dans le code et sera automatiquement envoyée à MoneyFusion lors de chaque paiement.

## 🧪 Test en Production

### Test d'un Paiement Complet

1. Allez sur votre site déployé
2. Connectez-vous avec un compte utilisateur
3. Allez dans **Offres** → Choisissez un plan
4. Sélectionnez **"Mobile Money Automatique (Recommandé)"**
5. Remplissez :
   - Numéro de téléphone (ex: 01010101)
   - Nom complet
6. Cliquez sur **"Continuer"**
7. Vous serez redirigé vers MoneyFusion
8. Complétez le paiement Mobile Money
9. Votre abonnement sera **activé automatiquement** en quelques minutes !

## 📊 Suivi des Paiements

### Dans Supabase

Vous pouvez voir tous les paiements et abonnements dans vos tables :

- `payments` - Historique complet des paiements
- `subscriptions` - État des abonnements actifs
- `transactions` - Journal des transactions

### Événements Webhook Supportés

- `payin.session.pending` - Paiement en cours
- `payin.session.completed` - ✅ Paiement réussi → Abonnement activé
- `payin.session.cancelled` - ❌ Paiement annulé

## 🔒 Sécurité

✅ **Implémentée** :
- Credentials API jamais exposés au frontend
- Serverless functions sécurisées
- Row Level Security (RLS) activée sur toutes les tables Supabase
- Vérification des doublons via tokenPay
- Historique complet des paiements préservé

## 🆘 Dépannage

### Le webhook ne fonctionne pas

**Vérifiez** :
1. `SUPABASE_SERVICE_ROLE_KEY` est bien configurée sur Vercel
2. Les logs Vercel : `vercel logs`
3. Les RLS policies permettent l'insertion via service role

### Les abonnements ne s'activent pas

**Vérifiez** :
1. Le webhook reçoit bien les événements `payin.session.completed`
2. Les logs Vercel pour voir les erreurs
3. La table `subscriptions` dans Supabase

### Erreur CORS

Si vous avez des erreurs CORS, vérifiez que :
- Les serverless functions utilisent les bonnes CORS headers
- Votre domaine Vercel est autorisé dans Supabase

## 📞 Support

En cas de problème avec MoneyFusion, contactez leur support avec :
- Votre API URL
- Le token de paiement problématique
- La date/heure du problème
