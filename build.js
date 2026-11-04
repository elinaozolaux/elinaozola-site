#!/usr/bin/env node
/*
  Būvēšanas skripts bez ārējām atkarībām.
  Palaid:  node build.js          -> ģenerē mapi dist/ (gatava publicēšanai)
           node build.js --artifact lv [--other-url URL]  -> viena faila priekšskatījums (iekšējai lietošanai)

  Saturs:  content/site.json, content/lv.json, content/en.json
  Izkārtojums un stils: šis fails + src/styles.css
*/
const fs = require("fs");
const path = require("path");

const ROOT = __dirname;
const DIST = path.join(ROOT, "dist");
const site = JSON.parse(fs.readFileSync(path.join(ROOT, "content/site.json"), "utf8"));
const css = fs.readFileSync(path.join(ROOT, "src/styles.css"), "utf8");

const args = process.argv.slice(2);
const artifactMode = args.includes("--artifact");
const artifactLang = artifactMode ? args[args.indexOf("--artifact") + 1] : null;
const otherUrl = args.includes("--other-url") ? args[args.indexOf("--other-url") + 1] : "#";

const esc = (s = "") =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const LATIN_EXT =
  "U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF";
const LATIN =
  "U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD";

function fontFaces(base) {
  const face = (family, file, range, weights) =>
    `@font-face{font-family:"${family}";font-style:normal;font-weight:${weights};font-display:swap;src:url(${base}fonts/${file}) format("woff2-variations");unicode-range:${range}}`;
  return [
    face("DM Sans", "dm-sans-latin-ext-opsz-normal.woff2", LATIN_EXT, "100 1000"),
    face("DM Sans", "dm-sans-latin-opsz-normal.woff2", LATIN, "100 1000"),
    face("Bricolage Grotesque", "bricolage-grotesque-latin-ext-opsz-normal.woff2", LATIN_EXT, "200 800"),
    face("Bricolage Grotesque", "bricolage-grotesque-latin-opsz-normal.woff2", LATIN, "200 800"),
  ].join("\n");
}

const MARK = `<svg class="mark" viewBox="0 0 14 18" aria-hidden="true" focusable="false"><rect class="bar" x="0" y="0" width="14" height="2.5"/><circle class="dot" cx="7" cy="12" r="4"/></svg>`;
const FAVICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="6" fill="#f2f1ed"/><rect x="8" y="7" width="16" height="3" fill="#2f5f4b"/><circle cx="16" cy="20" r="5" fill="#1b1d1f"/></svg>`;

const langs = site.languages;
const urlFor = (lang) => `${site.baseUrl}/${lang}/`;
const pathFor = (lang) => `/${lang}/`;

function loadLang(lang) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, `content/${lang}.json`), "utf8"));
}

function jsonLd(c, lang, pageUrl) {
  const p = site.person;
  const person = {
    "@type": "Person",
    "@id": `${site.baseUrl}/#person`,
    name: p.name,
    alternateName: p.alternateNames,
    jobTitle: p.jobTitle,
    worksFor: { "@type": "Organization", name: p.employer.name, url: p.employer.url },
    url: urlFor(site.defaultLang),
    sameAs: [p.linkedin],
    email: `mailto:${p.email}`,
    address: { "@type": "PostalAddress", addressCountry: "LV" },
    knowsAbout: [
      "User experience design", "User research", "Service design", "Design strategy",
      "Design thinking", "Accessibility (WCAG)", "Design systems", "Workshop facilitation", "Design leadership"
    ],
    description: c.seo.description,
  };
  if (p.portrait) person.image = `${site.baseUrl}/${p.portrait}`;
  const page = {
    "@type": "ProfilePage",
    "@id": `${pageUrl}#page`,
    url: pageUrl,
    name: c.seo.title,
    inLanguage: lang,
    dateModified: site.updated,
    mainEntity: { "@id": `${site.baseUrl}/#person` },
  };
  return JSON.stringify({ "@context": "https://schema.org", "@graph": [person, page] });
}

function head(c, lang, { canonical, pageUrl, assetBase, artifact }) {
  const alternates = langs
    .map((l) => `<link rel="alternate" hreflang="${l}" href="${urlFor(l)}">`)
    .join("\n  ");
  const metaCommon = `
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">`;
  if (artifact) {
    return `<title>${esc(c.hero.name + " · " + c.langName)}</title>
  <meta name="claude:viewport-fit-sides" content="cover">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,200..800&family=DM+Sans:opsz,wght@9..40,100..1000&display=swap">
  <style>${css}</style>`;
  }
  return `<!DOCTYPE html>
<html lang="${lang}">
<head>${metaCommon}
  <title>${esc(c.seo.title)}</title>
  <meta name="description" content="${esc(c.seo.description)}">
${Object.entries(site.verification || {}).map(([k, v]) => `  <meta name="${esc(k)}" content="${esc(v)}">`).join("\n")}
  <link rel="canonical" href="${canonical}">
  ${alternates}
  <link rel="alternate" hreflang="x-default" href="${urlFor(site.defaultLang)}">
  <meta property="og:type" content="profile">
  <meta property="og:title" content="${esc(c.seo.title)}">
  <meta property="og:description" content="${esc(c.seo.description)}">
  <meta property="og:url" content="${pageUrl}">
  <meta property="og:image" content="${site.baseUrl}/og-${lang}.jpg">
  <meta property="og:image:secure_url" content="${site.baseUrl}/og-${lang}.jpg">
  <meta property="og:image:type" content="image/jpeg">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="${esc(site.person.name)}, ${esc(c.seo.ogTagline)}">
  <meta property="og:locale" content="${lang === "lv" ? "lv_LV" : "en_GB"}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="theme-color" content="#f2f1ed" media="(prefers-color-scheme: light)">
  <meta name="theme-color" content="#141516" media="(prefers-color-scheme: dark)">
  <link rel="icon" href="${assetBase}favicon.svg" type="image/svg+xml">
  <link rel="preload" href="${assetBase}fonts/dm-sans-latin-opsz-normal.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="preload" href="${assetBase}fonts/dm-sans-latin-ext-opsz-normal.woff2" as="font" type="font/woff2" crossorigin>
  <style>
${fontFaces(assetBase)}
${css}
  </style>
  <script type="application/ld+json">${jsonLd(c, lang, pageUrl)}</script>
</head>
<body>`;
}

function body(c, lang, opts) {
  const { otherHref } = opts;
  const other = langs.find((l) => l !== lang);
  const p = site.person;
  const navItems = c.nav.map((n) => `<li><a href="#${n.id}">${esc(n.label)}</a></li>`).join("");

  const facts = c.hero.facts
    .map(
      (f, i) =>
        `<div><dt>${esc(f.label)}</dt><dd${i === 0 ? ' class="now"' : ""}>${esc(f.value)}</dd></div>`
    )
    .join("\n          ");

  const logoFor = (name) => {
    const file = (site.logos || {})[name];
    if (!file) return `<span class="org-name">${esc(name)}</span>`;
    const abs = path.join(ROOT, "static", file);
    if (!fs.existsSync(abs)) return `<span class="org-name">${esc(name)}</span>`;
    if (file.endsWith(".svg")) {
      return `<span class="logo">${fs.readFileSync(abs, "utf8").trim()}</span><span class="sr-only">${esc(name)}</span>`;
    }
    const uri = "data:image/png;base64," + fs.readFileSync(abs).toString("base64");
    return `<span class="logo logo-mask" style="--m:url(${uri})" role="img" aria-label="${esc(name)}"></span><span class="sr-only">${esc(name)}</span>`;
  };
  const trust = c.trust.groups
    .map(
      (g) => `<div>
          <dt>${esc(g.label)}${g.note ? ` <small>(${esc(g.note)})</small>` : ""}</dt>
          <dd><ul class="logos">${g.items.map((i) => `<li>${logoFor(i)}</li>`).join("")}</ul></dd>
        </div>`
    )
    .join("\n        ");

  const rl = c.competences.rowLabels;
  const comps = c.competences.items
    .map(
      (k) => `<li>
            <h4>${esc(k.title)}</h4>
            <dl>
              <div><dt>${esc(rl.situation)}</dt><dd>${esc(k.situation)}</dd></div>
              <div><dt>${esc(rl.action)}</dt><dd>${esc(k.action)}</dd></div>
              <div><dt>${esc(rl.outcome)}</dt><dd class="out">${esc(k.outcome)}</dd></div>
            </dl>
          </li>`
    )
    .join("\n          ");

  const work = c.work.items
    .map(
      (w) => `<li>
            ${w.image ? `<img class="work-img" src="${opts.artifact ? "data:image/jpeg;base64," + fs.readFileSync(path.join(ROOT, "static", w.image)).toString("base64") : opts.assetBase + w.image}" alt="${esc(w.imageAlt || "")}" width="1000" height="625" loading="lazy">` : ""}
            <div class="meta"><span class="org">${esc(w.org)}</span><span class="years">${esc(w.years)}</span></div>
            <h3>${esc(w.title)}</h3>
            <p>${esc(w.text)}</p>
            <div class="role-line">${esc(w.role)}</div>
          </li>`
    )
    .join("\n          ");

  const bio = c.about.bio.map((t) => `<p>${esc(t)}</p>`).join("\n          ");
  const timeline = c.about.timeline
    .map(
      (t) =>
        `<li${t.current ? ' class="current"' : ""}><span class="years">${esc(t.years)}</span><span class="org">${esc(t.org)}</span><span class="role">${esc(t.role)}</span></li>`
    )
    .join("\n          ");

  const pubs = c.publications.items
    .map(
      (u) => {
        const src = u.image
          ? (opts.artifact
              ? "data:image/jpeg;base64," + fs.readFileSync(path.join(ROOT, "static", u.image)).toString("base64")
              : opts.assetBase + u.image)
          : "";
        const thumb = u.image
          ? `<a class="thumb" href="${esc(u.url)}" rel="noopener" tabindex="-1" aria-hidden="true"><img src="${src}" alt="" width="800" height="500" loading="lazy"></a>`
          : "";
        return `<li${u.image ? ' class="has-thumb"' : ""}>
            ${thumb}
            <div>
              <h3><a href="${esc(u.url)}" rel="noopener">${esc(u.title)}</a></h3>
              <div class="meta"><span>${esc(u.role)}</span><span>${esc(u.source)}</span>${u.date ? `<span class="years">${esc(u.date)}</span>` : ""}</div>
              <p>${esc(u.text)}</p>
            </div>
          </li>`;
      }
    )
    .join("\n          ");

  const portraitSrc = p.portrait
    ? (opts.artifact
        ? "data:image/jpeg;base64," + fs.readFileSync(path.join(ROOT, "static", p.portrait)).toString("base64")
        : opts.assetBase + p.portrait)
    : "";
  const aboutSrc = p.portraitAbout
    ? (opts.artifact
        ? "data:image/jpeg;base64," + fs.readFileSync(path.join(ROOT, "static", p.portraitAbout)).toString("base64")
        : opts.assetBase + p.portraitAbout)
    : "";
  const aboutImg = p.portraitAbout
    ? `<img class="portrait-round" src="${aboutSrc}" alt="" width="1000" height="1000" loading="lazy">`
    : "";
  const portrait = p.portrait
    ? `<img class="portrait" src="${portraitSrc}" alt="${esc(p.name)}" width="1200" height="1200" fetchpriority="high">`
    : "";

  return `
  <a class="skip" href="#main">${esc(c.ui.skipLink)}</a>
  <header class="site-head">
    <div class="wrap">
      <a class="brand" href="#top" aria-label="${esc(p.name)}">${MARK}<span>${esc(p.name)}</span></a>
      <nav class="site-nav" aria-label="${esc(c.ui.navLabel)}"><ul>${navItems}</ul></nav>
      <nav class="lang" aria-label="${esc(c.ui.langSwitchLabel)}">
        <span aria-current="page" lang="${lang}">${lang.toUpperCase()}</span><span class="sep" aria-hidden="true">/</span><a href="${otherHref}" lang="${other}" hreflang="${other}">${other.toUpperCase()}</a>
      </nav>
    </div>
  </header>

  <main id="main">
    <section class="hero" id="top" aria-labelledby="h1">
      <div class="wrap">
        <div class="hero-main">
          <p class="eyebrow">${esc(c.hero.eyebrow)}</p>
          <h1 id="h1">${esc(c.hero.name)}</h1>
          <p class="thesis">${esc(c.hero.thesis)}</p>
          ${[].concat(c.hero.intro).map((t) => `<p class="intro">${esc(t)}</p>`).join("\n          ")}
          <div class="cta">
            <a class="btn btn-primary" href="${esc(c.hero.ctaPrimary.href)}">${esc(c.hero.ctaPrimary.label)}</a>
            <a class="btn btn-ghost" href="${esc(c.hero.ctaSecondary.href)}">${esc(c.hero.ctaSecondary.label)}</a>
          </div>
        </div>
        <div class="hero-side">
          ${portrait}
          <dl class="facts">
          ${facts}
          </dl>
        </div>
      </div>
    </section>

    <section class="sec" id="${c.approach.id}" aria-labelledby="h-approach">
      <div class="wrap">
        <div class="rail"><h2 id="h-approach">${esc(c.approach.heading)}</h2></div>
        <div class="body">
          <div class="approach">
          ${c.approach.paragraphs.map((t) => `<p>${esc(t)}</p>`).join("\n          ")}
          </div>
          <h3 class="sub-h" id="${c.competences.id}">${esc(c.competences.heading)}</h3>
          <ul class="comp">
          ${comps}
          </ul>
        </div>
      </div>
    </section>

    <section class="sec" id="${c.work.id}" aria-labelledby="h-work">
      <div class="wrap">
        <div class="rail"><h2 id="h-work">${esc(c.work.heading)}</h2><p class="lead">${esc(c.work.lead)}</p></div>
        <ol class="body work">
          ${work}
        </ol>
      </div>
    </section>

    <section class="sec" id="${c.about.id}" aria-labelledby="h-about">
      <div class="wrap">
        <div class="rail"><h2 id="h-about">${esc(c.about.heading)}</h2>${aboutImg}</div>
        <div class="body">
          <div class="bio">
          ${bio}
          </div>
          <h3 class="timeline-h">${esc(c.about.timelineHeading)}</h3>
          <ol class="timeline">
          ${timeline}
          </ol>
          <h3 class="timeline-h">${esc(c.trust.heading)}</h3>
          <dl class="trust">
        ${trust}
          </dl>
        </div>
      </div>
    </section>

    <section class="sec" id="${c.publications.id}" aria-labelledby="h-pubs">
      <div class="wrap">
        <div class="rail"><h2 id="h-pubs">${esc(c.publications.heading)}</h2><p class="lead">${esc(c.publications.lead)}</p></div>
        <ul class="body pubs">
          ${pubs}
        </ul>
      </div>
    </section>

    <section class="sec contact" id="${c.contact.id}" aria-labelledby="h-contact">
      <div class="wrap">
        <div class="rail"><h2 id="h-contact">${esc(c.contact.heading)}</h2></div>
        <div class="body">
          <p class="lead-big">${esc(c.contact.lead)}</p>
          <dl>
            <div><dt>${esc(c.contact.emailLabel)}</dt><dd><a class="mail" href="mailto:${esc(p.email)}">${esc(p.email)}</a></dd></div>
            <div><dt>${esc(c.contact.linkedinLabel)}</dt><dd><a class="li" href="${esc(p.linkedin)}" rel="me noopener">${esc(c.contact.linkedinText)}</a></dd></div>
          </dl>
          <p class="note">${esc(c.contact.responseNote)}</p>
        </div>
      </div>
    </section>
  </main>

  <footer class="site-foot">
    <div class="wrap">
      <div>
        <p class="names">${MARK}${esc(p.name)} ${esc(c.ui.footerNote)}</p>
      </div>
      <nav aria-label="${esc(c.ui.footerNavLabel)}">
        <a href="${otherHref}" lang="${other}" hreflang="${other}">${esc(c.otherLangLabel)}</a>
        <a href="${esc(p.linkedin)}" rel="me noopener">LinkedIn</a>
        <a href="#top">${esc(c.ui.topLabel)} ↑</a>
      </nav>
    </div>
  </footer>`;
}

function page(lang, opts) {
  const c = loadLang(lang);
  return head(c, lang, opts) + body(c, lang, opts) + (opts.artifact ? "\n" : "\n</body>\n</html>\n");
}

function notFound() {
  const c = loadLang(site.defaultLang);
  return `<!DOCTYPE html>
<html lang="${site.defaultLang}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <title>404 · ${esc(site.person.name)}</title>
  <meta name="robots" content="noindex">
  <link rel="icon" href="/favicon.svg" type="image/svg+xml">
  <style>
${fontFaces("/")}
${css}
  </style>
</head>
<body>
  <main class="wrap nf" id="main">
    <p class="eyebrow">404</p>
    <h1>Šādas lapas nav. / This page does not exist.</h1>
    <p><a href="/lv/">Uz sākumu (latviski)</a> · <a href="/en/">Home (English)</a></p>
  </main>
</body>
</html>
`;
}

function sitemap() {
  const urls = langs
    .map((l) => {
      const alts = langs
        .map((a) => `    <xhtml:link rel="alternate" hreflang="${a}" href="${urlFor(a)}"/>`)
        .join("\n");
      return `  <url>
    <loc>${urlFor(l)}</loc>
    <lastmod>${site.updated}</lastmod>
${alts}
    <xhtml:link rel="alternate" hreflang="x-default" href="${urlFor(site.defaultLang)}"/>
  </url>`;
    })
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls}
</urlset>
`;
}

function copyDir(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  for (const f of fs.readdirSync(src)) {
    const s = path.join(src, f), d = path.join(dest, f);
    if (fs.statSync(s).isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
}

if (artifactMode) {
  const html = page(artifactLang, { artifact: true, otherHref: otherUrl, assetBase: "/" });
  const out = path.join(ROOT, `preview-${artifactLang}.html`);
  fs.writeFileSync(out, html);
  console.log("Artifact preview:", out);
} else {
  fs.rmSync(DIST, { recursive: true, force: true });
  fs.mkdirSync(DIST, { recursive: true });
  for (const l of langs) {
    const dir = path.join(DIST, l);
    fs.mkdirSync(dir, { recursive: true });
    const other = langs.find((x) => x !== l);
    fs.writeFileSync(
      path.join(dir, "index.html"),
      page(l, { canonical: urlFor(l), pageUrl: urlFor(l), assetBase: "/", otherHref: pathFor(other) })
    );
  }
  // Saknes lapa: noklusējuma valodas saturs ar canonical uz /lv/ (ja hostings neatbalsta 301 pāradresāciju).
  const dl = site.defaultLang, dOther = langs.find((x) => x !== dl);
  fs.writeFileSync(
    path.join(DIST, "index.html"),
    page(dl, { canonical: urlFor(dl), pageUrl: urlFor(dl), assetBase: "/", otherHref: pathFor(dOther) })
  );
  fs.writeFileSync(path.join(DIST, "404.html"), notFound());
  fs.writeFileSync(path.join(DIST, "sitemap.xml"), sitemap());
  fs.writeFileSync(
    path.join(DIST, "robots.txt"),
    `User-agent: *\nAllow: /\n\nSitemap: ${site.baseUrl}/sitemap.xml\n`
  );
  fs.writeFileSync(path.join(DIST, "favicon.svg"), FAVICON_SVG);
  // Netlify / Cloudflare Pages: saknes 301 uz /lv/ (citos hostingos ignorē šo failu).
  fs.writeFileSync(path.join(DIST, "_redirects"), `/  /lv/  301\n`);
  copyDir(path.join(ROOT, "src/fonts"), path.join(DIST, "fonts"));
  copyDir(path.join(ROOT, "static"), DIST);
  console.log("Uzbūvēts: dist/  (" + langs.map((l) => `/${l}/`).join(", ") + ", sitemap.xml, robots.txt, 404.html)");
}
