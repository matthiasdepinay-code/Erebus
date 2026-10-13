# Erebus : créateur d'armes à feu, document de conception v0.2

## Vision

Un éditeur où le joueur (ou le game designer) assemble une arme pièce par pièce. Chaque pièce a des propriétés physiques plausibles (masse, longueur, matériau, centre de gravité) et les statistiques de jeu de l'arme en découlent, au lieu d'être des chiffres posés à la main. Une arme lourde et longue est stable mais lente à manier ; une arme courte et légère est vive mais remonte plus au tir.

Le projet se concentre sur les **armes à feu**, avec un niveau de détail élevé. Références de gameplay : l'atelier d'armes d'Escape from Tarkov, le Gunsmith de Ghost Recon, Arma.

Le réalisme visé est celui du **comportement en jeu** (poids, équilibre, recul, usure, maniabilité), pas celui de la fabrication réelle : les pièces sont des objets de jeu, pas des plans techniques.

## Architecture proposée

```
┌──────────────────────────┐      ┌─────────────────────┐      ┌──────────────────┐
│  Données (JSON)          │      │  Moteur de calcul   │      │  Éditeur (UI)    │
│  - pièces                │ ───► │  (bibliothèque pure,│ ◄──► │  - assemblage    │
│  - matériaux             │      │   sans dépendance)  │      │  - stats live    │
│  - règles d'emboîtement  │      │                     │      │  - vue 2D/3D     │
└──────────────────────────┘      └─────────┬───────────┘      └──────────────────┘
                                            │ export
                                            ▼
                                  ┌─────────────────────┐
                                  │  Jeu (Unity/Unreal/ │
                                  │  Godot) : même JSON │
                                  │  + même formules    │
                                  └─────────────────────┘
```

1. **Données** : les pièces, matériaux et emplacements sont décrits en JSON. Ajouter une pièce ne demande aucun code.
2. **Moteur de calcul** : une bibliothèque pure (entrée : un assemblage, sortie : des stats). Elle est partagée entre l'éditeur et le jeu, pour que l'arme se comporte en jeu exactement comme l'éditeur l'annonce.
3. **Éditeur** : interface qui charge les données, vérifie la compatibilité des pièces et affiche les stats en direct.
4. **Export** : un fichier `arme.json` (assemblage + stats calculées) que le moteur de jeu importe.

## Modèle de données

**Matériau** : densité, dureté, résistance à l'usure, coût.

**Pièce** : identifiant, catégorie (emplacement), volume ou masse, longueur, matériau, emplacements qu'elle fournit (une carcasse fournit « canon », « crosse », « poignée »…), et des modificateurs de jeu (ergonomie, contrôle du recul, précision).

**Arme** : une pièce racine + un arbre de pièces montées dans les emplacements.

## Statistiques calculées

Voir le README pour la liste complète. Principes :

- Tout part de la masse (volume × densité du matériau, ou masse fixe pour les pièces composites) et de la position de chaque pièce dans le repère de l'arme (x vers la bouche, y vers le haut, en mm).
- Vitesse initiale : `v = vRef × (L / Lref)^k`, k propre au calibre.
- Trajectoire : intégration point-matériel, traînée G1 standard, coefficient balistique du calibre.
- Recul libre : `p = m_balle·v0 + m_poudre·1,7·v0`, `E = p² / 2M`.
- Gaz : la pression disponible dépend de la position de la prise de gaz et du temps passé sous pression avant la sortie de la balle ; silencieux et bloc réglable déplacent cet indice.
- Les coefficients d'équilibrage sont regroupés dans `src/engine/stats.ts`.

## Pile technique par défaut

- **Moteur de calcul** : TypeScript, sans dépendance, testé. Portable en C# (Unity/Godot) ou C++ (Unreal) une fois les formules stabilisées.
- **Éditeur** : application web en TypeScript (Vite), Three.js pour la 3D plus tard. Tourne dans le navigateur, peut être empaquetée en appli desktop avec Tauri.
- **Données** : JSON versionné dans Git.

Ce choix est le plus rapide pour itérer. Il change si tu veux que l'éditeur vive *dans* le moteur de jeu (voir questions).

## Feuille de route

1. **Prototype** (fait, v0) : éditeur web, quelques pièces, stats calculées en direct.
2. **Moteur armes à feu** (fait, v0.2) : 3 plateformes, 5 calibres, montage vérifié, balistique, recul, gaz, fiabilité, tests.
3. Catalogue élargi (pistolets, fusils à pompe, mitrailleuses), types de munitions par calibre (blindée, expansive, subsonique), chaleur du canon en rafale.
4. Vue 3D des pièces assemblées.
5. Import dans le moteur de jeu choisi + première scène de tir.
6. Usure, entretien, munitions.

## Questions ouvertes

- Moteur de jeu visé : Unity, Unreal, Godot, ou pas encore décidé ?
- L'éditeur est-il un outil de dev séparé, ou une fonctionnalité du jeu (atelier du joueur) ?
- Époque ou univers : contemporain, historique, science-fiction ?
