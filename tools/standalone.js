#!/usr/bin/env node
// Viena faila HTML (fonti un attēli iekļauti), ko var atvērt ar dubultklikšķi bez servera.
// Palaid pēc `node build.js`:  node tools/standalone.js   -> standalone/elinaozola-lv.html, -en.html
const fs = require("fs"), path = require("path");
const ROOT = path.join(__dirname, ".."), DIST = path.join(ROOT, "dist"), OUT = path.join(ROOT, "standalone");
const site = JSON.parse(fs.readFileSync(path.join(ROOT, "content/site.json"), "utf8"));
const mime = { ".woff2": "font/woff2", ".jpg": "image/jpeg", ".png": "image/png", ".svg": "image/svg+xml" };
const data = (rel) => { const f = path.join(DIST, rel); return `data:${mime[path.extname(f)]};base64,${fs.readFileSync(f).toString("base64")}`; };
fs.mkdirSync(OUT, { recursive: true });
for (const lang of site.languages) {
  let h = fs.readFileSync(path.join(DIST, lang, "index.html"), "utf8");
  h = h.replace(/url\(\/fonts\/([^)]+)\)/g, (_, f) => `url(${data("fonts/" + f)})`);
  h = h.replace(/src="\/((?:thumbs\/|work\/)?[^"]+\.(?:jpg|png))"/g, (_, f) => `src="${data(f)}"`);
  h = h.replace(/href="\/favicon\.svg"/, `href="${data("favicon.svg")}"`);
  h = h.replace(/^\s*<link rel="preload"[^\n]*\n/gm, "");
  for (const l of site.languages) h = h.replace(new RegExp(`href="/${l}/"`, "g"), `href="elinaozola-${l}.html"`);
  fs.writeFileSync(path.join(OUT, `elinaozola-${lang}.html`), h);
  console.log("standalone/elinaozola-" + lang + ".html", Math.round(fs.statSync(path.join(OUT, `elinaozola-${lang}.html`)).size / 1024) + " KB");
}
