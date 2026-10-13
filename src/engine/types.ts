// Modèle de données du moteur Erebus.
// Unités : millimètres, grammes, mètres/seconde, joules. Repère : x vers la bouche, y vers le haut,
// origine de chaque pièce = son point de fixation sur la pièce parente.

export type MateriauId = string;
export type PieceId = string;
export type Interface = string;

export interface Materiau {
  id: MateriauId;
  nom: string;
  densite: number;        // g/cm³
  rigidite: number;       // 0..1, influe sur la précision des pièces porteuses
  resistanceUsure: number; // 0..1, influe sur l'usure par coup
  dissipation: number;    // 0..1, capacité à encaisser la chaleur
}

export type Categorie =
  | "carcasse" | "canon" | "culasse" | "systeme-gaz" | "garde-main" | "crosse" | "tube-crosse"
  | "poignee" | "chargeur" | "bouche" | "silencieux" | "optique" | "poignee-avant"
  | "accessoire" | "detente" | "levier-armement" | "rail";

export interface Emplacement {
  id: string;
  nom: string;
  interfaces: Interface[];   // la pièce enfant doit avoir une de ces fixations
  x: number;                 // mm, position du point de fixation dans le repère de la pièce
  y: number;
  requis?: boolean;
  longueurRail?: number;     // mm disponibles pour un rail (somme des empreintes des enfants)
}

// Modificateurs additifs de jeu, regroupés pour l'équilibrage.
export interface Modificateurs {
  ergonomie?: number;
  reculVertical?: number;      // en % (négatif = réduit)
  reculHorizontal?: number;    // en %
  monteeBouche?: number;       // en %
  precisionMoa?: number;       // MOA ajoutés (négatif = plus précis)
  bruitDb?: number;
  fiabilite?: number;          // en % sur les coups moyens entre incidents
  cadence?: number;            // en % sur la cadence
  surpressionGaz?: number;     // 0..1, renvoie plus de gaz dans le système
  vitesseVisee?: number;       // en %
  grossissement?: number;
}

export interface CaracCanon {
  longueur: number;            // mm de longueur utile
  profil: "leger" | "standard" | "lourd";
  qualite: number;             // 0..1
}

export interface Piece {
  id: PieceId;
  nom: string;
  categorie: Categorie;
  fixation: Interface;          // interface par laquelle elle se monte
  empreinte?: number;           // mm occupés sur un rail
  longueur: number;             // mm hors tout
  arriere?: number;             // mm dont la pièce dépasse en arrière de sa fixation (crosse, châssis)
  hauteur: number;              // mm, pour le dessin
  cgY?: number;                 // mm, hauteur du centre de gravité (défaut 0)
  masse?: number;               // g, pour les pièces composites (optiques, accessoires)
  volume?: number;              // cm³, masse = volume × densité du matériau
  materiaux?: MateriauId[];     // matériaux permis si `volume` est défini
  emplacements?: Emplacement[];
  calibres?: string[];          // calibres acceptés (canon, culasse, chargeur)
  canon?: CaracCanon;
  capacite?: number;            // cartouches (chargeur)
  cadence?: number;             // coups/min (culasse)
  systeme?: "emprunt-direct" | "piston-court" | "piston-long" | "verrou";
  longueurGaz?: number;         // mm, distance chambre → prise de gaz
  reglable?: boolean;           // bloc gaz réglable : le joueur peut couper l'excès de gaz
  epaulement?: boolean;         // crosse qui prend appui à l'épaule
  flottant?: boolean;           // garde-main ou châssis qui ne touche pas le canon
  mods?: Modificateurs;
}

export interface Calibre {
  id: string;
  nom: string;
  masseProjectile: number;      // g
  masseCharge: number;          // g de poudre
  vitesseRef: number;           // m/s mesurée avec le canon de référence
  longueurCanonRef: number;     // mm
  coefBalistiqueG1: number;
  diametre: number;             // mm
  pression: number;             // 0..1, pression relative (gaz disponibles)
  bruitDb: number;              // niveau à la bouche, canon de référence, sans accessoire
  masseCartouche: number;       // g, pour la masse des munitions dans le chargeur
  sensibiliteCanon: number;     // exposant v ∝ (L/Lref)^k ; ~0.2 fusil, ~0.13 pistolet
}

// Assemblage : un arbre de pièces. Chaque nœud dit quelle pièce occupe un emplacement.
export interface Noeud {
  piece: PieceId;
  materiau?: MateriauId;
  enfants?: Record<string, Noeud>;
}

export interface Arme {
  nom: string;
  calibre: string;
  racine: Noeud;
}

export interface Catalogue {
  materiaux: Record<MateriauId, Materiau>;
  calibres: Record<string, Calibre>;
  pieces: Record<PieceId, Piece>;
}

export interface PiecePlacee {
  chemin: string;              // ex. "carcasse/canon/bouche"
  piece: Piece;
  materiau?: Materiau;
  masse: number;               // g
  x: number;                   // mm, origine dans le repère de l'arme
  y: number;
  cgX: number;
  cgY: number;
}

export interface Probleme {
  chemin: string;
  gravite: "erreur" | "avertissement";
  message: string;
}
