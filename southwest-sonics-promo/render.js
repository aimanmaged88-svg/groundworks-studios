const { chromium } = require('playwright');
const fs=require('fs');
const DIR=__dirname;
const FR=DIR+'/frames';
const FPS=30, DUR=15.0, N=Math.round(FPS*DUR);
// days until the next 3 October, computed at render time
function daysToGo(){
  const now=new Date(); const y=now.getFullYear();
  let t=new Date(y,9,3); // month 9 = October
  const a=new Date(now.getFullYear(),now.getMonth(),now.getDate());
  if(t<a) t=new Date(y+1,9,3);
  return Math.round((t-a)/86400000);
}
(async()=>{
  fs.rmSync(FR,{recursive:true,force:true}); fs.mkdirSync(FR,{recursive:true});
  const D=daysToGo(); console.log('days to go:',D);
  const b=await chromium.launch({args:['--ignore-certificate-errors','--force-device-scale-factor=1','--hide-scrollbars']});
  const p=await b.newPage({viewport:{width:1080,height:1920},deviceScaleFactor:1,ignoreHTTPSErrors:true});
  const errs=[]; p.on('pageerror',e=>errs.push(e.message));
  await p.goto('file://'+DIR+'/promo.html',{waitUntil:'networkidle'});
  await p.evaluate(async()=>{
    await Promise.all([document.fonts.load('900 200px Archivo'),document.fonts.load('800 60px Archivo'),
      document.fonts.load('800 40px "Hanken Grotesk"'),document.fonts.load('700 40px "Hanken Grotesk"')]);
    await document.fonts.ready;
  });
  await p.evaluate(d=>{ window.DAYS=d; }, D);
  // the script captured DAYS as a const; re-point the paint fn at the live value
  await p.evaluate(()=>{ const f=window.__paint; window.__paint=t=>{ f(t); }; });
  await p.waitForTimeout(1200);
  const t0=Date.now();
  for(let i=0;i<N;i++){
    await p.evaluate(v=>window.__paint(v), i/30);
    await p.screenshot({path:`${FR}/f_${String(i).padStart(4,'0')}.png`});
    if(i%90===0) console.log(`  ${i}/${N}  ${((Date.now()-t0)/1000).toFixed(0)}s`);
  }
  console.log('frames done in',((Date.now()-t0)/1000).toFixed(0),'s; errors:',errs.length?errs.join('/'):'none');
  await b.close();
})();
