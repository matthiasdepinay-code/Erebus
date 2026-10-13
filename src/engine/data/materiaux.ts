import type { Materiau } from "../types";

export const MATERIAUX: Record<string, Materiau> = {
  "acier-4140": { id: "acier-4140", nom: "Acier allié", densite: 7.85, rigidite: 0.85, resistanceUsure: 0.8, dissipation: 0.6 },
  "inox-416": { id: "inox-416", nom: "Inox", densite: 7.75, rigidite: 0.82, resistanceUsure: 0.9, dissipation: 0.55 },
  "acier-chrome": { id: "acier-chrome", nom: "Acier chromé", densite: 7.85, rigidite: 0.85, resistanceUsure: 0.97, dissipation: 0.6 },
  "alu-7075": { id: "alu-7075", nom: "Aluminium 7075", densite: 2.81, rigidite: 0.6, resistanceUsure: 0.55, dissipation: 0.85 },
  "alu-6061": { id: "alu-6061", nom: "Aluminium 6061", densite: 2.7, rigidite: 0.5, resistanceUsure: 0.45, dissipation: 0.85 },
  "titane": { id: "titane", nom: "Titane", densite: 4.43, rigidite: 0.7, resistanceUsure: 0.85, dissipation: 0.4 },
  "polymere": { id: "polymere", nom: "Polymère renforcé", densite: 1.35, rigidite: 0.3, resistanceUsure: 0.5, dissipation: 0.2 },
  "carbone": { id: "carbone", nom: "Fibre de carbone", densite: 1.6, rigidite: 0.75, resistanceUsure: 0.7, dissipation: 0.5 },
  "noyer": { id: "noyer", nom: "Noyer", densite: 0.65, rigidite: 0.35, resistanceUsure: 0.4, dissipation: 0.3 },
  "bouleau": { id: "bouleau", nom: "Bouleau lamellé", densite: 0.72, rigidite: 0.4, resistanceUsure: 0.45, dissipation: 0.3 },
};
