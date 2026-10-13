import type { Arme, Catalogue, Emplacement, Noeud, Piece, PiecePlacee, Probleme } from "./types";

// Parcourt l'arbre, place chaque pièce dans le repère de l'arme et calcule sa masse.
export function placer(arme: Arme, cat: Catalogue): PiecePlacee[] {
  const out: PiecePlacee[] = [];
  const visiter = (n: Noeud, chemin: string, x: number, y: number) => {
    const piece = cat.pieces[n.piece];
    if (!piece) return;
    const materiau = n.materiau ? cat.materiaux[n.materiau] : piece.materiaux ? cat.materiaux[piece.materiaux[0]] : undefined;
    const masse = piece.masse ?? (piece.volume && materiau ? piece.volume * materiau.densite : 0);
    const debut = x - (piece.arriere ?? 0);
    out.push({ chemin, piece, materiau, masse, x, y, cgX: debut + piece.longueur / 2, cgY: y + (piece.cgY ?? 0) });
    for (const e of piece.emplacements ?? []) {
      const enfant = n.enfants?.[e.id];
      if (enfant) visiter(enfant, `${chemin}/${e.id}`, x + e.x, y + e.y);
    }
  };
  visiter(arme.racine, cat.pieces[arme.racine.piece]?.id ?? "racine", 0, 0);
  return out;
}

// Vérifie que l'assemblage est montable : fixations, emplacements requis, calibre, place sur les rails.
export function verifier(arme: Arme, cat: Catalogue): Probleme[] {
  const pb: Probleme[] = [];
  const err = (chemin: string, message: string) => pb.push({ chemin, gravite: "erreur", message });
  const avert = (chemin: string, message: string) => pb.push({ chemin, gravite: "avertissement", message });

  if (!cat.calibres[arme.calibre]) err("", `Calibre inconnu : ${arme.calibre}`);

  const visiter = (n: Noeud, chemin: string, attendu?: Emplacement) => {
    const piece = cat.pieces[n.piece];
    if (!piece) return err(chemin, `Pièce inconnue : ${n.piece}`);
    if (attendu && !attendu.interfaces.includes(piece.fixation))
      err(chemin, `${piece.nom} ne se monte pas sur « ${attendu.nom} » (${attendu.interfaces.join(", ")} attendu).`);
    if (!attendu && piece.fixation !== "racine") err(chemin, `${piece.nom} ne peut pas servir de base à une arme.`);
    if (n.materiau && !piece.materiaux?.includes(n.materiau)) err(chemin, `${piece.nom} n'existe pas en ${cat.materiaux[n.materiau]?.nom ?? n.materiau}.`);
    if (piece.calibres && !piece.calibres.includes(arme.calibre))
      err(chemin, `${piece.nom} n'accepte pas le ${cat.calibres[arme.calibre]?.nom ?? arme.calibre}.`);

    const ids = new Set((piece.emplacements ?? []).map(e => e.id));
    for (const id of Object.keys(n.enfants ?? {})) if (!ids.has(id)) err(`${chemin}/${id}`, `${piece.nom} n'a pas d'emplacement « ${id} ».`);

    for (const e of piece.emplacements ?? []) {
      const enfant = n.enfants?.[e.id];
      if (!enfant) { if (e.requis) err(`${chemin}/${e.id}`, `Emplacement requis vide : ${e.nom}.`); continue; }
      visiter(enfant, `${chemin}/${e.id}`, e);
      if (e.longueurRail) {
        const p = cat.pieces[enfant.piece];
        const prise = p?.empreinte ?? p?.longueur ?? 0;
        if (prise > e.longueurRail) err(`${chemin}/${e.id}`, `${p?.nom} demande ${prise} mm de rail, ${e.longueurRail} mm disponibles.`);
      }
    }
  };
  visiter(arme.racine, cat.pieces[arme.racine.piece]?.id ?? "racine");

  // Cohérence d'ensemble
  const placees = placer(arme, cat);
  const canon = placees.find(p => p.piece.categorie === "canon");
  const gm = placees.find(p => p.piece.categorie === "garde-main");
  if (canon && gm && gm.x + gm.piece.longueur > canon.x + canon.piece.longueur)
    avert(gm.chemin, `Le garde-main dépasse la bouche du canon de ${Math.round(gm.x + gm.piece.longueur - canon.x - canon.piece.longueur)} mm.`);
  if (canon && gm && canon.piece.longueurGaz && gm.piece.longueur < canon.piece.longueurGaz - 40)
    avert(gm.chemin, "Le bloc gaz dépasse du garde-main : il chauffe et gêne la prise en main.");
  const opt = placees.filter(p => p.piece.categorie === "optique");
  const grossies = opt.filter(p => (p.piece.mods?.grossissement ?? 1) > 1);
  if (grossies.length > 1) avert(grossies[1].chemin, "Plusieurs optiques grossissantes : seule la première sert à viser.");
  if (!placees.some(p => p.piece.categorie === "optique")) avert("", "Aucun organe de visée : l'arme ne peut viser qu'au jugé.");
  return pb;
}

export function pieceDe(cat: Catalogue, id: string): Piece | undefined { return cat.pieces[id]; }
