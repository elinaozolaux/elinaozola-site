const { chromium } = require('playwright'); const fs=require('fs'); const path=require('path');
const S='/tmp/claude-0/-home-claude/bbc02b6d-fded-5399-ad29-cac5ad68a284/scratchpad/site';
const site=JSON.parse(fs.readFileSync(S+'/content/site.json'));
const f=(n)=>'data:font/woff2;base64,'+fs.readFileSync(S+'/src/fonts/'+n).toString('base64');
(async()=>{
  const b=await chromium.launch();
  for (const lang of site.languages){
    const c=JSON.parse(fs.readFileSync(`${S}/content/${lang}.json`));
    const html=`<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><style>
    @font-face{font-family:SG;src:url(${f('dm-sans-latin-opsz-normal.woff2')}) format('woff2-variations');font-weight:100 1000}
    @font-face{font-family:SG;src:url(${f('dm-sans-latin-ext-opsz-normal.woff2')}) format('woff2-variations');font-weight:100 1000;unicode-range:U+0100-02BA}
    @font-face{font-family:NR;src:url(${f('bricolage-grotesque-latin-opsz-normal.woff2')}) format('woff2-variations');font-weight:200 800}
    @font-face{font-family:NR;src:url(${f('bricolage-grotesque-latin-ext-opsz-normal.woff2')}) format('woff2-variations');font-weight:200 800;unicode-range:U+0100-02BA}
    html,body{margin:0}body{width:1200px;height:630px;background:#f2f1ed;color:#1b1d1f;font-family:SG,sans-serif;position:relative}
    .in{position:absolute;inset:72px 80px}
    .eb{font-size:22px;letter-spacing:.08em;text-transform:uppercase;color:#585c60;font-weight:500}
    h1{font-family:NR;font-size:132px;line-height:1;letter-spacing:-.035em;font-weight:500;margin:34px 0 0;padding-top:22px;position:relative}
    h1::before{content:"";position:absolute;top:0;left:0;width:260px;height:6px;background:#2f5f4b}
    p{font-family:NR,sans-serif;font-weight:500;font-size:44px;line-height:1.2;margin:28px 0 0;max-width:980px;color:#1b1d1f}
    .ft{position:absolute;left:80px;right:80px;bottom:60px;display:flex;justify-content:space-between;font-size:22px;color:#585c60;border-top:1px solid #1b1d1f;padding-top:18px}
    </style></head><body><div class="in"><div class="eb">${c.hero.eyebrow}</div><h1>${c.hero.name}</h1><p>${c.hero.thesis}</p></div>
    <div class="ft"><span>${c.hero.facts[0].value}</span><span>linkedin.com/in/elinaozolaux</span></div></body></html>`;
    const pg=await b.newPage({viewport:{width:1200,height:630}});
    await pg.setContent(html,{waitUntil:'load'}); await pg.evaluate(()=>document.fonts.ready);
    await pg.screenshot({path:`${S}/static/og-${lang}.png`});
    await pg.close();
  }
  await b.close();
})();
