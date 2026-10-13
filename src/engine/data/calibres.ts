import type { Calibre } from "../types";

// Valeurs de jeu, proches des munitions de service usuelles.
export const CALIBRES: Record<string, Calibre> = {
  "5.56x45": {
    id: "5.56x45", nom: "5,56×45 mm", masseProjectile: 4.0, masseCharge: 1.65, vitesseRef: 940, longueurCanonRef: 508,
    coefBalistiqueG1: 0.304, diametre: 5.7, pression: 0.95, bruitDb: 165, masseCartouche: 12.3, sensibiliteCanon: 0.21,
  },
  "300blk": {
    id: "300blk", nom: ".300 Blackout", masseProjectile: 7.1, masseCharge: 1.25, vitesseRef: 680, longueurCanonRef: 406,
    coefBalistiqueG1: 0.295, diametre: 7.8, pression: 0.72, bruitDb: 158, masseCartouche: 15.0, sensibiliteCanon: 0.16,
  },
  "7.62x39": {
    id: "7.62x39", nom: "7,62×39 mm", masseProjectile: 7.9, masseCharge: 1.6, vitesseRef: 715, longueurCanonRef: 415,
    coefBalistiqueG1: 0.275, diametre: 7.9, pression: 0.78, bruitDb: 161, masseCartouche: 16.3, sensibiliteCanon: 0.18,
  },
  "7.62x51": {
    id: "7.62x51", nom: "7,62×51 mm", masseProjectile: 9.5, masseCharge: 2.8, vitesseRef: 850, longueurCanonRef: 610,
    coefBalistiqueG1: 0.4, diametre: 7.8, pression: 1.0, bruitDb: 167, masseCartouche: 25.5, sensibiliteCanon: 0.22,
  },
  "9x19": {
    id: "9x19", nom: "9×19 mm", masseProjectile: 8.0, masseCharge: 0.4, vitesseRef: 360, longueurCanonRef: 102,
    coefBalistiqueG1: 0.14, diametre: 9.0, pression: 0.55, bruitDb: 160, masseCartouche: 12.0, sensibiliteCanon: 0.13,
  },
};
