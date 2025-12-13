# 🚀 Guide de Déploiement Vercel - FixedPronos

## 📋 Prérequis

- Compte GitHub avec le projet pushé
- Compte Vercel (gratuit)
- Projet Supabase configuré
- Compte MoneyFusion actif

---

## 🔧 Configuration des Variables d'Environnement

### 1️⃣ Accéder aux Paramètres Vercel

1. Connectez-vous sur [Vercel](https://vercel.com)
2. Sélectionnez votre projet **fixx**
3. Cliquez sur **Settings** (en haut)
4. Dans le menu gauche : **Environment Variables**

### 2️⃣ Ajouter les Variables

Cliquez sur **"Add Variable"** et ajoutez **chaque variable** ci-dessous :

#### **Supabase Configuration**

| Variable Name | Où la trouver | Environnements |
|---------------|---------------|----------------|
| `VITE_SUPABASE_URL` | Supabase Dashboard → Settings → API → Project URL | Production, Preview, Development |
| `VITE_SUPABASE_ANON_KEY` | Supabase Dashboard → Settings → API → anon/public key | Production, Preview, Development |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Dashboard → Settings → API → service_role key | Production, Preview, Development |

**⚠️ IMPORTANT** : La `service_role` key est **secrète** ! Elle permet au webhook de contourner la sécurité RLS.

#### **MoneyFusion Configuration**

| Variable Name | Valeur | Environnements |
|---------------|--------|----------------|
| `MONEYFUSION_API_URL` | `https://www.pay.moneyfusion.net/fixedapp/53c47152846ca6e2/pay/` | Production, Preview, Development |

#### **Admin Configuration**

| Variable Name | Valeur (exemple) | Environnements |
|---------------|------------------|----------------|
| `VITE_ADMIN_EMAILS` | `admin@example.com` | Production, Preview, Development |

### 3️⃣ Exemple de Configuration Vercel

```
VITE_SUPABASE_URL = https://xxxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
MONEYFUSION_API_URL = https://www.pay.moneyfusion.net/fixedapp/53c47152846ca6e2/pay/
VITE_ADMIN_EMAILS = marious10102002@gmail.com
```

**Pour chaque variable** :
- ✅ Cochez : **Production**
- ✅ Cochez : **Preview**
- ✅ Cochez : **Development**
- Cliquez sur **"Save"**

---

## 🔄 Déploiement

### Option A : Déploiement Automatique (Recommandé)

Vercel redéploie automatiquement à chaque `git push` sur la branche `main`.

```bash
git add .
git commit -m "Update configuration"
git push origin main
```

### Option B : Déploiement Manuel

1. Allez dans **Deployments**
2. Cliquez sur les **3 points** à droite du dernier déploiement
3. Cliquez sur **"Redeploy"**
4. Confirmez avec **"Redeploy"**

---

## ✅ Vérification du Déploiement

### 1. Vérifier les Logs de Build

Dans **Deployments** → Cliquez sur le dernier déploiement → **"View Function Logs"**

**Logs corrects** :
```
✓ Building...
✓ Compiled successfully
✓ Serverless functions deployed
```

**Erreurs courantes** :
- ❌ `Function Runtimes must have a valid version` → Fichiers `.ts` au lieu de `.js` dans `/api/`
- ❌ `Payment system not configured` → Variables d'environnement manquantes

### 2. Tester les Fonctions Serverless

#### Test du Paiement

1. Ouvrez votre site Vercel : `https://votre-projet.vercel.app`
2. Connectez-vous
3. Allez dans **Offres**
4. Cliquez sur **"Souscrire"** (plan BASIC, PRO ou VIP)
5. Remplissez le formulaire de paiement
6. Cliquez sur **"Procéder au paiement"**

**Résultat attendu** : Redirection vers MoneyFusion

**Si erreur** :
- Vérifiez les logs : Deployments → Function Logs
- Vérifiez que `MONEYFUSION_API_URL` est bien configurée

#### Test du Webhook

Le webhook s'active automatiquement quand MoneyFusion envoie la confirmation de paiement.

**Pour vérifier** :
1. Complétez un paiement test
2. Allez dans Vercel → Deployments → Function Logs
3. Cherchez `MoneyFusion webhook received`
4. Vérifiez que l'abonnement est activé dans Supabase

---

## 🔒 Sécurité

### Variables Publiques (Frontend)

Ces variables sont **exposées** au navigateur :
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_ADMIN_EMAILS`

### Variables Privées (Serverless uniquement)

Ces variables sont **secrètes** et ne doivent JAMAIS être exposées :
- `SUPABASE_SERVICE_ROLE_KEY` (permet bypass RLS !)
- `MONEYFUSION_API_KEY` (si utilisée)

**⚠️ NE JAMAIS** :
- Committer des `.env` files avec vraies clés
- Exposer la `service_role_key` au frontend
- Logger les clés secrètes dans la console

---

## 🐛 Dépannage

### Problème : "Payment system not configured"

**Cause** : `MONEYFUSION_API_URL` manquante

**Solution** :
1. Vercel → Settings → Environment Variables
2. Ajoutez `MONEYFUSION_API_URL`
3. Redéployez

### Problème : "Supabase credentials not configured"

**Cause** : Variables Supabase manquantes

**Solution** :
1. Vérifiez que les 3 variables Supabase sont configurées
2. Vérifiez qu'elles sont cochées pour tous les environnements
3. Redéployez

### Problème : Webhook ne fonctionne pas

**Cause** : `SUPABASE_SERVICE_ROLE_KEY` manquante ou incorrecte

**Solution** :
1. Vérifiez la clé dans Supabase Dashboard → Settings → API
2. Copiez la **service_role** key (pas anon key !)
3. Ajoutez-la à Vercel
4. Redéployez

### Problème : Fonctions TypeScript non reconnues

**Cause** : Fichiers `.ts` au lieu de `.js` dans `/api/`

**Solution** :
1. Convertir tous les fichiers `/api/**/*.ts` en `.js`
2. Retirer les annotations de type TypeScript
3. Push sur GitHub
4. Vercel redéploie automatiquement

---

## 📊 Architecture de Production

```
Utilisateur
    ↓
Vercel Frontend (React + Vite)
    ↓
Supabase (Auth + Database)
    ↓
Vercel Serverless Functions
    ├── /api/payment/initiate-moneyfusion.js
    └── /api/webhooks/moneyfusion.js
    ↓
MoneyFusion API (Paiements Mobile Money)
```

---

## 📝 Checklist de Déploiement

- [ ] Code pushé sur GitHub (branche `main`)
- [ ] Projet importé sur Vercel depuis GitHub
- [ ] Variable `VITE_SUPABASE_URL` configurée
- [ ] Variable `VITE_SUPABASE_ANON_KEY` configurée
- [ ] Variable `SUPABASE_SERVICE_ROLE_KEY` configurée
- [ ] Variable `MONEYFUSION_API_URL` configurée
- [ ] Variable `VITE_ADMIN_EMAILS` configurée
- [ ] Toutes les variables cochées pour Production/Preview/Development
- [ ] Déploiement réussi (pas d'erreurs)
- [ ] Test de connexion OK
- [ ] Test de paiement OK
- [ ] Webhook de confirmation OK

---

## 🎉 Félicitations !

Votre application FixedPronos est maintenant en production sur Vercel avec :
- ✅ Paiements Mobile Money automatisés (MoneyFusion)
- ✅ Authentification sécurisée (Supabase)
- ✅ Activation automatique des abonnements
- ✅ Système de parrainage fonctionnel
- ✅ Administration complète

**URL de production** : `https://votre-projet.vercel.app`
