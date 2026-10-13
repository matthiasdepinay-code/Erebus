import { placer, verifier } from "./assemblage";
import { trajectoire, vitesseInitiale, type PointTrajectoire } from "./balistique";
import type { Arme, Catalogue, Modificateurs, PiecePlacee, Probleme } from "./types";

export interface Fiche {
  valide: boolean;
  problemes: Probleme[];
  pieces: PiecePlacee[];

  masse: { vide: number; chargee: number };               // kg
  longueur: number;                                         // mm hors tout
  centreGravite: { x: number; y: number };                  // mm
  poignee: number;                                          // mm, position de la main forte
  equilibre: number;                                        // mm devant la main forte
  inertie: number;                                          // kg·m² autour de la main forte

  balistique: { vitesseInitiale: number; energieBouche: number; zero: number; hauteurVisee: number; table: PointTrajectoire[]; porteeEfficace: number };
  precision: { moa: number; dispersion100m: number };      // dispersion en cm à 100 m (diamètre)
  recul: { impulsion: number; energieLibre: number; vertical: number; horizontal: number; monteeBouche: number };
  maniement: { ergonomie: number; tempsVisee: number; balancement: number };
  gaz: { indice: number; ideal: number; etat: "sous-alimenté" | "correct" | "suralimenté" | "manuel" };
  fiabilite: { coupsEntreIncidents: number; risqueParCoup: number; incidents: Record<string, number>; usureParCoup: number; vieCanon: number };
  tir: { cadence: number; capacite: number; bruitDb: number; grossissement: number };
}

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

function sommeMods(pieces: PiecePlacee[]): Required<Omit<Modificateurs, "grossissement">> & { grossissement: number } {
  const s = { ergonomie: 0, reculVertical: 0, reculHorizontal: 0, monteeBouche: 0, precisionMoa: 0, bruitDb: 0, fiabilite: 0, cadence: 0, surpressionGaz: 0, vitesseVisee: 0, grossissement: 1 };
  let optiqueVue = false;
  for (const p of pieces) {
    const m = p.piece.mods ?? {};
    for (const k of Object.keys(m) as (keyof Modificateurs)[]) {
      if (k === "grossissement") { if (!optiqueVue) { s.grossissement = m.grossissement ?? 1; optiqueVue = true; } continue; }
      s[k] += m[k] ?? 0;
    }
  }
  return s;
}

export function calculer(arme: Arme, cat: Catalogue, options: { zero?: number } = {}): Fiche {
  const problemes = verifier(arme, cat);
  const pieces = placer(arme, cat);
  const cal = cat.calibres[arme.calibre];
  const mods = sommeMods(pieces);
  const trouver = (c: string) => pieces.find(p => p.piece.categorie === c);

  // ── Masse et géométrie ──
  const chargeur = trouver("chargeur");
  const capacite = chargeur?.piece.capacite ?? 0;
  const masseMunitions = cal ? capacite * cal.masseCartouche : 0;
  const masseVide = pieces.reduce((s, p) => s + p.masse, 0);
  const masseTotale = masseVide + masseMunitions;
  const mx = pieces.reduce((s, p) => s + p.masse * p.cgX, 0) + (chargeur ? masseMunitions * chargeur.cgX : 0);
  const my = pieces.reduce((s, p) => s + p.masse * p.cgY, 0) + (chargeur ? masseMunitions * chargeur.cgY : 0);
  const cg = { x: mx / masseTotale, y: my / masseTotale };
  const xMin = Math.min(...pieces.map(p => p.x - (p.piece.arriere ?? 0)));
  const xMax = Math.max(...pieces.map(p => p.x - (p.piece.arriere ?? 0) + p.piece.longueur));
  const longueur = xMax - xMin;

  const poigneePl = trouver("poignee") ?? trouver("detente");
  const poignee = poigneePl ? poigneePl.x : 0;
  let inertie = 0;
  for (const p of pieces) {
    const dx = (p.cgX - poignee) / 1000, dy = (p.cgY) / 1000, L = p.piece.longueur / 1000;
    inertie += (p.masse / 1000) * (dx * dx + dy * dy + L * L / 12);
  }
  if (chargeur) inertie += (masseMunitions / 1000) * ((chargeur.cgX - poignee) / 1000) ** 2;
  // Couple porté par le bras faible : masse en avant de la main forte.
  const balancement = pieces.reduce((s, p) => s + Math.max(0, p.cgX - poignee) / 1000 * p.masse / 1000, 0) * 9.81;

  // ── Balistique ──
  const canon = trouver("canon");
  const optique = trouver("optique");
  const hauteurVisee = optique ? optique.cgY : 30;
  const zero = options.zero ?? ((mods.grossissement >= 5) ? 300 : 100);
  const v0 = cal && canon?.piece.canon ? vitesseInitiale(cal, canon.piece.canon.longueur) : 0;
  const table = cal && v0 ? trajectoire(cal, v0, { hauteurVisee, zero, max: 1200 }) : [];
  const energieBouche = cal ? 0.5 * (cal.masseProjectile / 1000) * v0 * v0 : 0;

  // ── Précision ──
  const cc = canon?.piece.canon;
  const gm = trouver("garde-main");
  const crosse = pieces.find(p => p.piece.flottant !== undefined && p.piece.categorie === "crosse");
  const flottant = (gm?.piece.flottant ?? crosse?.piece.flottant) ?? true;
  const carcasse = pieces[0];
  let moa = cc ? 0.6 + (1 - cc.qualite) * 3.2 : 6;
  if (cc?.profil === "lourd") moa -= 0.15;
  if (cc?.profil === "leger") moa += 0.25;
  moa += flottant ? -0.1 : 0.45;
  moa += (1 - (carcasse?.materiau?.rigidite ?? 0.6)) * 0.6;
  moa += mods.precisionMoa;
  moa = clamp(moa, 0.3, 12);
  // Erreur du tireur : dépend du grossissement et de l'appui épaule.
  const epaule = pieces.some(p => p.piece.epaulement);
  const erreurTireur = (epaule ? 1.2 : 3.5) * (1.5 / Math.sqrt(Math.max(1, mods.grossissement))) + (optique ? 0 : 2.5);
  const moaTotal = Math.hypot(moa, erreurTireur);

  // Portée efficace : 50 % de chances de toucher une cible de 50 cm, en gardant au moins 250 J.
  let porteeEfficace = 0;
  for (const pt of table) {
    const sigma = moaTotal * 2.908 * pt.distance / 100 / 2;     // cm (rayon ≈ 2σ)
    const R = 25;
    const pTouche = 1 - Math.exp(-(R * R) / (2 * sigma * sigma));
    if (pTouche >= 0.5 && pt.energie >= 250) porteeEfficace = pt.distance; else break;
  }

  // ── Gaz et fiabilité ──
  const culasse = trouver("culasse");
  const systeme = culasse?.piece.systeme;
  const ideal = systeme === "emprunt-direct" ? 1.25 : systeme === "piston-court" ? 1.3 : 0.95;
  let indice = 0;
  let etatGaz: Fiche["gaz"]["etat"] = "manuel";
  if (systeme && systeme !== "verrou" && cal) {
    // Plus la prise de gaz est loin du bout du canon, plus la pression y est faible ; plus elle est
    // loin de la bouche, plus elle reste longtemps sous pression (« dwell »).
    const L = cc?.longueur ?? 400;
    const lg = canon?.piece.longueurGaz ?? L * 0.6;
    const dwell = (L - lg) / L;
    const pressionPrise = Math.pow(1 - lg / 1000, 1.6);
    indice = cal.pression * pressionPrise * 1.6 * (0.75 + dwell) * (1 + mods.surpressionGaz);
    // Un bloc réglable ne crée pas de gaz mais permet d'en retirer : il ramène l'excès vers l'idéal.
    if (pieces.some(p => p.piece.reglable) && indice > ideal) indice = ideal + (indice - ideal) * 0.2;
    etatGaz = indice < ideal * 0.82 ? "sous-alimenté" : indice > ideal * 1.25 ? "suralimenté" : "correct";
  }
  const ecart = systeme === "verrou" ? 0 : Math.max(0, Math.abs(indice - ideal) / ideal - 0.1);
  const mrbfBase = 2500 * (1 + mods.fiabilite / 100);
  const coupsEntreIncidents = Math.round(clamp(mrbfBase * Math.exp(-ecart * 4.5), 30, 50000));
  const risqueParCoup = 1 / coupsEntreIncidents;
  const sous = etatGaz === "sous-alimenté", sur = etatGaz === "suralimenté";
  const incidents = {
    "défaut d'éjection": sous ? 0.45 : 0.2,
    "défaut d'alimentation": sous ? 0.3 : sur ? 0.35 : 0.3,
    "double alimentation": sur ? 0.25 : 0.15,
    "percussion ratée": sous || sur ? 0.1 : 0.2,
    "étui coincé": sur ? 0.2 : 0.15,
  };
  const tot = Object.values(incidents).reduce((a, b) => a + b, 0);
  for (const k of Object.keys(incidents) as (keyof typeof incidents)[]) incidents[k] = incidents[k] / tot;
  const resistance = canon?.materiau?.resistanceUsure ?? 0.7;
  const vieCanon = Math.round(cal ? 25000 * (resistance + 0.3) * Math.pow(0.6 / Math.max(0.3, cal.pression), 2.5) * (sur ? 0.85 : 1) * (cc?.profil === "lourd" ? 1.2 : 1) : 0);
  const usureParCoup = vieCanon ? 1 / vieCanon : 0;

  // ── Recul ──
  // Impulsion = projectile × v0 + gaz × ~1,7 v0 ; énergie de recul libre = p² / 2M.
  const p = cal ? (cal.masseProjectile * v0 + cal.masseCharge * 1.7 * v0) / 1000 : 0;
  const E = p * p / (2 * masseTotale / 1000);
  const appui = epaule ? 1 : 1.9;
  const hauteurAxe = epaule ? 25 : 60;     // mm entre l'axe du canon et l'appui
  const reculVertical = clamp(E * 9 * appui * (1 + mods.reculVertical / 100), 1, 300);
  const reculHorizontal = clamp(E * 4 * appui * (1 + mods.reculHorizontal / 100), 1, 300);
  const monteeBouche = clamp(E * hauteurAxe * 0.25 * (1 + mods.monteeBouche / 100) / Math.max(0.2, inertie * 4), 0, 300);

  // ── Maniement ──
  const ergonomie = clamp(55 + mods.ergonomie - (masseTotale / 1000 - 3) * 6 - (gm ? 0 : crosse ? 0 : 8), 0, 100);
  const tempsVisee = clamp(250 + inertie * 420 + (optique?.masse ?? 0) * 0.12 - ergonomie * 1.2 - mods.vitesseVisee * 2, 120, 1200);

  // ── Tir ──
  const cadence = culasse?.piece.cadence ? Math.round(culasse.piece.cadence * (1 + mods.cadence / 100) * (systeme === "verrou" ? 1 : clamp(1 + (indice - ideal) * 0.5, 0.85, 1.25))) : 0;
  const ecartCanon = cal && cc ? Math.log2(cal.longueurCanonRef / cc.longueur) * 2.5 : 0;
  const bruitDb = cal ? Math.round(cal.bruitDb + ecartCanon + mods.bruitDb) : 0;

  return {
    valide: !problemes.some(x => x.gravite === "erreur"),
    problemes, pieces,
    masse: { vide: masseVide / 1000, chargee: masseTotale / 1000 },
    longueur, centreGravite: cg, poignee, equilibre: cg.x - poignee, inertie,
    balistique: { vitesseInitiale: v0, energieBouche, zero, hauteurVisee, table, porteeEfficace },
    precision: { moa, dispersion100m: moa * 2.908 },
    recul: { impulsion: p, energieLibre: E, vertical: reculVertical, horizontal: reculHorizontal, monteeBouche },
    maniement: { ergonomie, tempsVisee, balancement },
    gaz: { indice, ideal, etat: etatGaz },
    fiabilite: { coupsEntreIncidents, risqueParCoup, incidents, usureParCoup, vieCanon },
    tir: { cadence, capacite, bruitDb, grossissement: mods.grossissement },
  };
}
