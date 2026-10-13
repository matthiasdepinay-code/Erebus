import type { Arme } from "../types";

export const EXEMPLES: Arme[] = [
  {
    nom: "Carabine AR 368 mm", calibre: "5.56x45",
    racine: { piece: "ar-carcasse", materiau: "alu-7075", enfants: {
      canon: { piece: "ar-canon-368", materiau: "acier-chrome", enfants: {
        "bloc-gaz": { piece: "bloc-gaz-fixe" },
        bouche: { piece: "bouche-a2-556" },
      } },
      culasse: { piece: "ar-culasse-std" },
      detente: { piece: "ar-detente-mil" },
      chargeur: { piece: "ar-chargeur-30" },
      poignee: { piece: "ar-poignee-a2", materiau: "polymere" },
      tube: { piece: "ar-tube-carabine", materiau: "alu-7075", enfants: { crosse: { piece: "ar-crosse-telescopique", materiau: "polymere" } } },
      "garde-main": { piece: "ar-gm-mlok-330", materiau: "alu-7075", enfants: { "mlok-bas": { piece: "pav-angle" } } },
      levier: { piece: "ar-levier-std" },
      rail: { piece: "vis-point-rouge" },
    } },
  },
  {
    nom: "AK 415 mm", calibre: "7.62x39",
    racine: { piece: "ak-carcasse", materiau: "acier-4140", enfants: {
      canon: { piece: "ak-canon-415", materiau: "acier-chrome", enfants: { bouche: { piece: "bouche-ak-frein" } } },
      culasse: { piece: "ak-culasse-std" },
      detente: { piece: "ak-detente-std" },
      chargeur: { piece: "ak-chargeur-acier" },
      poignee: { piece: "ak-poignee-std", materiau: "polymere" },
      crosse: { piece: "ak-crosse-bois", materiau: "bouleau" },
      "garde-main": { piece: "ak-gm-bois", materiau: "bouleau" },
      couvercle: { piece: "ak-couvercle-std", materiau: "acier-4140" },
    } },
  },
  {
    nom: "Fusil de précision à verrou", calibre: "7.62x51",
    racine: { piece: "verrou-action", materiau: "acier-4140", enfants: {
      canon: { piece: "verrou-canon-610", materiau: "inox-416", enfants: { bouche: { piece: "bouche-frein-58" } } },
      culasse: { piece: "verrou-culasse-308" },
      chassis: { piece: "verrou-chassis-alu", materiau: "alu-7075", enfants: {
        chargeur: { piece: "verrou-chargeur-10" },
        detente: { piece: "verrou-detente-match" },
        poignee: { piece: "ar-poignee-ergo", materiau: "polymere" },
        "mlok-bas": { piece: "pav-bipied" },
      } },
      rail: { piece: "vis-5-25" },
    } },
  },
];
