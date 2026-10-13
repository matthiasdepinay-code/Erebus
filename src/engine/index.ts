import { CALIBRES } from "./data/calibres";
import { MATERIAUX } from "./data/materiaux";
import { PIECES } from "./data/pieces";
import type { Catalogue } from "./types";

export * from "./types";
export { placer, verifier } from "./assemblage";
export { trajectoire, vitesseInitiale, cdG1, angleZero } from "./balistique";
export { calculer, type Fiche } from "./stats";
export { EXEMPLES } from "./data/exemples";

export const CATALOGUE: Catalogue = { materiaux: MATERIAUX, calibres: CALIBRES, pieces: PIECES };
