// Ģenerē dalīšanās attēlus (Open Graph) static/og-lv.jpg un static/og-en.jpg.
// Palaist: node tools/og.js   (vajag Playwright ar Chromium)
const { chromium } = require('playwright'); const fs=require('fs'); const path=require('path');
const S=path.resolve(__dirname,'..');
const site=JSON.parse(fs.readFileSync(S+'/content/site.json'));
const f=(n)=>'data:font/woff2;base64,'+fs.readFileSync(S+'/src/fonts/'+n).toString('base64');
const portrait='data:image/jpeg;base64,'+fs.readFileSync(S+'/static/'+site.person.portrait).toString('base64');
(async()=>{
  const b=await chromium.launch();
  for (const lang of site.languages){
    const c=JSON.parse(fs.readFileSync(`${S}/content/${lang}.json`));
    const html=`<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><style>
    @font-face{font-family:SG;src:url(${f('dm-sans-latin-opsz-normal.woff2')}) format('woff2-variations');font-weight:100 1000}
    @font-face{font-family:SG;src:url(${f('dm-sans-latin-ext-opsz-normal.woff2')}) format('woff2-variations');font-weight:100 1000;unicode-range:U+0100-02BA}
    @font-face{font-family:NR;src:url(${f('bricolage-grotesque-latin-opsz-normal.woff2')}) format('woff2-variations');font-weight:200 800}
    @font-face{font-family:NR;src:url(${f('bricolage-grotesque-latin-ext-opsz-normal.woff2')}) format('woff2-variations');font-weight:200 800;unicode-range:U+0100-02BA}
    html,body{margin:0}body{width:1200px;height:630px;background:#f2f1ed;color:#1b1d1f;font-family:SG,sans-serif;position:relative;overflow:hidden}
    .in{position:absolute;left:80px;top:72px;width:620px}
    .eb{font-size:21px;letter-spacing:.08em;text-transform:uppercase;color:#585c60;font-weight:500;line-height:1.3}
    h1{font-family:NR;font-size:104px;line-height:1;letter-spacing:-.035em;font-weight:500;margin:30px 0 0;padding-top:22px;position:relative}
    h1::before{content:"";position:absolute;top:0;left:0;width:220px;height:6px;background:#2f5f4b}
    p{font-family:NR,sans-serif;font-weight:500;font-size:40px;line-height:1.2;margin:26px 0 0;color:#1b1d1f}
    .ft{position:absolute;left:80px;width:620px;bottom:60px;font-size:21px;color:#585c60;border-top:1px solid #1b1d1f;padding-top:18px;line-height:1.4}
    .ft span{display:block}
    .ph{position:absolute;right:0;top:0;width:440px;height:630px;background:url(${portrait}) center/cover no-repeat}
    </style></head><body>
    <div class="in"><div class="eb">${c.hero.eyebrow}</div><h1>${c.hero.name}</h1><p>${c.hero.thesis}</p></div>
    <div class="ft"><span>${c.hero.facts[0].value}</span><span>elinaozola.lv · linkedin.com/in/elinaozolaux</span></div>
    <div class="ph"></div></body></html>`;
    const pg=await b.newPage({viewport:{width:1200,height:630}});
    await pg.setContent(html,{waitUntil:'load'}); await pg.evaluate(()=>document.fonts.ready);
    await pg.screenshot({path:`${S}/static/og-${lang}.jpg`,type:'jpeg',quality:86});
    await pg.close();
  }
  await b.close();
})();
