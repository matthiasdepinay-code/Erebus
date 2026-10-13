# Erebus

Créateur d'armes à feu modulaire pour un jeu réaliste. On assemble une arme pièce par pièce
(carcasse, canon, culasse, système à gaz, crosse, garde-main, bouche, silencieux, optiques…) et
toutes les statistiques de jeu sont **calculées** à partir de la physique des pièces au lieu d'être
saisies à la main.

## Démarrer

```bash
npm install
npm run dev        # éditeur sur http://localhost:5173
npm test           # tests du moteur
npm run build      # build + dist/atelier-erebus.html (fichier unique, sans serveur)
```

## Organisation

| Dossier | Rôle |
|---|---|
| `src/engine/` | Moteur de calcul pur, sans dépendance. Partagé entre l'éditeur et le jeu. |
| `src/engine/data/` | Catalogue : matériaux, calibres, pièces, armes d'exemple. |
| `src/editor/` | Éditeur web (TypeScript + DOM, construit avec Vite). |
| `test/` | Tests Vitest du moteur. |
| `docs/` | Document de conception. |

## Ce que calcule le moteur

- **Montage** : fixations compatibles, emplacements requis, calibre accepté par chaque pièce, place disponible sur les rails, garde-main qui dépasse, bloc gaz à découvert.
- **Masse et équilibre** : masse à vide et chargée (munitions comprises), centre de gravité, moment d'inertie autour de la main forte, couple porté par le bras faible.
- **Balistique** : vitesse initiale selon la longueur du canon, trajectoire point-matériel avec traînée G1, zérotage, chute, énergie, dérive au vent, portée efficace.
- **Précision** : qualité et profil du canon, garde-main flottant ou non, rigidité de la carcasse, détente, erreur du tireur selon l'optique et l'appui.
- **Recul** : impulsion et énergie de recul libre, recul vertical et horizontal, montée de bouche, effet des freins, compensateurs, silencieux et de l'absence de crosse.
- **Gaz et fiabilité** : indice de gaz selon la prise de gaz et le calibre, suralimentation par silencieux, bloc réglable, coups moyens entre incidents et répartition des incidents, vie du canon.
- **Tir** : cadence, capacité, niveau sonore.

## Format d'export

L'éditeur exporte un JSON `erebus-arme/0.2` qui contient l'arbre de pièces (`arme`) et la fiche
calculée (`fiche`). Le jeu peut soit relire la fiche, soit recalculer avec le même moteur.
