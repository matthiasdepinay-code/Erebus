// Regroupe le build Vite en un seul fichier HTML autonome (dist/atelier-erebus.html),
// pratique pour partager l'éditeur sans serveur.
import { readFileSync, readdirSync, writeFileSync } from "node:fs";

const assets = readdirSync("dist/assets");
const css = readFileSync(`dist/assets/${assets.find(f => f.endsWith(".css"))}`, "utf8");
const js = readFileSync(`dist/assets/${assets.find(f => f.endsWith(".js"))}`, "utf8").replaceAll("</script", "<\\/script");
const html = readFileSync("dist/index.html", "utf8")
  .replace(/<link rel="stylesheet" crossorigin href="\/assets\/[^"]+">/, `<style>${css}</style>`)
  .replace(/<script type="module" crossorigin src="\/assets\/[^"]+"><\/script>/, "")
  .replace("</body>", `<script type="module">${js}</script>\n</body>`);
writeFileSync("dist/atelier-erebus.html", html);
console.log("dist/atelier-erebus.html");
