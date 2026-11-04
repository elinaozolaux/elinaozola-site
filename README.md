# elinaozola — profesionālā mājaslapa (MVP)

Statiska, divvalodu (LV noklusējums, EN) vienas lapas vietne bez JavaScript, bez datubāzes un bez trešo pušu skriptiem.
Saturs glabājas trijos JSON failos, izkārtojums — vienā CSS failā un vienā būvēšanas skriptā.

```
content/site.json   ← domēns, e-pasts, LinkedIn, darba devējs, portrets, atjaunošanas datums
content/lv.json     ← visi latviešu teksti un SEO lauki
content/en.json     ← visi angļu teksti un SEO lauki
src/styles.css      ← dizains (krāsas, tipogrāfija, izkārtojums)
src/fonts/          ← pašu hostēti fonti (Bricolage Grotesque virsrakstiem, DM Sans tekstam; OFL licence)
static/             ← og-lv.png, og-en.png (koplietošanas attēli), pēc izvēles portrets
build.js            ← ģenerē mapi dist/
dist/               ← GATAVĀ VIETNE, ko augšupielādē hostingā (ģenerēta, nerediģē ar roku)
tools/og.js         ← koplietošanas attēlu ģenerators (vajadzīgs Playwright; neobligāts)
tools/texts.js      ← visi vienas valodas teksti Markdown failā: node tools/texts.js lv > teksti-lv.md
tools/standalone.js ← viena faila HTML (fonti/attēli iekļauti), atverams bez servera: node tools/standalone.js
NOTES.md            ← faktu reģistrs, nesakritības, apstiprināmie lauki, 30/60/90 plāns
```

## Kā mainīt saturu (godīgi: tas ir JSON fails, nevis CMS)

Satura maiņai **nav** jāpieskaras komponentu kodam, bet ir vajadzīgi trīs soļi: rediģēt JSON → palaist `node build.js` → augšupielādēt `dist/`.
Ja hostings ir GitHub Pages / Netlify / Cloudflare Pages ar automātisku būvēšanu, trešais solis notiek pats pēc `git push`.

Vienreiz jāinstalē [Node.js](https://nodejs.org) (LTS versija). Citu atkarību nav.

### Piemērs: pievienot jaunu publikāciju (~5 minūtes)

1. Atver `content/lv.json`, atrodi `"publications"` → `"items"` un pievieno jaunu ierakstu (ievēro komatus starp ierakstiem):

```json
{
  "title": "Raksta vai pasākuma nosaukums",
  "role": "Autore / Pasniedzēja / Runātāja",
  "source": "Kur publicēts",
  "date": "2027",
  "url": "https://pārbaudīta-saite",
  "text": "Viens vai divi teikumi, par ko tas ir."
}
```

2. To pašu angliski ieraksti `content/en.json`.
3. `content/site.json` nomaini `"updated"` uz šodienas datumu (tas parādās kājenē, sitemap un strukturētajos datos).
4. Terminālī mapē ar `build.js`: `node build.js`
5. Augšupielādē `dist/` saturu hostingā (vai `git commit` + `git push`, ja būvē automātiski).

Pārbaude pirms publicēšanas: JSON sintaksi var pārbaudīt ar `node -e "JSON.parse(require('fs').readFileSync('content/lv.json'))"` — ja nekas nedrukājas, viss kārtībā.

### Citas tipiskās izmaiņas

| Ko mainīt | Kur |
|---|---|
| Bio, pozicionējums, ievada teikums | `content/lv.json` / `en.json` → `hero`, `about` |
| Pašreizējā darbavieta | `site.json` → `person.employer` (schema), `lv/en.json` → `hero.facts[0]`, `about.timeline[0]`, `about.bio` |
| Jauns darbs sadaļā «Izvēlētā pieredze» | `lv/en.json` → `work.items` (ieteicams 4–6 ieraksti, 40–70 vārdi) |
| Publiskais e-pasts | `site.json` → `person.email` |
| Portrets | ieliec attēlu `static/` un ieraksti faila nosaukumu `site.json` → `person.portrait` |
| Title / meta description | `lv/en.json` → `seo` |
| Domēns | `site.json` → `baseUrl` (ietekmē canonical, hreflang, sitemap, OG, schema) |
| Krāsas, fonti | `src/styles.css` → `:root` mainīgie augšā |

## Lokāls priekšskatījums

`npx serve dist` (vai jebkurš statisks serveris) un atver `http://localhost:3000/lv/`.
Faili jāatver caur serveri, nevis dubultklikšķi — citādi `/lv/` un `/fonts/` ceļi nestrādā.

## Hostinga pamatprasības

- Statisks hostings ar HTTPS (GitHub Pages, Cloudflare Pages, Netlify, Vercel vai parasts tīmekļa serveris).
- Saknes `/` → `/lv/`: mapē `dist/` ir `_redirects` (Netlify, Cloudflare Pages). Citur jāiestata 301 serverī vai jāpaļaujas uz `dist/index.html`, kas satur latviešu lapu ar canonical uz `/lv/`.
- `404.html` tiek servēts kā 404 lapa (GitHub Pages, Netlify, Cloudflare to dara automātiski).
- Mapē `.github/workflows/pages.yml` ir gatava GitHub Pages konfigurācija: pēc `git push` uz `main` vietne uzbūvējas un publicējas pati.

Pārējais (publicēšanas kontrolsaraksts, apstiprināmie lauki, plāns) — `NOTES.md`.
