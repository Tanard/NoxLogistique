# PROJECT_STATE — Logisticore

## Stack
- React 19 + Vite 8
- Supabase (auth + base de données + Realtime)
- Tailwind CSS v4
- Leaflet / react-leaflet (carte)
- lucide-react (icônes)
- Vercel Analytics

## Navigation
React Router v6 — routes URL avec lazy loading des pages.

| Path | Page | Accès |
|------|------|-------|
| `/dashboard` | DashboardPage | Auth requise |
| `/todo` | TodoPage | Auth requise |
| `/map` | MapPage | Auth requise |
| `/admin` | AdminPage | Admin uniquement |
| `/login` | LoginPage | Non authentifié |
| `/` et `*` | → redirect `/dashboard` | — |

## Composants existants

| Composant | Fichier | Rôle |
|-----------|---------|------|
| LoadingScreen | `components/LoadingScreen.jsx` | Écran de chargement initial (affiché une seule fois) |
| Sidebar | `components/Sidebar.jsx` | Navigation principale |
| ErrorBlock | `components/ui/ErrorBlock.jsx` | Affichage d'erreur inline |
| Modal | `components/ui/Modal.jsx` | Base modale réutilisable — props : `open`, `onClose`, `onConfirm` (Enter → valide, sauf textarea) |
| PasswordInput | `components/ui/PasswordInput.jsx` | Input mot de passe avec toggle visibilité |
| PoleBadge | `components/ui/PoleBadge.jsx` | Badge coloré par pôle |
| StatutBadge | `components/ui/StatutBadge.jsx` | Badge statut d'un besoin |
| TodoStatutBadge | `components/ui/TodoStatutBadge.jsx` | Badge statut d'une todo |
| BtnPrimary / BtnSecondary / BtnDanger / BtnSoft | `components/ui/buttons.jsx` | Boutons standards |
| DeleteConfirm | `components/ui/DeleteConfirm.jsx` | Pattern confirmation suppression unifié |
| SortableHeader | `components/ui/SortableHeader.jsx` | En-tête de colonne cliquable avec indicateur tri |
| TopBar | `components/ui/TopBar.jsx` | Barre utilisateur/festival/déconnexion — standard sur toutes les pages |
| PageLayout / PageHeader | `components/ui/PageLayout.jsx` | Wrapper page + titre standard |
| RoleBadge | `components/ui/RoleBadge.jsx` | Badge coloré selon rôle (admin/responsable/viewer) |

## Modales existantes

| Modale | Fichier | Rôle |
|--------|---------|------|
| ModalDetail | `modals/ModalDetail.jsx` | Détail / édition d'un besoin — toujours éditable, Valider/Fermer |
| ModalFestivalSelect | `modals/ModalFestivalSelect.jsx` | Sélection du festival actif |
| ModalNouveau | `modals/ModalNouveau.jsx` | Création d'un nouveau besoin |
| ModalNouvelleEntree | `modals/ModalNouvelleEntree.jsx` | Création **et** édition d'une zone ou d'un article (prop `entree` pour mode édition) |
| ModalSetPassword | `modals/ModalSetPassword.jsx` | Définition du mot de passe (invitation / reset) |
| ModalTodo | `modals/ModalTodo.jsx` | Création / édition d'une todo |
| ModalUser | `modals/ModalUser.jsx` | Gestion d'un utilisateur (admin) |

## Hooks existants

| Hook | Fichier | Rôle |
|------|---------|------|
| useAuth | `hooks/useAuth.js` | Auth Supabase, rôles (isAdmin, isEditor) |
| useBesoins | `hooks/useBesoins.js` | CRUD besoins + Realtime — delete optimiste (retire de l'état local immédiatement) |
| useZones | `hooks/useZones.js` | CRUD zones par festival — retourne `{ zones, addZone, updateZone }` ; zones = `{id, nom, commentaire}[]` |
| useArticles | `hooks/useArticles.js` | CRUD articles par festival — retourne `{ articles, addArticle, updateArticle }` ; articles = `{id, nom, commentaire}[]` |
| useFestival | `hooks/useFestival.js` | Festivals accessibles, festival actif |
| useFestivalMap | `hooks/useFestivalMap.js` | Données carte du festival |
| useFestivalMembers | `hooks/useFestivalMembers.js` | Noms des membres du festival actif (autocomplétion) |
| useTodos | `hooks/useTodos.js` | CRUD todos + Realtime |
| useUsers | `hooks/useUsers.js` | Gestion utilisateurs (admin) |

## Conventions établies

- **Nommage** : PascalCase pour les composants/modales, `useX` pour les hooks
- **État** : useState local + hooks custom — pas de Context, Zustand ni Redux
- **Styles** : Tailwind CSS v4 (classes utilitaires) + inline styles pour couleurs dynamiques tirées de `constants/index.js`
- **Couleurs** : centralisées dans `constants/index.js` (objet `COLORS`) — `BTN_DARK = '#111111'` (même noir que sidebar) utilisé sur les boutons d'action du dashboard
- **Constantes métier** : toutes dans `constants/index.js` (POLES, STATUTS, TODO_STATUTS, NAV_ITEMS, MAP_ELEMENTS, etc.)
- **Données** : abonnements Supabase Realtime dans les hooks, pas d'appels fetch directs dans les composants
- **Rôles** : `admin`, `pole_manager`, `viewer` — exposés via `useAuth` comme `isAdmin` / `isEditor`
- **Enter pour valider** : prop `onConfirm` sur `Modal` — déclenché par Enter sauf depuis textarea

## Domaine métier

Logistique événementielle multi-festivals. Gestion des besoins matériels par pôle (Bénévole, Restauration, Artiste, Sécurité, Logistique), suivi de tâches (todos), et carte technique géolocalisée du site.

## Schéma Supabase — tables à créer / modifier

```sql
-- Zones par festival
CREATE TABLE zones (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  festival_id uuid NOT NULL,
  nom text NOT NULL,
  commentaire text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE zones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "zones_all" ON zones FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Articles par festival
CREATE TABLE articles (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  festival_id uuid NOT NULL,
  nom text NOT NULL,
  commentaire text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "articles_all" ON articles FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Si les tables existaient sans commentaire :
ALTER TABLE zones ADD COLUMN commentaire text;
ALTER TABLE articles ADD COLUMN commentaire text;

-- Colonne zone sur besoins (si pas encore créée) :
ALTER TABLE besoins ADD COLUMN zone TEXT;
```

## Historique des features

| Date | Feature | Fichiers modifiés | Patterns introduits |
|------|---------|-------------------|---------------------|
| 2026-04-21 | Initialisation PROJECT_STATE.md | PROJECT_STATE.md | — |
| 2026-04-21 | Design system + standardisation | buttons.jsx, DeleteConfirm.jsx, SortableHeader.jsx, TopBar.jsx, PageLayout.jsx, RoleBadge.jsx | Composants UI partagés |
| 2026-04-21 | Standardisation pages + corrections | App.jsx, DashboardPage.jsx, TodoPage.jsx, AdminPage.jsx, ModalDetail.jsx, ModalNouveau.jsx, ModalTodo.jsx, supabase.js, useFestivalMembers.js | TopBar sur toutes les pages, SortableHeader Admin, tri par défaut, StatusCycler en liste, Zone sur les besoins |
| 2026-04-21 | Migration React Router v6 | package.json, main.jsx, App.jsx, Sidebar.jsx | Routes URL, lazy loading pages, NavLink sidebar, protection route /admin |
| 2026-04-21 | Corrections audit (points 5-8) | AdminPage.jsx, Modal.jsx, TodoPage.jsx | AdminPage migré sur PageLayout ; aria-label="Fermer" ; zébrage i%2===0 ; guard ?? '' tri TodoPage |
| 2026-05-05 | Refonte module Nouveau Besoin | ModalNouveau.jsx, DashboardPage.jsx, App.jsx, useZones.js, useArticles.js, ModalNouvelleEntree.jsx | Zone et Article = listes déroulantes depuis Supabase ; Suppléments conditionnel (checkbox) ; Commentaire (ex Caractéristique technique) ; boutons Nouvelle Zone / Nouvel Article ; vue switchable besoins/zones/articles |
| 2026-05-05 | Refonte ModalDetail | ModalDetail.jsx | Toujours éditable (sans bouton Modifier) ; layout Pôle/Zone/Date/Statut → Article/Quantité → Suppléments → Commentaire ; selects zone et article depuis listes Supabase ; Fermer = annule, Valider = sauvegarde |
| 2026-05-05 | Fix suppression besoin | useBesoins.js | Delete optimiste — retire de l'état local immédiatement sans attendre Realtime |
| 2026-05-05 | Tables zones/articles cliquables | DashboardPage.jsx, ModalNouvelleEntree.jsx, useZones.js, useArticles.js | Clic ligne → ModalNouvelleEntree en mode édition ; headers triables ; champ commentaire sur zones et articles |
| 2026-05-05 | Enter pour valider | Modal.jsx + tous les modaux | prop `onConfirm` sur Modal — Enter déclenche validation sauf depuis textarea |
| 2026-05-05 | Prix unitaire sur les besoins | supabase.js, ModalNouveau.jsx, ModalDetail.jsx, DashboardPage.jsx | Champ `prix` (numeric, unitaire) ; total = prix × quantité ; encadrés Budget Prévisionnel + Besoins chiffrés |
| 2026-05-05 | Onglet Planning | PlanningPage.jsx, ModalNouvelEvent.jsx, usePlanningEvents.js, supabase.js, App.jsx, constants/index.js | Calendrier react-big-calendar (mois/semaine/jour) ; double-clic créneau → création ; CRUD événements Supabase Realtime |
| 2026-05-06 | Audit qualité + corrections | eslint.config.js, App.jsx, Sidebar.jsx, useFestival.js, PlanningPage.jsx, ModalDetail.jsx, ModalNouveau.jsx, DashboardPage.jsx, constants/index.js | 0 erreur ESLint ; `COLOR_SIDEBAR` centralisé dans constants ; sorts mémorisés avec useMemo ; budget mémorisé ; gestion erreur delete ModalNouvelEvent ; audit.sh + skill /audit-logisticore |

## Décisions techniques

- Migration vers React Router v6 (2026-04-21) — bénéfices : F5 conserve la page, partage d'URL, code splitting par route, Vercel Analytics par page.
- `ROLE_CONFIG` centralisé dans `constants/index.js` (déplacé depuis `AdminPage.jsx`) pour éviter un import circulaire avec `ModalUser`.
- Festival actif persisté en `localStorage` sous la clé `logisticore_festival_id`.
- `useFestivalMembers` query `festival_members` JOIN `profiles` — si RLS bloque les non-admins, l'autocomplétion retourne un tableau vide sans casser le champ.
- Zones et articles stockés en Supabase par festival (`festival_id`) — format `{id, nom, commentaire}`. Les selects utilisent `nom` comme valeur (c'est ce qui est stocké dans le besoin).
- `ModalNouvelleEntree` gère création et édition via prop optionnelle `entree` — si fournie, pré-remplit le formulaire et affiche "Modifier".
- Delete besoin optimiste depuis 2026-05-05 : `setBesoins(prev => prev.filter(...))` appelé immédiatement après succès Supabase, sans attendre l'event Realtime.
- `SORT_KEYS` dans constants : clé `'Article'` (ex `'Désignation'`) mappe vers colonne DB `designation`.
