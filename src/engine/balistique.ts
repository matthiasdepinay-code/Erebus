import type { Calibre } from "./types";

// Table de traînée standard G1 (Mach → Cd), interpolée linéairement.
const G1: [number, number][] = [
  [0, 0.2629], [0.5, 0.2032], [0.6, 0.2034], [0.7, 0.2165], [0.8, 0.2368], [0.85, 0.2525], [0.9, 0.2848],
  [0.95, 0.3505], [1.0, 0.4045], [1.05, 0.4579], [1.1, 0.4923], [1.2, 0.5235], [1.3, 0.5323], [1.4, 0.5315],
  [1.5, 0.5241], [1.6, 0.5145], [1.8, 0.4942], [2.0, 0.4732], [2.2, 0.4532], [2.5, 0.4262], [3.0, 0.3913], [4.0, 0.3434], [5.0, 0.3096],
];

export function cdG1(mach: number): number {
  if (mach <= G1[0][0]) return G1[0][1];
  for (let i = 1; i < G1.length; i++) {
    const [m1, c1] = G1[i];
    if (mach <= m1) { const [m0, c0] = G1[i - 1]; return c0 + (c1 - c0) * (mach - m0) / (m1 - m0); }
  }
  return G1[G1.length - 1][1];
}

export interface Atmosphere { densite: number; vitesseSon: number; gravite: number }
export const ATMO_STANDARD: Atmosphere = { densite: 1.225, vitesseSon: 340.3, gravite: 9.80665 };

// Vitesse initiale selon la longueur de canon : v = vRef × (L / Lref)^k.
export function vitesseInitiale(cal: Calibre, longueurCanon: number): number {
  return cal.vitesseRef * Math.pow(longueurCanon / cal.longueurCanonRef, cal.sensibiliteCanon);
}

export interface PointTrajectoire {
  distance: number;    // m
  chute: number;       // cm par rapport à la ligne de visée (négatif = sous la ligne)
  vitesse: number;     // m/s
  energie: number;     // J
  temps: number;       // s
  derive: number;      // cm, vent de travers
}

interface Etat { x: number; y: number; vx: number; vy: number; t: number }

// Intègre la trajectoire d'un projectile ponctuel (Euler semi-implicite, pas de 0,5 ms).
function integrer(cal: Calibre, v0: number, angle: number, distanceMax: number, atmo: Atmosphere, surPas: (e: Etat) => boolean | void) {
  const bcSI = cal.coefBalistiqueG1 * 703.07;        // lb/in² → kg/m²
  const dt = 0.0005;
  const e: Etat = { x: 0, y: 0, vx: v0 * Math.cos(angle), vy: v0 * Math.sin(angle), t: 0 };
  while (e.x < distanceMax && e.t < 5) {
    const v = Math.hypot(e.vx, e.vy);
    const decel = atmo.densite * v * v * cdG1(v / atmo.vitesseSon) * Math.PI / (8 * bcSI);
    e.vx -= (decel * e.vx / v) * dt;
    e.vy -= ((decel * e.vy / v) + atmo.gravite) * dt;
    e.x += e.vx * dt; e.y += e.vy * dt; e.t += dt;
    if (surPas(e)) return;
  }
}

// Angle de tir qui ramène le projectile sur la ligne de visée à la distance de zérotage.
export function angleZero(cal: Calibre, v0: number, hauteurVisee: number, zero: number, atmo = ATMO_STANDARD): number {
  let bas = -0.01, haut = 0.05;
  for (let i = 0; i < 40; i++) {
    const milieu = (bas + haut) / 2;
    let y = -Infinity;
    integrer(cal, v0, milieu, zero, atmo, e => { if (e.x >= zero) { y = e.y; return true; } });
    if (y > hauteurVisee) haut = milieu; else bas = milieu;
  }
  return (bas + haut) / 2;
}

export function trajectoire(
  cal: Calibre, v0: number, opts: { hauteurVisee: number; zero: number; pas?: number; max?: number; vent?: number; atmo?: Atmosphere },
): PointTrajectoire[] {
  const atmo = opts.atmo ?? ATMO_STANDARD;
  const pas = opts.pas ?? 50, max = opts.max ?? 800, vent = opts.vent ?? 3;
  const hv = opts.hauteurVisee / 1000;
  const a = angleZero(cal, v0, hv, opts.zero, atmo);
  const pts: PointTrajectoire[] = [];
  let prochain = pas;
  const m = cal.masseProjectile / 1000;
  integrer(cal, v0, a, max + 1, atmo, e => {
    if (e.x >= prochain) {
      const v = Math.hypot(e.vx, e.vy);
      pts.push({
        distance: prochain,
        chute: (e.y - hv) * 100,
        vitesse: v,
        energie: 0.5 * m * v * v,
        temps: e.t,
        derive: vent * (e.t - prochain / v0) * 100,   // formule de Didion
      });
      prochain += pas;
    }
  });
  return pts;
}
