import { describe, expect, it } from "vitest";
import { CATALOGUE, EXEMPLES, calculer, cdG1, trajectoire, vitesseInitiale, verifier, type Arme } from "../src/engine";

const clone = (a: Arme): Arme => structuredClone(a);
const ar = () => clone(EXEMPLES[0]);
const fusil = (a: Arme) => a.racine.enfants!;

describe("exemples", () => {
  it.each(EXEMPLES.map(a => [a.nom, a] as const))("%s est montable", (_, a) => {
    expect(verifier(a, CATALOGUE).filter(p => p.gravite === "erreur")).toEqual([]);
  });
});

describe("compatibilité", () => {
  it("refuse une pièce qui n'a pas la bonne fixation", () => {
    const a = ar(); fusil(a).canon = { piece: "ak-canon-415" };
    expect(verifier(a, CATALOGUE).some(p => p.gravite === "erreur" && p.chemin === "ar-carcasse/canon")).toBe(true);
  });
  it("signale un emplacement requis vide", () => {
    const a = ar(); delete fusil(a).culasse;
    expect(verifier(a, CATALOGUE).map(p => p.message)).toContain("Emplacement requis vide : Ensemble culasse.");
  });
  it("refuse un calibre que le canon n'accepte pas", () => {
    const a = ar(); a.calibre = "300blk";
    expect(verifier(a, CATALOGUE).some(p => p.message.includes("n'accepte pas"))).toBe(true);
  });
  it("refuse une optique trop longue pour le rail", () => {
    const a = clone(EXEMPLES[1]);
    fusil(a).couvercle = { piece: "ak-couvercle-rail", enfants: { rail: { piece: "vis-5-25" } } };
    expect(verifier(a, CATALOGUE).filter(p => p.gravite === "erreur")).toEqual([]);
    const b = clone(EXEMPLES[0]);
    fusil(b)["garde-main"] = { piece: "ar-gm-mlok-230", enfants: { "mlok-bas": { piece: "acc-lampe" }, "rail-haut": { piece: "vis-5-25" } } };
    expect(verifier(b, CATALOGUE).filter(p => p.gravite === "erreur")).toEqual([]);
    const c = clone(EXEMPLES[0]);
    fusil(c).rail = { piece: "vis-5-25" };   // 170 mm sur un rail de 165 mm
    expect(verifier(c, CATALOGUE).some(p => p.message.includes("mm de rail"))).toBe(true);
  });
  it("refuse un matériau que la pièce n'a pas", () => {
    const a = ar(); fusil(a).canon.materiau = "polymere";
    expect(verifier(a, CATALOGUE).some(p => p.message.includes("n'existe pas en"))).toBe(true);
  });
});

describe("physique", () => {
  it("un canon plus long donne une vitesse initiale plus haute", () => {
    const c = CATALOGUE.calibres["5.56x45"];
    expect(vitesseInitiale(c, 508)).toBeCloseTo(940, 0);
    expect(vitesseInitiale(c, 267)).toBeLessThan(vitesseInitiale(c, 368));
  });
  it("la trajectoire recoupe la ligne de visée à la distance de zérotage", () => {
    const c = CATALOGUE.calibres["7.62x51"];
    const t = trajectoire(c, 850, { hauteurVisee: 50, zero: 300 });
    expect(Math.abs(t.find(p => p.distance === 300)!.chute)).toBeLessThan(0.5);
    expect(t.find(p => p.distance === 600)!.chute).toBeLessThan(-100);
  });
  it("la traînée G1 culmine au-dessus du mur du son", () => {
    expect(cdG1(1.3)).toBeGreaterThan(cdG1(0.8));
    expect(cdG1(0.8)).toBeGreaterThan(cdG1(0.5));
  });
  it("le 5,56 garde une vitesse plausible à 300 m", () => {
    const f = calculer(EXEMPLES[0], CATALOGUE);
    const v300 = f.balistique.table.find(p => p.distance === 300)!.vitesse;
    expect(v300).toBeGreaterThan(580);
    expect(v300).toBeLessThan(720);
  });
  it("une arme plus lourde a moins d'énergie de recul libre", () => {
    const leger = calculer(EXEMPLES[0], CATALOGUE);
    const a = ar(); fusil(a).canon.enfants!.bouche = { piece: "bouche-a2-556" };
    fusil(a).chargeur = { piece: "ar-chargeur-60" };
    const lourd = calculer(a, CATALOGUE);
    expect(lourd.masse.chargee).toBeGreaterThan(leger.masse.chargee);
    expect(lourd.recul.energieLibre).toBeLessThan(leger.recul.energieLibre);
  });
  it("un frein de bouche réduit le recul vertical", () => {
    const a = ar(); fusil(a).canon.enfants!.bouche = { piece: "bouche-frein-556" };
    expect(calculer(a, CATALOGUE).recul.vertical).toBeLessThan(calculer(EXEMPLES[0], CATALOGUE).recul.vertical);
  });
  it("sans crosse, le recul est bien plus dur à tenir", () => {
    const a = ar(); fusil(a).tube = { piece: "ar-tube-pistolet" };
    expect(calculer(a, CATALOGUE).recul.vertical).toBeGreaterThan(1.5 * calculer(EXEMPLES[0], CATALOGUE).recul.vertical);
  });
});

describe("gaz et fiabilité", () => {
  const silencieux = () => {
    const a = ar();
    fusil(a).canon.enfants!.bouche = { piece: "bouche-qd-556", enfants: { silencieux: { piece: "sil-qd-556" } } };
    return a;
  };
  it("un silencieux baisse le bruit et suralimente le système à gaz", () => {
    const base = calculer(EXEMPLES[0], CATALOGUE), sil = calculer(silencieux(), CATALOGUE);
    expect(sil.tir.bruitDb).toBeLessThan(base.tir.bruitDb - 20);
    expect(sil.gaz.indice).toBeGreaterThan(base.gaz.indice);
    expect(sil.gaz.etat).toBe("suralimenté");
    expect(sil.fiabilite.coupsEntreIncidents).toBeLessThan(base.fiabilite.coupsEntreIncidents);
  });
  it("un bloc gaz réglable rattrape la suralimentation", () => {
    const a = silencieux(); fusil(a).canon.enfants!["bloc-gaz"] = { piece: "bloc-gaz-reglable" };
    const f = calculer(a, CATALOGUE);
    expect(f.gaz.etat).toBe("correct");
  });
  it("les proportions d'incidents somment à 1", () => {
    const f = calculer(EXEMPLES[0], CATALOGUE);
    expect(Object.values(f.fiabilite.incidents).reduce((a, b) => a + b, 0)).toBeCloseTo(1, 6);
  });
  it("une arme à verrou est manuelle et très fiable", () => {
    const f = calculer(EXEMPLES[2], CATALOGUE);
    expect(f.gaz.etat).toBe("manuel");
    expect(f.fiabilite.coupsEntreIncidents).toBeGreaterThan(5000);
  });
});

describe("précision", () => {
  it("un garde-main non flottant dégrade la précision", () => {
    const a = ar(); fusil(a)["garde-main"] = { piece: "ar-gm-quad" };
    expect(calculer(a, CATALOGUE).precision.moa).toBeGreaterThan(calculer(EXEMPLES[0], CATALOGUE).precision.moa);
  });
  it("le fusil de précision porte plus loin que la carabine", () => {
    expect(calculer(EXEMPLES[2], CATALOGUE).balistique.porteeEfficace).toBeGreaterThan(calculer(EXEMPLES[0], CATALOGUE).balistique.porteeEfficace);
  });
});
