# 🚀 Nox Logistique — Setup Supabase (Phase 0)

Guide pas-à-pas pour activer la base de données Supabase (temps réel + auth + multi-tenant).

---

## 1. Créer le projet Supabase

1. Va sur [supabase.com](https://supabase.com) → **Start your project** (gratuit, pas de CB)
2. Connecte-toi avec GitHub
3. **New project** :
   - **Name** : `nox-logistique`
   - **Database password** : génère un mot de passe fort, **garde-le dans un gestionnaire**
   - **Region** : `West EU (Paris)` ← important pour latence + RGPD
   - **Plan** : Free

⏱️ Création : ~2 minutes.

---

## 2. Exécuter le schéma SQL

1. Dans Supabase → **SQL Editor** (menu de gauche) → **+ New query**
2. Ouvre le fichier [`migrations/20260414_001_initial_schema.sql`](./migrations/20260414_001_initial_schema.sql) de ce repo
3. Copie **tout le contenu** et colle-le dans l'éditeur
4. Clique **Run** (ou `Cmd+Enter`)

✅ Résultat attendu : *"Success. No rows returned"*

Ça crée :
- 4 tables (`festivals`, `profiles`, `festival_members`, `besoins`)
- Les types enum (rôles, statuts, pôles)
- Les policies RLS multi-tenant
- Les triggers (auto-profile, updated_at, auto-join festival)
- L'activation Realtime
- Les 6 besoins d'exemple dans le festival Nox 2026

---

## 3. Configurer les variables d'environnement

1. Dans Supabase → **Settings → API**
2. Copie les deux valeurs :
   - **Project URL** : `https://xxxxx.supabase.co`
   - **anon public** key : `eyJhbGc...` (clé publique, safe côté client)

3. Dans le dossier `Logisticore/`, crée un fichier `.env` :

```bash
VITE_SUPABASE_URL=https://TON_PROJECT_ID.supabase.co
VITE_SUPABASE_ANON_KEY=TA_ANON_KEY
VITE_DEFAULT_FESTIVAL_ID=00000000-0000-0000-0000-000000000001
```

4. Ajoute `.env` au `.gitignore` s'il n'y est pas déjà (sinon la clé sera committée — elle est publique mais bonne pratique de la sortir du repo).

---

## 4. Configurer l'auth

Par défaut, Supabase exige la confirmation email. Pour tester rapidement :

1. **Authentication → Providers → Email**
2. Option rapide dev : désactive **"Confirm email"**
3. Pour production : garde-le activé et configure ton SMTP personnalisé

---

## 5. Lancer l'app

```bash
cd Logisticore
npm install    # @supabase/supabase-js déjà installé
npm run dev
```

Ouvre [http://localhost:5173](http://localhost:5173).

---

## 6. Créer le premier admin

1. Clique **Connexion → Créer un compte**
2. Renseigne email + mot de passe (6 caractères min) + nom complet
3. Connecte-toi avec ces identifiants

⚠️ **Tu es `viewer` par défaut** — tu peux voir mais pas modifier.

Pour te donner les droits admin :

1. Supabase → **Table Editor → festival_members**
2. Trouve ta ligne (par `user_id`)
3. Change le champ `role` de `viewer` → `admin`
4. Recharge l'app — tu as maintenant tous les droits + badge "Admin"

---

## 7. Tester la sync temps réel

1. Ouvre l'app dans **2 navigateurs** (ou 2 profils) avec **2 comptes différents** (promu admin tous les deux)
2. Crée un besoin dans l'un → il apparaît instantanément dans l'autre
3. Modifie un statut dans l'un → mise à jour immédiate dans l'autre

✅ **Sync temps réel opérationnelle.**

---

## Architecture créée

```
auth.users (Supabase géré)
    │
    ├─→ profiles (nom, avatar) [1-1]
    │
    └─→ festival_members (rôle par festival) [N-N]
            │
            └─→ festivals (Nox 2026 + futurs)
                    │
                    └─→ besoins (données métier, RLS multi-tenant)
```

**Rôles supportés :**
- `admin` : tout (créer, modifier, supprimer besoins + gérer membres)
- `pole_manager` : créer et modifier besoins (pas supprimer)
- `viewer` : lecture seule

**Sécurité :** Chaque requête est automatiquement filtrée par `festival_id` via Row Level Security. Un user ne peut techniquement voir que les festivals où il est membre — même avec une injection SQL, les données des autres festivals sont inaccessibles.

---

## Problèmes fréquents

**❌ "Variables manquantes dans .env"**
→ Le fichier `.env` n'est pas à la racine de `Logisticore/`, ou le dev server n'a pas été relancé après création du fichier. Kill le serveur (`Ctrl+C`) et relance.

**❌ "permission denied for table besoins"**
→ Tu n'es pas connecté, ou tu n'es pas membre du festival. Vérifie dans `festival_members` que ta ligne existe avec le bon `festival_id`.

**❌ Sync realtime ne fonctionne pas**
→ Vérifie dans Supabase → **Database → Publications** que `supabase_realtime` contient bien `besoins`.

**❌ "Invalid login credentials"**
→ Email non confirmé. Va dans **Authentication → Users**, clique sur l'utilisateur, **... → Confirm email**.
