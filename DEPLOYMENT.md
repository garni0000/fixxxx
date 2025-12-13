# Guide de Déploiement - FixedPronos sur Vercel

Ce guide explique comment déployer votre application FixedPronos sur Vercel en utilisant Supabase comme backend.

## 📋 Prérequis

- Un compte [Vercel](https://vercel.com)
- Un compte [Supabase](https://supabase.com)
- Votre projet FixedPronos sur GitHub (ou GitLab/Bitbucket)

---

## 🗄️ Étape 1: Configuration de la Base de Données Supabase

### 1.1 Appliquer les Migrations SQL

Les migrations SQL se trouvent dans le dossier `supabase/migrations/`. Vous devez les appliquer manuellement dans votre projet Supabase.

1. **Connectez-vous à votre projet Supabase** : https://app.supabase.com
2. **Allez dans SQL Editor** (icône SQL dans le menu de gauche)
3. **Créez une nouvelle requête** et exécutez les migrations dans l'ordre :

#### Migration 1 : Structure principale
```bash
# Copiez le contenu de :
supabase/migrations/20251120123208_83afb0f9-99a2-4384-8f66-2fc57a808ad5.sql
```
- Collez le contenu dans l'éditeur SQL
- Cliquez sur **"Run"** pour exécuter

#### Migration 2 : Corrections de sécurité
```bash
# Copiez le contenu de :
supabase/migrations/20251120123239_7a1643b9-1792-4310-83fd-db7d23074060.sql
```
- Collez le contenu dans l'éditeur SQL
- Cliquez sur **"Run"** pour exécuter

#### Migration 3 : Table de paiements
```bash
# Copiez le contenu de :
supabase/migrations/20251121000000_add_payments_table.sql
```
- Collez le contenu dans l'éditeur SQL
- Cliquez sur **"Run"** pour exécuter

### 1.2 Créer un Compte Admin

Une fois les migrations appliquées, vous devez créer votre premier compte admin :

1. **Dans SQL Editor**, exécutez cette requête (remplacez avec l'email de l'admin) :

```sql
-- D'abord, inscrivez-vous normalement dans l'application
-- Ensuite, exécutez cette requête avec l'ID de l'utilisateur :

INSERT INTO public.user_roles (user_id, role)
VALUES (
  (SELECT id FROM auth.users WHERE email = 'votre-email-admin@example.com'),
  'admin'::public.app_role
);
```

### 1.3 Régénérer les Types TypeScript (CRUCIAL)

**⚠️ ÉTAPE OBLIGATOIRE** - Sans cette étape, l'application ne compilera pas !

Après avoir appliqué les migrations, régénérez les types TypeScript Supabase :

```bash
# Dans votre terminal Replit ou local
npx supabase gen types typescript --project-id votre-project-id > src/integrations/supabase/types.ts
```

> **Où trouver votre project-id ?**  
> Dans l'URL de votre projet Supabase : `https://app.supabase.com/project/VOTRE-PROJECT-ID`

Ensuite, committez les types mis à jour :

```bash
git add src/integrations/supabase/types.ts
git commit -m "Update Supabase types after migrations"
git push origin main
```

### 1.4 Vérifier les Tables

Vérifiez que toutes les tables ont été créées :

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

Vous devriez voir :
- ✅ profiles
- ✅ user_roles
- ✅ subscriptions
- ✅ pronos
- ✅ transactions
- ✅ referrals
- ✅ payments

---

## 🚀 Étape 2: Déploiement sur Vercel

### 2.1 Préparer le Projet

1. **Assurez-vous que votre code est sur GitHub**
   ```bash
   git add .
   git commit -m "Ready for Vercel deployment"
   git push origin main
   ```

### 2.2 Créer un Nouveau Projet sur Vercel

1. Allez sur [vercel.com](https://vercel.com) et connectez-vous
2. Cliquez sur **"Add New Project"**
3. **Importez votre dépôt GitHub**
4. Sélectionnez le repository **FixedPronos**

### 2.3 Configuration du Build

Vercel devrait détecter automatiquement votre configuration Vite. Vérifiez que :

- **Framework Preset**: Vite
- **Root Directory**: `./` (racine)
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

### 2.4 Variables d'Environnement

Dans la section **Environment Variables**, ajoutez les variables suivantes :

#### Variables Supabase (OBLIGATOIRES)
```
VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_ANON_KEY=votre_cle_anon_key_ici
```

> 📍 **Où trouver ces valeurs ?**
> 1. Allez dans votre projet Supabase
> 2. Settings → API
> 3. Copiez "Project URL" → `VITE_SUPABASE_URL`
> 4. Copiez "anon/public key" → `VITE_SUPABASE_ANON_KEY`

#### Variables Admin
```
VITE_ADMIN_EMAILS=votre-email-admin@example.com
```
> Vous pouvez ajouter plusieurs emails séparés par des virgules :
> `admin1@example.com,admin2@example.com`

### 2.5 Déployer

1. Cliquez sur **"Deploy"**
2. Attendez que le build se termine (2-3 minutes)
3. Votre application sera disponible sur : `https://votre-projet.vercel.app`

---

## ✅ Étape 3: Vérifications Post-Déploiement

### 3.1 Tester l'Authentification

1. Accédez à votre application déployée
2. Cliquez sur **"S'inscrire"**
3. Créez un compte avec l'email défini comme admin
4. Vérifiez que vous pouvez vous connecter

### 3.2 Tester l'Accès Admin

1. Connectez-vous avec le compte admin
2. Accédez à `/admin`
3. Vérifiez que vous avez accès au panneau d'administration

### 3.3 Créer un Premier Prono

Dans le panneau admin :
1. Allez dans l'onglet **"Pronos"**
2. Cliquez sur **"Nouveau Prono"**
3. Remplissez le formulaire
4. Publiez le prono
5. Vérifiez qu'il apparaît sur la page d'accueil

---

## 🔧 Configuration des Domaines Personnalisés (Optionnel)

### Ajouter un Domaine

1. Dans Vercel, allez dans **Settings → Domains**
2. Ajoutez votre domaine personnalisé
3. Suivez les instructions pour configurer vos DNS

### Configurer Supabase pour le Domaine Personnalisé

1. Dans Supabase : **Authentication → URL Configuration**
2. Ajoutez votre domaine dans **Site URL**
3. Ajoutez vos URLs de redirection dans **Redirect URLs** :
   ```
   https://votre-domaine.com/dashboard
   https://votre-domaine.com/**
   ```

---

## 📊 Fonctionnalités Disponibles

Après le déploiement, votre application dispose de :

### ✅ Authentification
- Inscription / Connexion avec Supabase Auth
- Gestion des profils utilisateurs
- Système de rôles (user/admin)

### ✅ Pronos
- Affichage des pronos publiés
- Filtrage par date
- Statistiques de performance

### ✅ Administration
- Gestion des pronos (CRUD)
- Gestion des utilisateurs
- Gestion des abonnements
- Suivi des paiements

### ✅ Système de Parrainage
- Code de parrainage unique par utilisateur
- Commissions sur les parrainages
- Historique des filleuls

---

## 🐛 Dépannage

### Erreur : "Could not find table 'pronos'"
**Solution** : Les migrations n'ont pas été appliquées. Retournez à l'Étape 1.1.

### Erreur : "Invalid Supabase URL"
**Solution** : Vérifiez que `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY` sont correctement configurés dans Vercel.

### L'accès admin ne fonctionne pas
**Solution** : 
1. Vérifiez que `VITE_ADMIN_EMAILS` contient bien votre email
2. Vérifiez que vous avez exécuté la requête SQL pour créer le rôle admin (Étape 1.2)

### Build échoue sur Vercel
**Solution** :
1. Vérifiez les logs de build dans Vercel
2. Assurez-vous que toutes les dépendances sont dans `package.json`
3. Essayez de rebuilder en cliquant sur **"Redeploy"**

---

## 📝 Prochaines Étapes

Une fois déployé, vous pouvez :

1. **Importer vos données existantes** depuis PostgreSQL vers Supabase
2. **Configurer un système de paiement** (Stripe, PayPal)
3. **Ajouter des fonctionnalités** :
   - Notifications par email
   - API pour applications mobiles
   - Analytics et statistiques avancées

---

## 🆘 Support

Si vous rencontrez des problèmes :

1. **Documentation Vercel** : https://vercel.com/docs
2. **Documentation Supabase** : https://supabase.com/docs
3. **Communauté Supabase** : https://github.com/supabase/supabase/discussions

---

## 🎉 Félicitations !

Votre application FixedPronos est maintenant déployée sur Vercel avec Supabase ! 🚀

Vous pouvez maintenant :
- ✅ Gérer vos pronos depuis n'importe où
- ✅ Scaler automatiquement avec la demande
- ✅ Bénéficier d'une infrastructure mondiale (CDN)
- ✅ Avoir des mises à jour automatiques via GitHub

**Bon business ! 💰**
