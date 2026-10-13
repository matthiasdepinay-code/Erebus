import "./style.css";
import { CATALOGUE as CAT, EXEMPLES, calculer, type Arme, type Fiche, type Noeud, type Piece } from "../engine";

const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;
const esc = (s: string) => s.replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]!));
const fmt = (n: number, d = 0) => n.toLocaleString("fr-FR", { minimumFractionDigits: d, maximumFractionDigits: d });

let arme: Arme = structuredClone(EXEMPLES[0]);

// ───────── Barre du haut ─────────
$("exemple").innerHTML = EXEMPLES.map((a, i) => `<option value="${i}">${esc(a.nom)}</option>`).join("");
$("calibre").innerHTML = Object.values(CAT.calibres).map(c => `<option value="${c.id}">${esc(c.nom)}</option>`).join("");
$("exemple").addEventListener("change", e => { arme = structuredClone(EXEMPLES[+(e.target as HTMLSelectElement).value]); toutRendre(); });
$("calibre").addEventListener("change", e => { arme.calibre = (e.target as HTMLSelectElement).value; rendre(); });

// ───────── Arbre de pièces ─────────
function compatibles(interfaces: string[]): Piece[] {
  return Object.values(CAT.pieces).filter(p => interfaces.includes(p.fixation));
}

function remplacer(ancien: Noeud | undefined, piece: Piece): Noeud {
  const n: Noeud = { piece: piece.id };
  if (piece.materiaux) n.materiau = ancien?.materiau && piece.materiaux.includes(ancien.materiau) ? ancien.materiau : piece.materiaux[0];
  // On garde les sous-pièces qui ont encore un emplacement compatible.
  for (const e of piece.emplacements ?? []) {
    const enfant = ancien?.enfants?.[e.id];
    if (enfant && e.interfaces.includes(CAT.pieces[enfant.piece]?.fixation)) (n.enfants ??= {})[e.id] = enfant;
  }
  return n;
}

function rendreNoeud(n: Noeud, chemin: string): HTMLElement {
  const piece = CAT.pieces[n.piece];
  const div = document.createElement("div");
  div.className = "noeud";
  for (const e of piece.emplacements ?? []) {
    const enfant = n.enfants?.[e.id];
    const id = `${chemin}.${e.id}`.replace(/[^a-z0-9.-]/gi, "_");
    const options = compatibles(e.interfaces);
    const ep = enfant ? CAT.pieces[enfant.piece] : undefined;
    const bloc = document.createElement("div");
    bloc.className = "empl";
    bloc.innerHTML = `<label for="p-${id}">${esc(e.nom)}${e.requis ? ' <span class="req">requis</span>' : ""}${e.longueurRail ? ` · ${e.longueurRail} mm` : ""}</label>
      <div class="duo-sel">
        <select id="p-${id}"><option value="">${e.requis ? "À choisir" : "Aucune"}</option>${options.map(o => {
          const horsCal = o.calibres && !o.calibres.includes(arme.calibre);
          return `<option value="${o.id}" ${o.id === enfant?.piece ? "selected" : ""}>${esc(o.nom)}${horsCal ? " (autre calibre)" : ""}</option>`;
        }).join("")}</select>
        ${ep?.materiaux ? `<select id="m-${id}" aria-label="Matériau ${esc(e.nom)}">${ep.materiaux.map(m => `<option value="${m}" ${m === enfant?.materiau ? "selected" : ""}>${esc(CAT.materiaux[m].nom)}</option>`).join("")}</select>` : `<span></span>`}
      </div>
      <div class="spec" data-chemin="${esc(chemin + "/" + e.id)}"></div>`;
    bloc.querySelector<HTMLSelectElement>(`#p-${CSS.escape(id)}`)!.addEventListener("change", ev => {
      const v = (ev.target as HTMLSelectElement).value;
      if (!v) { if (n.enfants) delete n.enfants[e.id]; }
      else (n.enfants ??= {})[e.id] = remplacer(enfant, CAT.pieces[v]);
      toutRendre();
    });
    bloc.querySelector<HTMLSelectElement>(`#m-${CSS.escape(id)}`)?.addEventListener("change", ev => { enfant!.materiau = (ev.target as HTMLSelectElement).value; rendre(); });
    if (enfant && ep?.emplacements?.length) bloc.appendChild(rendreNoeud(enfant, `${chemin}/${e.id}`));
    div.appendChild(bloc);
  }
  return div;
}

function rendreArbre() {
  const racine = CAT.pieces[arme.racine.piece];
  const arbre = $("arbre");
  arbre.innerHTML = "";
  const tete = document.createElement("div");
  tete.className = "empl";
  tete.innerHTML = `<label for="m-racine">${esc(racine.nom)}</label>
    ${racine.materiaux ? `<select id="m-racine">${racine.materiaux.map(m => `<option value="${m}" ${m === arme.racine.materiau ? "selected" : ""}>${esc(CAT.materiaux[m].nom)}</option>`).join("")}</select>` : ""}
    <div class="spec" data-chemin="${racine.id}"></div>`;
  tete.querySelector<HTMLSelectElement>("#m-racine")?.addEventListener("change", ev => { arme.racine.materiau = (ev.target as HTMLSelectElement).value; rendre(); });
  arbre.appendChild(tete);
  arbre.appendChild(rendreNoeud(arme.racine, racine.id));
}

// ───────── Plan de profil ─────────
const TEINTES: Record<string, string> = {
  carcasse: "#6f7a83", canon: "#4a5157", culasse: "#8a7c62", "systeme-gaz": "#9a6b3c", "garde-main": "#7d8b95", crosse: "#5c646b",
  "tube-crosse": "#8e979e", poignee: "#3f4549", chargeur: "#555c61", bouche: "#3a3f43", silencieux: "#2f3438", optique: "#2c4a5c",
  "poignee-avant": "#4c5358", accessoire: "#61707a", detente: "#a8742a", "levier-armement": "#7a7f84", rail: "#8d969c",
};
const INTERNES = new Set(["culasse", "detente"]);

function dessiner(f: Fiche) {
  const ps = f.pieces;
  const xMin = Math.min(...ps.map(p => p.x - (p.piece.arriere ?? 0)));
  const xMax = Math.max(...ps.map(p => p.x - (p.piece.arriere ?? 0) + p.piece.longueur));
  const yMax = Math.max(...ps.map(p => p.cgY + p.piece.hauteur / 2)), yMin = Math.min(...ps.map(p => p.cgY - p.piece.hauteur / 2));
  const W = 900, pad = 24;
  const s = (W - 2 * pad) / (xMax - xMin);
  const H = Math.max(180, (yMax - yMin) * s + 70);
  const X = (x: number) => pad + (x - xMin) * s, Y = (y: number) => 20 + (yMax - y) * s;
  const css = getComputedStyle(document.documentElement);
  const c = (v: string) => css.getPropertyValue(v).trim();
  let g = "";
  for (let x = Math.ceil(xMin / 100) * 100; x <= xMax; x += 100)
    g += `<line x1="${X(x)}" x2="${X(x)}" y1="12" y2="${H - 26}" stroke="${c("--grid")}"/><text x="${X(x)}" y="${H - 10}" font-size="10" text-anchor="middle" fill="${c("--muted")}" font-family="IBM Plex Mono, monospace">${x}</text>`;
  // Les grandes pièces d'abord, pour que les petites restent visibles par-dessus.
  const aire = (p: (typeof ps)[number]) => p.piece.longueur * p.piece.hauteur;
  const ordre = [...ps].sort((a, b) => aire(b) - aire(a));
  for (const p of ordre) {
    const debut = p.x - (p.piece.arriere ?? 0);
    const h = p.piece.hauteur;
    const interne = INTERNES.has(p.piece.categorie);
    g += `<rect x="${X(debut)}" y="${Y(p.cgY + h / 2)}" width="${Math.max(2, p.piece.longueur * s)}" height="${h * s}" rx="${Math.min(4, h * s / 3)}"
      fill="${TEINTES[p.piece.categorie] ?? "#777"}" fill-opacity="${interne ? 0.35 : 0.92}" stroke="${c("--ink")}" stroke-opacity=".25">
      <title>${esc(p.piece.nom)}${p.materiau ? " · " + esc(p.materiau.nom) : ""} · ${fmt(p.masse)} g</title></rect>`;
  }
  g += `<line x1="${X(xMin)}" x2="${X(xMax)}" y1="${Y(0)}" y2="${Y(0)}" stroke="${c("--accent")}" stroke-dasharray="2 4" stroke-opacity=".7"/>`;
  g += `<line x1="${X(f.poignee)}" x2="${X(f.poignee)}" y1="12" y2="${H - 28}" stroke="${c("--muted")}" stroke-dasharray="4 3"/>`;
  g += `<text x="${X(f.poignee) + 4}" y="22" font-size="11" fill="${c("--muted")}" stroke="${c("--panel")}" stroke-width="3" paint-order="stroke" font-family="IBM Plex Sans, sans-serif">main forte</text>`;
  g += `<circle cx="${X(f.centreGravite.x)}" cy="${Y(f.centreGravite.y)}" r="7" fill="${c("--panel")}" stroke="${c("--accent")}" stroke-width="2"/><circle cx="${X(f.centreGravite.x)}" cy="${Y(f.centreGravite.y)}" r="2.5" fill="${c("--accent")}"/>`;
  g += `<text x="${X(f.centreGravite.x) + 11}" y="${Y(f.centreGravite.y) + 4}" font-size="11" font-weight="600" fill="${c("--accent")}" stroke="${c("--panel")}" stroke-width="3" paint-order="stroke" font-family="IBM Plex Sans, sans-serif">centre de gravité</text>`;
  $("plan").innerHTML = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Profil de l'arme assemblée, en millimètres">${g}</svg>`;
  $("legende").innerHTML = `<span>mm depuis l'arrière de la carcasse</span><span>pointillé : axe du canon</span><span>pièces internes en transparence</span>`;
}

// ───────── Fiche ─────────
const jauge = (k: string, v: number, max: number, aff: string, h: string) =>
  `<div class="jauge"><div class="l"><span class="k">${k}</span><span class="v">${aff}</span></div><div class="bar"><b style="width:${Math.min(100, v / max * 100)}%"></b></div><div class="h">${h}</div></div>`;

function fiche(f: Fiche) {
  const b = f.balistique;
  $("chiffres").innerHTML = [
    [fmt(f.masse.chargee, 2), "kg chargée"], [fmt(f.longueur), "mm"], [fmt(b.vitesseInitiale), "m/s"], [fmt(b.energieBouche), "J à la bouche"],
    [fmt(f.precision.moa, 2), "MOA"], [f.tir.cadence ? fmt(f.tir.cadence) : "—", "coups/min"], [fmt(f.tir.capacite), "coups"], [fmt(f.tir.bruitDb), "dB"],
  ].map(([n, u]) => `<div class="chiffre"><div class="n">${n}</div><div class="u">${u}</div></div>`).join("");

  $("jauges").innerHTML = [
    jauge("Ergonomie", f.maniement.ergonomie, 100, fmt(f.maniement.ergonomie), "Prise en main, poids et accessoires."),
    jauge("Temps de visée", f.maniement.tempsVisee, 1000, `${fmt(f.maniement.tempsVisee)} ms`, `Inertie autour de la main : ${fmt(f.inertie, 3)} kg·m².`),
    jauge("Recul vertical", f.recul.vertical, 120, fmt(f.recul.vertical), `Recul libre ${fmt(f.recul.energieLibre, 1)} J, impulsion ${fmt(f.recul.impulsion, 1)} N·s.`),
    jauge("Recul horizontal", f.recul.horizontal, 120, fmt(f.recul.horizontal), "Dispersion latérale en rafale."),
    jauge("Montée de bouche", f.recul.monteeBouche, 120, fmt(f.recul.monteeBouche), "Couple autour de l'appui, freiné par l'inertie."),
    jauge("Balancement", f.maniement.balancement, 20, `${fmt(f.maniement.balancement, 1)} N·m`, `Équilibre ${fmt(f.equilibre)} mm devant la main forte.`),
  ].join("");

  const pos = Math.max(0, Math.min(100, f.gaz.indice / (f.gaz.ideal * 2) * 100));
  const fi = f.fiabilite;
  $("gaz").innerHTML = (f.gaz.etat === "manuel"
    ? `<p class="h">Arme à répétition manuelle : pas de système à gaz.</p>`
    : `<div class="gazlib"><span>sous-alimenté</span><span>correct</span><span>suralimenté</span></div><div class="gazbar"><i style="left:${pos}%"></i></div>`) +
    `<dl class="kv">
      <dt>État du système</dt><dd>${f.gaz.etat}</dd>
      <dt>Coups moyens entre incidents</dt><dd>${fmt(fi.coupsEntreIncidents)}</dd>
      <dt>Vie du canon</dt><dd>${fmt(fi.vieCanon)} coups</dd>
      ${Object.entries(fi.incidents).sort((a, b) => b[1] - a[1]).map(([k, v]) => `<dt>${k}</dt><dd>${fmt(v * 100)} %</dd>`).join("")}
    </dl>`;

  const t = b.table.filter(p => p.distance % 100 === 0);
  $("balistique").innerHTML = `<dl class="kv"><dt>Zérotage</dt><dd>${b.zero} m</dd><dt>Hauteur de visée</dt><dd>${fmt(b.hauteurVisee)} mm</dd><dt>Portée efficace</dt><dd>${b.porteeEfficace ? b.porteeEfficace + " m" : "< 50 m"}</dd></dl>
    <div class="courbe">${courbe(f)}</div>
    <div class="table-wrap"><table><thead><tr><th>Distance</th><th>Chute</th><th>Vitesse</th><th>Énergie</th><th>Vent 3 m/s</th></tr></thead><tbody>
    ${t.map(p => `<tr><td>${p.distance} m</td><td>${fmt(p.chute, 1)} cm</td><td>${fmt(p.vitesse)} m/s</td><td>${fmt(p.energie)} J</td><td>${fmt(p.derive, 1)} cm</td></tr>`).join("")}
    </tbody></table></div>`;

  const pb = f.problemes;
  $("problemes").innerHTML = pb.length
    ? pb.map(p => `<li><span class="pastille ${p.gravite}">${p.gravite}</span><span>${esc(p.message)}</span></li>`).join("")
    : `<li><span class="pastille ok">prête</span><span>L'arme est complète et montable.</span></li>`;

  for (const el of document.querySelectorAll<HTMLElement>(".spec[data-chemin]")) {
    const p = f.pieces.find(x => x.chemin === el.dataset.chemin);
    el.textContent = p ? `${fmt(p.masse)} g · ${p.piece.longueur} mm` : "";
  }
}

function courbe(f: Fiche): string {
  const pts = f.balistique.table.filter(p => p.distance <= 800);
  if (!pts.length) return "";
  const css = getComputedStyle(document.documentElement);
  const c = (v: string) => css.getPropertyValue(v).trim();
  const W = 420, H = 150, gx = 36, gy = 12;
  const minY = Math.min(-50, ...pts.map(p => p.chute)), maxY = Math.max(20, ...pts.map(p => p.chute));
  const X = (d: number) => gx + d / 800 * (W - gx - 8), Y = (v: number) => gy + (maxY - v) / (maxY - minY) * (H - gy - 22);
  let g = `<line x1="${gx}" x2="${W - 8}" y1="${Y(0)}" y2="${Y(0)}" stroke="${c("--muted")}" stroke-dasharray="3 3"/>`;
  for (let d = 200; d <= 800; d += 200) g += `<text x="${X(d)}" y="${H - 6}" font-size="10" text-anchor="middle" fill="${c("--muted")}" font-family="IBM Plex Mono, monospace">${d} m</text>`;
  g += `<text x="${gx - 4}" y="${Y(0) + 3}" font-size="10" text-anchor="end" fill="${c("--muted")}" font-family="IBM Plex Mono, monospace">0</text>`;
  g += `<text x="${gx - 4}" y="${Y(minY) + 3}" font-size="10" text-anchor="end" fill="${c("--muted")}" font-family="IBM Plex Mono, monospace">${fmt(minY / 100, 1)} m</text>`;
  const d = [{ distance: 0, chute: -f.balistique.hauteurVisee / 10 }, ...pts].map((p, i) => `${i ? "L" : "M"}${X(p.distance).toFixed(1)},${Y(p.chute).toFixed(1)}`).join(" ");
  g += `<path d="${d}" fill="none" stroke="${c("--accent")}" stroke-width="2"/>`;
  const z = pts.find(p => p.distance === f.balistique.zero);
  if (z) g += `<circle cx="${X(z.distance)}" cy="${Y(z.chute)}" r="3.5" fill="${c("--accent")}"/><text x="${X(z.distance)}" y="${Y(z.chute) - 8}" font-size="10" text-anchor="middle" fill="${c("--accent")}" font-family="IBM Plex Sans, sans-serif">zéro</text>`;
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Courbe de chute par rapport à la ligne de visée">${g}</svg>`;
}

// ───────── Export / import ─────────
$("basculer").addEventListener("click", () => {
  const cache = !$("json").hidden;
  $("json").hidden = cache; $("importer").hidden = cache;
  $("basculer").textContent = cache ? "Afficher l'export" : "Masquer l'export";
});
$("copier").addEventListener("click", async () => {
  const ta = $<HTMLTextAreaElement>("json");
  try { await navigator.clipboard.writeText(ta.value); $("copier").textContent = "Copié"; }
  catch { ta.hidden = false; $("importer").hidden = false; ta.select(); $("copier").textContent = "Sélectionné : Ctrl+C pour copier"; }
  setTimeout(() => ($("copier").textContent = "Copier l'export JSON"), 2000);
});
$("importer").addEventListener("click", () => {
  try {
    const a = JSON.parse($<HTMLTextAreaElement>("json").value).arme as Arme;
    if (!a?.racine?.piece || !CAT.pieces[a.racine.piece]) throw new Error();
    arme = a; toutRendre();
  } catch { $("importer").textContent = "JSON illisible : vérifiez le format"; setTimeout(() => ($("importer").textContent = "Charger ce JSON"), 2500); }
});

function rendre() {
  $<HTMLSelectElement>("calibre").value = arme.calibre;
  const f = calculer(arme, CAT);
  dessiner(f); fiche(f);
  const r = (n: number, d = 2) => +n.toFixed(d);
  $<HTMLTextAreaElement>("json").value = JSON.stringify({
    format: "erebus-arme/0.2", arme,
    fiche: {
      valide: f.valide, masse_kg: r(f.masse.chargee, 3), longueur_mm: r(f.longueur, 0), equilibre_mm: r(f.equilibre, 0), inertie_kgm2: r(f.inertie, 4),
      vitesse_initiale_ms: r(f.balistique.vitesseInitiale, 0), energie_bouche_j: r(f.balistique.energieBouche, 0), precision_moa: r(f.precision.moa),
      recul: { vertical: r(f.recul.vertical, 1), horizontal: r(f.recul.horizontal, 1), montee: r(f.recul.monteeBouche, 1), energie_libre_j: r(f.recul.energieLibre) },
      ergonomie: r(f.maniement.ergonomie, 0), temps_visee_ms: r(f.maniement.tempsVisee, 0), cadence: f.tir.cadence, capacite: f.tir.capacite, bruit_db: f.tir.bruitDb,
      gaz: f.gaz.etat, coups_entre_incidents: f.fiabilite.coupsEntreIncidents, portee_efficace_m: f.balistique.porteeEfficace,
    },
  }, null, 2);
}
function toutRendre() { rendreArbre(); rendre(); }

matchMedia("(prefers-color-scheme: dark)").addEventListener("change", rendre);
new MutationObserver(rendre).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
toutRendre();
