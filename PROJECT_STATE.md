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
| Modal | `components/ui/Modal.jsx` | Base modale réutilisable |
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
| ModalDetail | `modals/ModalDetail.jsx` | Détail / édition d'un besoin |
| ModalFestivalSelect | `modals/ModalFestivalSelect.jsx` | Sélection du festival actif |
| ModalNouveau | `modals/ModalNouveau.jsx` | Création d'un nouveau besoin |
| ModalSetPassword | `modals/ModalSetPassword.jsx` | Définition du mot de passe (invitation / reset) |
| ModalTodo | `modals/ModalTodo.jsx` | Création / édition d'une todo |
| ModalUser | `modals/ModalUser.jsx` | Gestion d'un utilisateur (admin) |

## Hooks existants

| Hook | Fichier | Rôle |
|------|---------|------|
| useAuth | `hooks/useAuth.js` | Auth Supabase, rôles (isAdmin, isEditor) |
| useBesoins | `hooks/useBesoins.js` | CRUD besoins + Realtime |
| useFestival | `hooks/useFestival.js` | Festivals accessibles, festival actif |
| useFestivalMap | `hooks/useFestivalMap.js` | Données carte du festival |
| useFestivalMembers | `hooks/useFestivalMembers.js` | Noms des membres du festival actif (autocomplétion) |
| useTodos | `hooks/useTodos.js` | CRUD todos + Realtime |
| useUsers | `hooks/useUsers.js` | Gestion utilisateurs (admin) |

## Conventions établies

- **Nommage** : PascalCase pour les composants/modales, `useX` pour les hooks
- **État** : useState local + hooks custom — pas de Context, Zustand ni Redux
- **Styles** : Tailwind CSS v4 (classes utilitaires) + inline styles pour couleurs dynamiques tirées de `constants/index.js`
- **Couleurs** : centralisées dans `constants/index.js` (objet `COLORS`)
- **Constantes métier** : toutes dans `constants/index.js` (POLES, STATUTS, TODO_STATUTS, NAV_ITEMS, MAP_ELEMENTS, etc.)
- **Données** : abonnements Supabase Realtime dans les hooks, pas d'appels fetch directs dans les composants
- **Rôles** : `admin`, `pole_manager`, `viewer` — exposés via `useAuth` comme `isAdmin` / `isEditor`

## Domaine métier

Logistique événementielle multi-festivals. Gestion des besoins matériels par pôle (Bénévole, Restauration, Artiste, Sécurité, Logistique), suivi de tâches (todos), et carte technique géolocalisée du site.

## Historique des features

| Date | Feature | Fichiers modifiés | Patterns introduits |
|------|---------|-------------------|---------------------|
| 2026-04-21 | Initialisation PROJECT_STATE.md | PROJECT_STATE.md | — |
| 2026-04-21 | Design system + standardisation | buttons.jsx, DeleteConfirm.jsx, SortableHeader.jsx, TopBar.jsx, PageLayout.jsx, RoleBadge.jsx | Composants UI partagés |
| 2026-04-21 | Standardisation pages + corrections | App.jsx, DashboardPage.jsx, TodoPage.jsx, AdminPage.jsx, ModalDetail.jsx, ModalNouveau.jsx, ModalTodo.jsx, supabase.js, useFestivalMembers.js | TopBar sur toutes les pages, SortableHeader Admin, tri par défaut (besoins=pôle, admin=rôle, todo=statut), StatusCycler en liste, Zone sur les besoins, assigné optionnel + autocomplétion todo |
| 2026-04-21 | Migration React Router v6 | package.json, main.jsx, App.jsx, Sidebar.jsx | Routes URL, lazy loading pages, NavLink sidebar, protection route /admin |

## Décisions techniques

- Migration vers React Router v6 (2026-04-21) — bénéfices : F5 conserve la page, partage d'URL, code splitting par route, Vercel Analytics par page.
- `ROLE_CONFIG` centralisé dans `constants/index.js` (déplacé depuis `AdminPage.jsx`) pour éviter un import circulaire avec `ModalUser`.
- Festival actif persisté en `localStorage` sous la clé `logisticore_festival_id`.
- `onCycleStatut` injecté depuis `App.jsx` vers chaque page liste (DashboardPage, TodoPage) — cycle de statut sans ouvrir la modale.
- `useFestivalMembers` query `festival_members` JOIN `profiles` — si RLS bloque les non-admins, l'autocomplétion retourne un tableau vide sans casser le champ.
- Champ `zone` (texte libre) sur les besoins : colonne SQL à ajouter en Supabase (`ALTER TABLE besoins ADD COLUMN zone TEXT`).
