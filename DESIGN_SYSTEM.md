# Système de Design — Logisticore

## 1. Philosophie

**Éco-conception** : chaque décision visuelle réduit le coût de rendu et la charge cognitive.
- Flat design : zéro ombre portée complexe, zéro dégradé
- Polices système uniquement : zéro requête réseau pour la typographie
- Fond blanc : rendu natif, contraste maximal, pas de sur-traitement GPU
- Séparation par bordures fines, jamais par `box-shadow` lourd

**Règle d'or** : l'interface s'efface devant le contenu. Un élément visuel qui n'aide pas à comprendre ou agir n'a pas sa place.

---

## 2. Palette de Couleurs

### Tokens principaux (`src/index.css`)

| Token | Valeur | Usage |
|---|---|---|
| `--color-accent` | `#7C3AED` | CTA principaux, état actif, liens |
| `--color-app-bg` | `#FFFFFF` | Fond général du contenu |
| `--color-sidebar` | `#F8F9FA` | Fond sidebar et navigation |
| `--color-card` | `#FFFFFF` | Fond des modals |
| `--color-app-text` | `#1A1A1A` | Texte principal |
| `--color-table-hd` | `#F7F7F7` | En-tête des tableaux |
| `--color-border` | `#EAEAEA` | Bordures de séparation |

### Couleurs sémantiques

**Pôles** — identité visuelle de chaque pôle, utilisée avec parcimonie :

| Pôle | Couleur |
|---|---|
| Artiste | `#FB923C` (orange) |
| Bénévole | `#8B5CF6` (violet) |
| Logistique | `#60A5FA` (bleu) |
| Restauration | `#F472B6` (rose) |
| Sécurité | `#34D399` (vert) |

**Statuts besoins** — modèle pastille + texte :

| Statut | Pastille |
|---|---|
| En attente | `#F97316` (orange) |
| Validé | `#10B981` (vert) |
| Annulé | `#EF4444` (rouge) |

**Statuts tâches** :

| Statut | Pastille |
|---|---|
| À faire | `#F97316` (orange) |
| En cours | `#3B82F6` (bleu) |
| Terminé | `#10B981` (vert) |

**Rôles** :

| Rôle | Texte | Fond badge |
|---|---|---|
| Admin | `#7C3AED` | violet 13% |
| Responsable | `#EA580C` | orange 13% |
| Viewer | `#475569` | gris ardoise 13% |

**Neutres courants** :

| Usage | Valeur Tailwind |
|---|---|
| Texte principal | `text-gray-900` |
| Texte secondaire | `text-gray-600` |
| Texte tertiaire / labels | `text-gray-500` |
| Texte inactif / métadonnées | `text-gray-400` |
| Bordures | `border-gray-200` |
| Fond secondaire | `bg-gray-50` |
| Fond hover | `bg-gray-100` |

---

## 3. Typographie

### Pile native (zéro chargement réseau)
```
system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif
```

### Échelle

| Usage | Classe Tailwind |
|---|---|
| Titre page | `text-2xl font-bold` |
| Titre modal | `text-xl font-bold` |
| Label section | `text-xs font-semibold uppercase tracking-wider` |
| Corps principal | `text-sm` |
| Métadonnées (date, zone) | `text-[11px] text-gray-400` |
| Badge | `text-xs font-semibold` |

---

## 4. Surfaces & Élévation

### Règle
- **Séparation** : `1px solid #EAEAEA` ou `border-gray-200`
- **Aucun** `shadow-xl`, `shadow-2xl` sur les composants de contenu
- **Acceptable** : `shadow-sm` sur les cartes mobiles uniquement (contexte scroll)

### Conteneurs typiques

```
Carte section modal   : rounded-xl p-4 bg-gray-50 border border-gray-200
Tableau               : rounded-xl overflow-hidden bg-white border border-gray-200
Modal                 : rounded-2xl p-6 bg-white border border-gray-200
Input (clair)         : .input-light → border-gray-200, bg-white, focus:ring-accent
```

---

## 5. Composants

### Badges

**StatutBadge** — Pastille + texte (WCAG AA)
```
● <couleur>  Libellé statut   (texte gray-700, fond transparent)
```

**PoleBadge** — Soft badge
```
[icône]  Nom pôle   (texte = couleur pôle, fond = couleur pôle à 10%)
```

**RoleBadge** — Pill coloré
```
Fond = couleur rôle à 13%, texte = couleur rôle, bordure = couleur rôle à 38%
```

### Boutons

| Composant | Usage |
|---|---|
| `BtnPrimary` | CTA principal : sauvegarder, confirmer |
| `BtnSecondary` | Annuler, fermer |
| `BtnDanger` | Supprimer (texte rouge, fond rouge au hover) |
| `BtnSoft` | Actions secondaires : changer festival, reset mdp |
| `BtnCycle` | Wrapper pour badges interactifs (cycle statut/rôle) |

### Cartes KPI (filtres pôle)

```
Normal   : fond pôle 5% + bordure pôle + texte sombre
Hover    : fond pôle 10%
Actif    : fond pôle plein + texte blanc
```

---

## 6. Règles d'usage

### Violet accent (`#7C3AED`)
- ✅ Bouton CTA principal ("+ Nouveau Besoin", "Valider", "Connexion")
- ✅ Lien actif dans la sidebar
- ✅ Focus ring sur les inputs
- ✅ Badge Admin sur la TopBar
- ❌ Titres décoratifs, icônes passives, fonds de section

### Couleurs de pôle
- ✅ Bordure et fond léger sur les cartes KPI
- ✅ Texte et fond du `PoleBadge`
- ❌ Gros aplats pleins (réservé uniquement à l'état actif du filtre)

### Ombres
- ✅ Overlay modal : `bg-black/40 backdrop-blur-sm`
- ❌ `box-shadow` sur les composants de contenu

---

## 7. Accessibilité (WCAG)

- **Statuts** : jamais couleur seule → toujours pastille + libellé texte
- **Contraste** : texte `#1A1A1A` sur fond `#FFFFFF` = ratio 16:1 (AAA)
- **Focus visible** : `focus:ring-2 focus:ring-accent` sur tous les inputs et boutons interactifs
- **Labels** : chaque champ de formulaire possède un `<label>` explicite
- **Aria** : boutons iconiques = `aria-label` (ex: fermer modal, déconnexion)
