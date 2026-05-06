# Principes de Codage — Logisticore

## 1. Architecture

**Séparation des responsabilités**
- `hooks/` : accès données, état serveur, logique métier
- `components/ui/` : composants visuels purs, sans état serveur
- `pages/` : assemblage, reçoivent données + callbacks en props — zéro fetch direct
- `modals/` : formulaires avec état local, sauvegarde via callbacks
- `App.jsx` : orchestrateur central — état global, routing, modals

**Règle de flux** : les données descendent (props), les événements remontent (callbacks). Aucune page ne connaît Supabase directement.

---

## 2. Composants

**Un composant = une responsabilité**. Si un composant fait plus de 200 lignes, questionner le découpage.

**Props plutôt qu'état global**. Éviter les contextes React sauf si la prop drilling dépasse 3 niveaux.

**Pas de logique dans le JSX**. Extraire les calculs complexes en variables ou fonctions avant le `return`.

**Pas de commentaires évidents**. Un bon nommage suffit. Commenter uniquement : une contrainte cachée, un contournement de bug, une invariante non-intuitive.

---

## 3. Performance

**`useMemo`** sur les listes filtrées/triées dont les dépendances sont stables. Pas sur les valeurs simples.

**`useCallback`** sur les fonctions passées en props à des composants lourds, ou dans les dépendances de `useEffect`.

**`lazy()` + `Suspense`** pour toutes les pages (déjà en place). Maintenir ce pattern pour toute nouvelle page.

**Pas de re-render inutile** : les `useEffect` doivent avoir des tableaux de dépendances précis. Jamais de tableau vide `[]` sans comprendre pourquoi.

---

## 4. Sécurité

**Jamais de `service_role` key côté client.** Toute opération privilégiée passe par une Edge Function Supabase.

**RLS sur toutes les tables.** Toute nouvelle table doit avoir `ENABLE ROW LEVEL SECURITY` et ses politiques avant d'être utilisée.

**Validation côté serveur.** La validation client (formulaires) est UX, pas sécurité. Les Edge Functions revalident systématiquement.

**Variables d'environnement uniquement.** Aucune clé, URL ou secret en dur dans le code. Utiliser `.env` (gitignorĂ©).

---

## 5. Base de données (Supabase)

**Migrations séquentielles** : un fichier par migration, nommé `YYYYMMDD_NNN_description.sql`. Ne jamais modifier une migration déjà appliquée.

**Cascade explicite** : toutes les foreign keys définissent `ON DELETE CASCADE` ou `ON DELETE RESTRICT` selon l'intention.

**Fonctions `SECURITY DEFINER`** uniquement pour les helpers RLS. Les nommer clairement (`is_festival_admin`, `can_edit_festival`).

**Realtime** : activer `supabase_realtime` uniquement sur les tables qui en ont besoin (`besoins`, `todos`, `festival_maps`).

---

## 6. Style (Tailwind)

**Tailwind en priorité** sur les classes custom. N'ajouter une classe CSS custom que si Tailwind ne peut pas l'exprimer proprement.

**Pas d'inline styles sauf** pour les couleurs dynamiques calculées en JS (couleurs de pôles, statuts). Pour tout le reste, utiliser les utilitaires Tailwind.

**Tokens CSS variables** pour les couleurs sémantiques (`--color-accent`, `--color-sidebar`…). Ne pas hardcoder les hex sauf dans `constants/index.js` (source de vérité).

**`@layer components`** pour les classes réutilisables multi-contextes (`.input-light`, `.badge`). Cela permet aux utilitaires Tailwind de les surcharger.

---

## 7. Nommage

| Élément | Convention | Exemple |
|---|---|---|
| Composant | PascalCase | `PoleBadge`, `ModalDetail` |
| Hook | camelCase + `use` | `useBesoins`, `useFestival` |
| Fonction handler | `handle` + action | `handleSave`, `handleSort` |
| Variable booléenne | `is` / `has` / `show` | `isAdmin`, `hasError`, `showNew` |
| Constante module | UPPER_SNAKE | `POLES`, `STATUTS`, `DEFAULT_SORT_CHAIN` |
| Fichier composant | PascalCase `.jsx` | `SortableHeader.jsx` |
| Fichier hook | camelCase `.js` | `useAuth.js` |

---

## 8. Gestion des erreurs

**Pas d'erreurs silencieuses.** Tout `catch` doit au minimum `console.error` avec contexte.

**Feedback utilisateur systématique.** Toute opération asynchrone qui peut échouer doit utiliser `showToast` en cas d'erreur.

**`try/finally` sur les loaders.** Le `setSaving(false)` ou `setLoading(false)` va toujours dans `finally`, jamais seulement dans le `try`.

---

## 9. Éco-conception applicative

**DOM allégé** : pas de wrappers `<div>` inutiles. Préférer les Fragments `<>` quand le wrapper n'a pas de rôle sémantique.

**Pas de dépendances superflues.** Avant d'ajouter un package, vérifier si la fonctionnalité est faisable en natif (200 lignes de code valent mieux qu'une dépendance de 50 ko).

**Requêtes Supabase ciblées.** Sélectionner uniquement les colonnes nécessaires (`.select('id, name, statut')` plutôt que `.select('*')`).

**Realtime sélectif.** Un channel Realtime par table nécessaire, fermé proprement dans le `return` du `useEffect`.
