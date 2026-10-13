import type { Emplacement, Piece } from "../types";

// Catalogue de pièces. Les noms sont génériques : ce sont des pièces de jeu inspirées des
// grandes familles d'armes, pas des produits réels.

const ACIERS_CANON = ["acier-4140", "inox-416", "acier-chrome"];
const em = (id: string, nom: string, interfaces: string[], x: number, y: number, extra: Partial<Emplacement> = {}): Emplacement =>
  ({ id, nom, interfaces, x, y, ...extra });

// Canon : volume déduit de la longueur et du profil, emplacements de bouche et de bloc gaz.
function canon(p: {
  id: string; nom: string; fixation: string; calibres: string[]; longueur: number;
  profil: "leger" | "standard" | "lourd"; qualite: number; longueurGaz?: number; filetage: string; blocGaz?: string;
}): Piece {
  const section = { leger: 0.17, standard: 0.23, lourd: 0.33 }[p.profil];
  const emplacements = [em("bouche", "Bouche", [p.filetage], p.longueur, 0)];
  if (p.blocGaz && p.longueurGaz) emplacements.push(em("bloc-gaz", "Bloc gaz", [p.blocGaz], p.longueurGaz, 12, { requis: true }));
  return {
    id: p.id, nom: p.nom, categorie: "canon", fixation: p.fixation, longueur: p.longueur, hauteur: p.profil === "lourd" ? 22 : 17,
    volume: Math.round(p.longueur * section), materiaux: ACIERS_CANON, calibres: p.calibres,
    canon: { longueur: p.longueur, profil: p.profil, qualite: p.qualite }, longueurGaz: p.longueurGaz, emplacements,
  };
}

const AR_CAL = ["5.56x45", "300blk"];
const TOUS_CAL_756 = ["5.56x45", "300blk", "7.62x39", "7.62x51"];

const liste: Piece[] = [
  // ───────────── Plateforme AR ─────────────
  {
    id: "ar-carcasse", nom: "Carcasse AR (supérieure + inférieure)", categorie: "carcasse", fixation: "racine",
    longueur: 190, hauteur: 70, cgY: -12, volume: 210, materiaux: ["alu-7075", "alu-6061", "titane", "polymere"],
    emplacements: [
      em("canon", "Canon", ["ar-canon"], 190, 0, { requis: true }),
      em("culasse", "Ensemble culasse", ["ar-culasse"], 70, 0, { requis: true }),
      em("detente", "Détente", ["ar-detente"], 60, -25, { requis: true }),
      em("chargeur", "Chargeur", ["ar-chargeur"], 105, -35, { requis: true }),
      em("poignee", "Poignée pistolet", ["ar-poignee"], 45, -40),
      em("tube", "Tube de crosse", ["ar-tube"], 0, -5),
      em("garde-main", "Garde-main", ["ar-garde-main"], 190, 0),
      em("levier", "Levier d'armement", ["ar-levier"], 0, 12),
      em("rail", "Rail supérieur", ["pica"], 15, 32, { longueurRail: 165 }),
    ],
  },
  canon({ id: "ar-canon-267", nom: "Canon 267 mm, gaz carabine", fixation: "ar-canon", calibres: ["5.56x45"], longueur: 267, profil: "standard", qualite: 0.7, longueurGaz: 178, filetage: "filetage-1/2x28", blocGaz: "bloc-gaz-ar" }),
  canon({ id: "ar-canon-368", nom: "Canon 368 mm, gaz carabine", fixation: "ar-canon", calibres: ["5.56x45"], longueur: 368, profil: "standard", qualite: 0.72, longueurGaz: 178, filetage: "filetage-1/2x28", blocGaz: "bloc-gaz-ar" }),
  canon({ id: "ar-canon-406", nom: "Canon 406 mm, gaz intermédiaire", fixation: "ar-canon", calibres: ["5.56x45"], longueur: 406, profil: "leger", qualite: 0.78, longueurGaz: 229, filetage: "filetage-1/2x28", blocGaz: "bloc-gaz-ar" }),
  canon({ id: "ar-canon-457-match", nom: "Canon match 457 mm, lourd", fixation: "ar-canon", calibres: ["5.56x45"], longueur: 457, profil: "lourd", qualite: 0.95, longueurGaz: 229, filetage: "filetage-1/2x28", blocGaz: "bloc-gaz-ar" }),
  canon({ id: "ar-canon-508", nom: "Canon 508 mm, gaz fusil", fixation: "ar-canon", calibres: ["5.56x45"], longueur: 508, profil: "standard", qualite: 0.8, longueurGaz: 330, filetage: "filetage-1/2x28", blocGaz: "bloc-gaz-ar" }),
  canon({ id: "ar-canon-blk-229", nom: "Canon .300 BLK 229 mm, gaz pistolet", fixation: "ar-canon", calibres: ["300blk"], longueur: 229, profil: "standard", qualite: 0.72, longueurGaz: 102, filetage: "filetage-5/8x24", blocGaz: "bloc-gaz-ar" }),
  canon({ id: "ar-canon-blk-406", nom: "Canon .300 BLK 406 mm, gaz carabine", fixation: "ar-canon", calibres: ["300blk"], longueur: 406, profil: "standard", qualite: 0.76, longueurGaz: 178, filetage: "filetage-5/8x24", blocGaz: "bloc-gaz-ar" }),

  { id: "bloc-gaz-fixe", nom: "Bloc gaz fixe", categorie: "systeme-gaz", fixation: "bloc-gaz-ar", longueur: 25, hauteur: 22, masse: 70 },
  { id: "bloc-gaz-reglable", nom: "Bloc gaz réglable", categorie: "systeme-gaz", fixation: "bloc-gaz-ar", longueur: 28, hauteur: 24, masse: 85, reglable: true, mods: { fiabilite: 5 } },

  { id: "ar-culasse-std", nom: "Ensemble culasse standard", categorie: "culasse", fixation: "ar-culasse", longueur: 240, hauteur: 25, masse: 320, calibres: AR_CAL, cadence: 750, systeme: "emprunt-direct" },
  { id: "ar-culasse-legere", nom: "Ensemble culasse allégé", categorie: "culasse", fixation: "ar-culasse", longueur: 240, hauteur: 25, masse: 225, calibres: AR_CAL, cadence: 860, systeme: "emprunt-direct", mods: { fiabilite: -15, reculVertical: -4 } },
  { id: "ar-culasse-piston", nom: "Conversion piston court", categorie: "culasse", fixation: "ar-culasse", longueur: 240, hauteur: 25, masse: 430, calibres: AR_CAL, cadence: 720, systeme: "piston-court", mods: { fiabilite: 25, reculVertical: 5 } },

  { id: "ar-detente-mil", nom: "Détente militaire", categorie: "detente", fixation: "ar-detente", longueur: 30, hauteur: 20, masse: 60 },
  { id: "ar-detente-match", nom: "Détente match deux temps", categorie: "detente", fixation: "ar-detente", longueur: 30, hauteur: 20, masse: 55, mods: { precisionMoa: -0.2, ergonomie: 3 } },

  { id: "ar-levier-std", nom: "Levier d'armement standard", categorie: "levier-armement", fixation: "ar-levier", longueur: 20, hauteur: 8, masse: 20 },
  { id: "ar-levier-ambi", nom: "Levier d'armement ambidextre", categorie: "levier-armement", fixation: "ar-levier", longueur: 25, hauteur: 10, masse: 32, mods: { ergonomie: 3 } },

  { id: "ar-poignee-a2", nom: "Poignée A2", categorie: "poignee", fixation: "ar-poignee", longueur: 35, hauteur: 100, cgY: -45, volume: 60, materiaux: ["polymere"] },
  { id: "ar-poignee-ergo", nom: "Poignée ergonomique angle réduit", categorie: "poignee", fixation: "ar-poignee", longueur: 40, hauteur: 105, cgY: -45, volume: 70, materiaux: ["polymere", "alu-6061"], mods: { ergonomie: 6 } },

  { id: "ar-tube-carabine", nom: "Tube de crosse carabine", categorie: "tube-crosse", fixation: "ar-tube", longueur: 190, arriere: 190, hauteur: 30, volume: 30, materiaux: ["alu-7075", "alu-6061"],
    emplacements: [em("crosse", "Crosse", ["ar-crosse"], -60, 0)] },
  { id: "ar-tube-pistolet", nom: "Tube pistolet sans crosse", categorie: "tube-crosse", fixation: "ar-tube", longueur: 170, arriere: 170, hauteur: 30, volume: 26, materiaux: ["alu-7075"], mods: { ergonomie: 4 } },
  { id: "ar-crosse-telescopique", nom: "Crosse télescopique", categorie: "crosse", fixation: "ar-crosse", longueur: 250, arriere: 250, hauteur: 110, cgY: -20, volume: 200, materiaux: ["polymere"], epaulement: true, mods: { ergonomie: 5 } },
  { id: "ar-crosse-precision", nom: "Crosse de précision à busc réglable", categorie: "crosse", fixation: "ar-crosse", longueur: 280, arriere: 280, hauteur: 140, cgY: -15, volume: 300, materiaux: ["polymere", "alu-6061"], epaulement: true, mods: { precisionMoa: -0.15, ergonomie: -3, reculVertical: -5 } },
  { id: "ar-crosse-minimaliste", nom: "Crosse squelette minimaliste", categorie: "crosse", fixation: "ar-crosse", longueur: 220, arriere: 220, hauteur: 90, cgY: -20, volume: 55, materiaux: ["alu-7075", "titane", "carbone"], epaulement: true, mods: { ergonomie: 8, reculVertical: 4 } },

  { id: "ar-chargeur-30", nom: "Chargeur 30 coups", categorie: "chargeur", fixation: "ar-chargeur", longueur: 70, hauteur: 180, cgY: -80, masse: 135, capacite: 30, calibres: AR_CAL },
  { id: "ar-chargeur-20", nom: "Chargeur 20 coups", categorie: "chargeur", fixation: "ar-chargeur", longueur: 65, hauteur: 125, cgY: -55, masse: 100, capacite: 20, calibres: AR_CAL, mods: { ergonomie: 4 } },
  { id: "ar-chargeur-60", nom: "Chargeur tambour 60 coups", categorie: "chargeur", fixation: "ar-chargeur", longueur: 120, hauteur: 160, cgY: -90, masse: 650, capacite: 60, calibres: AR_CAL, mods: { ergonomie: -15, fiabilite: -12 } },

  { id: "ar-gm-mlok-330", nom: "Garde-main M-LOK flottant 330 mm", categorie: "garde-main", fixation: "ar-garde-main", longueur: 330, hauteur: 55, volume: 105, materiaux: ["alu-7075", "carbone"], flottant: true,
    emplacements: [em("rail-haut", "Rail supérieur", ["pica"], 5, 30, { longueurRail: 320 }), em("mlok-bas", "M-LOK inférieur", ["mlok"], 40, -30, { longueurRail: 280 }), em("mlok-cote", "M-LOK latéral", ["mlok", "pica"], 60, 0, { longueurRail: 250 })] },
  { id: "ar-gm-mlok-230", nom: "Garde-main M-LOK flottant 230 mm", categorie: "garde-main", fixation: "ar-garde-main", longueur: 230, hauteur: 55, volume: 75, materiaux: ["alu-7075", "carbone"], flottant: true,
    emplacements: [em("rail-haut", "Rail supérieur", ["pica"], 5, 30, { longueurRail: 220 }), em("mlok-bas", "M-LOK inférieur", ["mlok"], 30, -30, { longueurRail: 180 }), em("mlok-cote", "M-LOK latéral", ["mlok", "pica"], 40, 0, { longueurRail: 160 })] },
  { id: "ar-gm-quad", nom: "Garde-main quatre rails (non flottant)", categorie: "garde-main", fixation: "ar-garde-main", longueur: 180, hauteur: 60, volume: 150, materiaux: ["alu-6061"], flottant: false, mods: { ergonomie: -4 },
    emplacements: [em("rail-haut", "Rail supérieur", ["pica"], 5, 30, { longueurRail: 170 }), em("rail-bas", "Rail inférieur", ["pica"], 5, -30, { longueurRail: 170 }), em("rail-cote", "Rail latéral", ["pica"], 5, 0, { longueurRail: 170 })] },

  // ───────────── Plateforme AK ─────────────
  {
    id: "ak-carcasse", nom: "Carcasse AK emboutie", categorie: "carcasse", fixation: "racine",
    longueur: 260, hauteur: 60, cgY: -8, volume: 75, materiaux: ["acier-4140"],
    emplacements: [
      em("canon", "Canon", ["ak-canon"], 260, 0, { requis: true }),
      em("culasse", "Ensemble porte-culasse", ["ak-culasse"], 100, 0, { requis: true }),
      em("detente", "Détente", ["ak-detente"], 70, -25, { requis: true }),
      em("chargeur", "Chargeur", ["ak-chargeur"], 135, -30, { requis: true }),
      em("poignee", "Poignée pistolet", ["ak-poignee"], 45, -35),
      em("crosse", "Crosse", ["ak-crosse"], 0, -15),
      em("garde-main", "Garde-main", ["ak-garde-main"], 260, 0),
      em("couvercle", "Couvercle de boîte de culasse", ["ak-couvercle"], 30, 28),
    ],
  },
  canon({ id: "ak-canon-415", nom: "Canon 415 mm chromé", fixation: "ak-canon", calibres: ["7.62x39"], longueur: 415, profil: "standard", qualite: 0.6, filetage: "filetage-14x1g" }),
  canon({ id: "ak-canon-314", nom: "Canon court 314 mm", fixation: "ak-canon", calibres: ["7.62x39"], longueur: 314, profil: "standard", qualite: 0.58, filetage: "filetage-14x1g" }),
  canon({ id: "ak-canon-415-match", nom: "Canon 415 mm martelé à froid", fixation: "ak-canon", calibres: ["7.62x39"], longueur: 415, profil: "lourd", qualite: 0.8, filetage: "filetage-14x1g" }),
  { id: "ak-culasse-std", nom: "Porte-culasse à piston long", categorie: "culasse", fixation: "ak-culasse", longueur: 200, hauteur: 30, masse: 470, calibres: ["7.62x39"], cadence: 600, systeme: "piston-long", mods: { fiabilite: 60 } },
  { id: "ak-detente-std", nom: "Détente AK", categorie: "detente", fixation: "ak-detente", longueur: 30, hauteur: 20, masse: 75 },
  { id: "ak-detente-match", nom: "Détente AK améliorée", categorie: "detente", fixation: "ak-detente", longueur: 30, hauteur: 20, masse: 70, mods: { precisionMoa: -0.15, ergonomie: 2 } },
  { id: "ak-poignee-std", nom: "Poignée AK", categorie: "poignee", fixation: "ak-poignee", longueur: 35, hauteur: 100, cgY: -45, volume: 55, materiaux: ["polymere", "noyer"] },
  { id: "ak-poignee-ergo", nom: "Poignée AK ergonomique", categorie: "poignee", fixation: "ak-poignee", longueur: 40, hauteur: 105, cgY: -45, volume: 65, materiaux: ["polymere"], mods: { ergonomie: 5 } },
  { id: "ak-crosse-bois", nom: "Crosse fixe", categorie: "crosse", fixation: "ak-crosse", longueur: 250, arriere: 250, hauteur: 120, cgY: -35, volume: 650, materiaux: ["noyer", "bouleau", "polymere"], epaulement: true },
  { id: "ak-crosse-pliante", nom: "Crosse pliante latérale", categorie: "crosse", fixation: "ak-crosse", longueur: 240, arriere: 240, hauteur: 110, cgY: -30, volume: 55, materiaux: ["acier-4140"], epaulement: true, mods: { ergonomie: 4, reculVertical: 6 } },
  { id: "ak-adaptateur-tube", nom: "Adaptateur tube de crosse AR", categorie: "tube-crosse", fixation: "ak-crosse", longueur: 200, arriere: 200, hauteur: 30, volume: 45, materiaux: ["alu-7075"],
    emplacements: [em("crosse", "Crosse", ["ar-crosse"], -70, 0)] },
  { id: "ak-chargeur-acier", nom: "Chargeur acier 30 coups", categorie: "chargeur", fixation: "ak-chargeur", longueur: 75, hauteur: 200, cgY: -85, masse: 330, capacite: 30, calibres: ["7.62x39"], mods: { fiabilite: 10 } },
  { id: "ak-chargeur-polymere", nom: "Chargeur polymère 30 coups", categorie: "chargeur", fixation: "ak-chargeur", longueur: 75, hauteur: 200, cgY: -85, masse: 240, capacite: 30, calibres: ["7.62x39"] },
  { id: "ak-gm-bois", nom: "Garde-main bois", categorie: "garde-main", fixation: "ak-garde-main", longueur: 230, hauteur: 55, volume: 280, materiaux: ["noyer", "bouleau"], flottant: false },
  { id: "ak-gm-mlok", nom: "Garde-main M-LOK", categorie: "garde-main", fixation: "ak-garde-main", longueur: 240, hauteur: 55, volume: 85, materiaux: ["alu-7075"], flottant: false,
    emplacements: [em("rail-haut", "Rail supérieur", ["pica"], 5, 30, { longueurRail: 120 }), em("mlok-bas", "M-LOK inférieur", ["mlok"], 30, -30, { longueurRail: 190 })] },
  { id: "ak-couvercle-std", nom: "Couvercle standard", categorie: "rail", fixation: "ak-couvercle", longueur: 230, hauteur: 18, volume: 22, materiaux: ["acier-4140"] },
  { id: "ak-couvercle-rail", nom: "Couvercle à rail", categorie: "rail", fixation: "ak-couvercle", longueur: 240, hauteur: 22, volume: 32, materiaux: ["acier-4140", "alu-7075"], mods: { precisionMoa: 0.4 },
    emplacements: [em("rail", "Rail", ["pica"], 20, 12, { longueurRail: 200 })] },

  // ───────────── Verrou ─────────────
  {
    id: "verrou-action", nom: "Action à verrou courte", categorie: "carcasse", fixation: "racine",
    longueur: 220, hauteur: 40, volume: 85, materiaux: ["acier-4140", "inox-416", "titane"],
    emplacements: [
      em("canon", "Canon", ["verrou-canon"], 220, 0, { requis: true }),
      em("culasse", "Culasse", ["verrou-culasse"], 60, 0, { requis: true }),
      em("chassis", "Crosse ou châssis", ["verrou-chassis"], 30, -15, { requis: true }),
      em("rail", "Rail supérieur", ["pica"], 10, 26, { longueurRail: 200 }),
    ],
  },
  canon({ id: "verrou-canon-610", nom: "Canon lourd 610 mm", fixation: "verrou-canon", calibres: ["7.62x51"], longueur: 610, profil: "lourd", qualite: 0.95, filetage: "filetage-5/8x24" }),
  canon({ id: "verrou-canon-508", nom: "Canon 508 mm", fixation: "verrou-canon", calibres: ["7.62x51"], longueur: 508, profil: "standard", qualite: 0.88, filetage: "filetage-5/8x24" }),
  canon({ id: "verrou-canon-406", nom: "Canon court 406 mm", fixation: "verrou-canon", calibres: ["7.62x51"], longueur: 406, profil: "standard", qualite: 0.85, filetage: "filetage-5/8x24" }),
  { id: "verrou-culasse-308", nom: "Culasse à verrou", categorie: "culasse", fixation: "verrou-culasse", longueur: 200, hauteur: 20, masse: 280, calibres: ["7.62x51"], cadence: 40, systeme: "verrou", mods: { fiabilite: 200 } },
  { id: "verrou-chassis-alu", nom: "Châssis aluminium", categorie: "crosse", fixation: "verrou-chassis", longueur: 980, arriere: 400, hauteur: 100, cgY: -45, volume: 380, materiaux: ["alu-7075", "alu-6061"], epaulement: true, flottant: true, mods: { precisionMoa: -0.2 },
    emplacements: [
      em("chargeur", "Chargeur", ["verrou-chargeur"], 70, -20, { requis: true }),
      em("detente", "Détente", ["verrou-detente"], 30, -15, { requis: true }),
      em("poignee", "Poignée pistolet", ["ar-poignee"], 0, -30),
      em("mlok-bas", "M-LOK inférieur", ["mlok"], 220, -20, { longueurRail: 300 }),
    ] },
  { id: "verrou-crosse-bois", nom: "Crosse de chasse", categorie: "crosse", fixation: "verrou-chassis", longueur: 1000, arriere: 420, hauteur: 110, cgY: -45, volume: 1300, materiaux: ["noyer", "bouleau", "polymere", "carbone"], epaulement: true, flottant: false, mods: { ergonomie: 4 },
    emplacements: [
      em("chargeur", "Chargeur", ["verrou-chargeur"], 70, -20, { requis: true }),
      em("detente", "Détente", ["verrou-detente"], 30, -15, { requis: true }),
    ] },
  { id: "verrou-chargeur-10", nom: "Chargeur 10 coups", categorie: "chargeur", fixation: "verrou-chargeur", longueur: 70, hauteur: 90, cgY: -35, masse: 130, capacite: 10, calibres: ["7.62x51"] },
  { id: "verrou-chargeur-5", nom: "Chargeur 5 coups", categorie: "chargeur", fixation: "verrou-chargeur", longueur: 70, hauteur: 55, cgY: -20, masse: 90, capacite: 5, calibres: ["7.62x51"], mods: { ergonomie: 3 } },
  { id: "verrou-detente-std", nom: "Détente de chasse", categorie: "detente", fixation: "verrou-detente", longueur: 30, hauteur: 20, masse: 70 },
  { id: "verrou-detente-match", nom: "Détente réglable de précision", categorie: "detente", fixation: "verrou-detente", longueur: 30, hauteur: 20, masse: 75, mods: { precisionMoa: -0.25, ergonomie: 2 } },

  // ───────────── Bouches ─────────────
  { id: "bouche-a2-556", nom: "Cache-flammes à fentes", categorie: "bouche", fixation: "filetage-1/2x28", longueur: 55, hauteur: 22, masse: 50, mods: { bruitDb: 0 } },
  { id: "bouche-frein-556", nom: "Frein de bouche", categorie: "bouche", fixation: "filetage-1/2x28", longueur: 60, hauteur: 25, masse: 75, mods: { reculVertical: -22, reculHorizontal: -15, monteeBouche: -15, bruitDb: 4 } },
  { id: "bouche-comp-556", nom: "Compensateur", categorie: "bouche", fixation: "filetage-1/2x28", longueur: 50, hauteur: 24, masse: 60, mods: { monteeBouche: -35, reculHorizontal: -8, bruitDb: 2 } },
  { id: "bouche-qd-556", nom: "Cache-flammes pour silencieux rapide", categorie: "bouche", fixation: "filetage-1/2x28", longueur: 60, hauteur: 25, masse: 85, mods: { reculVertical: -5 },
    emplacements: [em("silencieux", "Silencieux", ["qd-silencieux"], 0, 0)] },
  { id: "bouche-qd-58", nom: "Cache-flammes pour silencieux rapide 5/8", categorie: "bouche", fixation: "filetage-5/8x24", longueur: 62, hauteur: 27, masse: 95, mods: { reculVertical: -5 },
    emplacements: [em("silencieux", "Silencieux", ["qd-silencieux"], 0, 0)] },
  { id: "bouche-frein-58", nom: "Frein de bouche de précision", categorie: "bouche", fixation: "filetage-5/8x24", longueur: 75, hauteur: 30, masse: 140, mods: { reculVertical: -35, reculHorizontal: -20, monteeBouche: -20, bruitDb: 5 } },
  { id: "bouche-ak-frein", nom: "Frein de bouche AK", categorie: "bouche", fixation: "filetage-14x1g", longueur: 60, hauteur: 26, masse: 70, mods: { reculVertical: -25, monteeBouche: -25, reculHorizontal: -10, bruitDb: 5 } },
  { id: "bouche-ak-cf", nom: "Cache-flammes AK", categorie: "bouche", fixation: "filetage-14x1g", longueur: 65, hauteur: 26, masse: 65 },

  // ───────────── Silencieux ─────────────
  { id: "sil-qd-556", nom: "Silencieux rapide 5,56", categorie: "silencieux", fixation: "qd-silencieux", longueur: 165, hauteur: 40, masse: 480, calibres: ["5.56x45"], mods: { bruitDb: -27, surpressionGaz: 0.35, reculVertical: -12, monteeBouche: -10, cadence: 8, ergonomie: -6 } },
  { id: "sil-qd-762-ti", nom: "Silencieux rapide 7,62 titane", categorie: "silencieux", fixation: "qd-silencieux", longueur: 185, hauteur: 44, masse: 380, calibres: TOUS_CAL_756, mods: { bruitDb: -28, surpressionGaz: 0.3, reculVertical: -14, monteeBouche: -10, cadence: 6, ergonomie: -5 } },
  { id: "sil-visse-58", nom: "Silencieux vissé 5/8", categorie: "silencieux", fixation: "filetage-5/8x24", longueur: 190, hauteur: 44, masse: 520, calibres: TOUS_CAL_756, mods: { bruitDb: -30, surpressionGaz: 0.4, reculVertical: -15, monteeBouche: -12, cadence: 10, ergonomie: -7 } },
  { id: "sil-visse-ak", nom: "Silencieux vissé AK", categorie: "silencieux", fixation: "filetage-14x1g", longueur: 200, hauteur: 46, masse: 560, calibres: ["7.62x39"], mods: { bruitDb: -26, surpressionGaz: 0.3, reculVertical: -12, monteeBouche: -10, cadence: 5, ergonomie: -7 } },

  // ───────────── Visée ─────────────
  { id: "vis-fer", nom: "Hausse et guidon repliables", categorie: "optique", fixation: "pica", empreinte: 40, longueur: 40, hauteur: 30, cgY: 25, masse: 70, mods: { grossissement: 1, ergonomie: 2 } },
  { id: "vis-point-rouge", nom: "Viseur point rouge compact", categorie: "optique", fixation: "pica", empreinte: 55, longueur: 65, hauteur: 45, cgY: 38, masse: 140, mods: { grossissement: 1, vitesseVisee: 8, ergonomie: -1 } },
  { id: "vis-holo", nom: "Viseur holographique", categorie: "optique", fixation: "pica", empreinte: 80, longueur: 100, hauteur: 60, cgY: 38, masse: 310, mods: { grossissement: 1, vitesseVisee: 6, ergonomie: -3 } },
  { id: "vis-1-6", nom: "Lunette 1-6×", categorie: "optique", fixation: "pica", empreinte: 140, longueur: 270, hauteur: 60, cgY: 40, masse: 620, mods: { grossissement: 6, vitesseVisee: -10, ergonomie: -6 } },
  { id: "vis-5-25", nom: "Lunette de précision 5-25×", categorie: "optique", fixation: "pica", empreinte: 170, longueur: 400, hauteur: 70, cgY: 45, masse: 1050, mods: { grossissement: 25, vitesseVisee: -30, ergonomie: -12 } },
  { id: "vis-loupe", nom: "Loupe 3× basculante", categorie: "optique", fixation: "pica", empreinte: 50, longueur: 110, hauteur: 60, cgY: 38, masse: 290, mods: { grossissement: 3, vitesseVisee: -4, ergonomie: -3 } },

  // ───────────── Poignées avant et accessoires ─────────────
  { id: "pav-verticale", nom: "Poignée verticale", categorie: "poignee-avant", fixation: "mlok", empreinte: 50, longueur: 35, hauteur: 95, cgY: -45, masse: 90, mods: { reculVertical: -6, reculHorizontal: -4, ergonomie: -2 } },
  { id: "pav-angle", nom: "Poignée d'angle", categorie: "poignee-avant", fixation: "mlok", empreinte: 70, longueur: 70, hauteur: 35, cgY: -15, masse: 60, mods: { reculHorizontal: -8, ergonomie: 3 } },
  { id: "pav-bipied", nom: "Bipied", categorie: "poignee-avant", fixation: "mlok", empreinte: 40, longueur: 170, hauteur: 40, cgY: -20, masse: 380, mods: { precisionMoa: -0.15, ergonomie: -8, reculVertical: -10 } },
  { id: "acc-lampe", nom: "Lampe tactique", categorie: "accessoire", fixation: "mlok", empreinte: 40, longueur: 130, hauteur: 30, cgY: 0, masse: 140, mods: { ergonomie: -1 } },
  { id: "acc-laser", nom: "Module laser", categorie: "accessoire", fixation: "pica", empreinte: 60, longueur: 90, hauteur: 40, cgY: 0, masse: 180, mods: { vitesseVisee: 4, ergonomie: -2 } },
];

export const PIECES: Record<string, Piece> = Object.fromEntries(liste.map(p => [p.id, p]));
