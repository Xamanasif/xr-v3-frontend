const { open, chromium, B } = require('./lib'); const fs=require('fs');
const dir=B+'/shots/final'; fs.mkdirSync(dir,{recursive:true});
const W=ms=>new Promise(r=>setTimeout(r,ms));
const STATES=[
 ['sa03-validation','?clean=1&scenario=new','#/requests/godavari-new-access',async p=>{await p.click('#dc-c0');await p.click('#dc-go');await W(150);}],
 ['sa03-confirm-external','?clean=1&scenario=new','#/requests/godavari-new-access',async p=>{await p.click('#dc-c0');await W(50);await p.click('#dc-r1');await W(50);await p.click('#dc-go');await W(200);}],
 ['sa03-decided-payment','?clean=1&scenario=new','#/requests/godavari-new-access',async p=>{await p.click('#dc-c0');await W(50);await p.click('#dc-r1');await W(50);await p.click('#dc-go');await W(100);await p.click('#dlg-ok');await W(200);}],
 ['sa03-paused-blocked','?clean=1&scenario=konark','#/requests/konark-licences',async p=>{}],
 ['sa01-quiet','?clean=1&scenario=quiet','#/overview',async p=>{}],
 ['sa01-loading','?clean=1&list=loading','#/overview',async p=>{}],
 ['sa02-failed','?clean=1&list=failed','#/requests',async p=>{}],
 ['sa02-nomatch','?clean=1','#/requests',async p=>{await p.fill('#rq-q','Narmada');await W(100);}],
 ['sa06-empty','?clean=1&list=empty','#/institutions',async p=>{}],
 ['sa07-noadmin','?clean=1','#/institutions/sahyadri',async p=>{}],
 ['sa07-assign-validation','?clean=1','#/institutions/sahyadri',async p=>{await p.click('#in-assign');await W(80);await p.click('#dlg-ok');await W(150);}],
 ['sa07-paused','?clean=1','#/institutions/deccan',async p=>{}],
 ['sa07-ended','?clean=1','#/institutions/malnad',async p=>{}],
 ['sa07-awaiting-payment','?clean=1','#/institutions/vizag',async p=>{}],
 ['sa11-on-hold','?clean=1','#/content/updates/boiler-2-1',async p=>{}],
 ['sa11-released','?clean=1','#/content/updates/orifice-1-1',async p=>{}],
 ['sa11-not-approved','?clean=1','#/content/updates/induction-motor-1-1',async p=>{}],
 ['sa13-published','?clean=1','#/content/records/distillation-column',async p=>{}],
 ['sa15-move-blocked','?clean=1','#/structure/courses/me-zg523',async p=>{}],
 ['sa17-withdraw-inline','?clean=1','#/roles/holder/a-menon',async p=>{await p.click('#wd-btn-0');await W(80);await p.click('[data-act="wdSave"]');await W(120);}],
 ['sa19-stale-refusal','?clean=1&stale=1','#/operations/device-transfers/rahul-verma-vr',async p=>{await p.click('#tr-go');await W(80);await p.click('#dlg-ok');await W(200);}],
 ['sa19-still-with-institution','?clean=1','#/operations/device-transfers/imran-shaikh-vr',async p=>{}],
 ['sa21-resolve-note-required','?clean=1','#/operations/support/usage-slow',async p=>{await p.click('#sp-go');await W(120);}],
 ['sa21-resolved','?clean=1','#/operations/support/lab-brief-blank',async p=>{}],
 ['shell-drawer','?clean=1','#/overview',async p=>{ if(await p.isVisible('#sa-menu')){await p.click('#sa-menu');await W(250);} }],
 ['shell-account-menu','?clean=1','#/overview',async p=>{await p.click('#sa-acct');await W(150);}],
 ['xs-signed-out','?clean=1','#/signed-out',async p=>{}],
 ['xs-not-available','?clean=1','#/requests/unknown',async p=>{}],
 ['preview-controls','?pv=1','#/overview',async p=>{await p.click('#sa-pv-open');await W(150);}],
];
(async()=>{ const browser=await chromium.launch(); const widths=(process.argv[2]||'1440,375').split(',').map(Number);
 for(const w of widths) for(const [n,q,h,fn] of STATES){ const s=await open(w,q,h,{browser}); await fn(s.page); await W(100);
   const full=!/drawer|account|confirm|preview/.test(n); await s.page.screenshot({path:dir+'/state_'+w+'_'+n+'.png',fullPage:full}); if(s.errors.length) console.log(n,s.errors); await s.ctx.close(); }
 console.log('done'); await browser.close(); })();
