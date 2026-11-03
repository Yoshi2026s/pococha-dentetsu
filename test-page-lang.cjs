// ページの言語・ボタンの連続タップのテスト（2026-11-03・Playwright・Chromium・iPhone幅375px）
// 1) <html lang="ja">（日本語の字形・読み上げ・翻訳の案内のため）・地図の読み上げ名は「全国のすごろく地図」  2) ボタン類は touch-action:manipulation（続けて押しても拡大しない）、地図はそのまま（指で拡大・移動できる）
const {chromium}=require('playwright');const path=require('path');
const fail=[];const ok=(c,m)=>{if(!c)fail.push(m)};
(async()=>{const b=await chromium.launch();try{const c=await b.newContext({viewport:{width:375,height:667},isMobile:true,hasTouch:true});const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
  await p.route(/firebase|gstatic|googleapis/,r=>r.abort());await p.addInitScript(()=>{try{localStorage.setItem('poco-set',JSON.stringify({bgm:0,se:0,fast:true}))}catch{}});
  await p.goto('file://'+path.resolve(__dirname,'index.html'));await p.waitForFunction(()=>!document.querySelector('#bCreate').disabled);
  ok(await p.evaluate(()=>document.documentElement.lang)==='ja','html の lang が ja でない');
  {const l=await p.evaluate(()=>document.querySelector('#map').getAttribute('aria-label'));ok(l==='全国のすごろく地図','地図の読み上げ名が古い（西日本のまま） '+l)}
  await p.click('#bCreate');await p.waitForTimeout(300);await p.click('#bStart');await p.waitForTimeout(1800);
  const t=await p.evaluate(()=>{const ta=s=>{const e=document.querySelector(s);return e?getComputedStyle(e).touchAction:'(なし)'};return{roll:ta('#bRoll'),card:ta('#bCard'),menu:ta('#bMenu'),sel:ta('#vRoom select'),map:ta('#map'),mapbox:ta('#mapbox')}});
  ok(['roll','card','menu','sel'].every(k=>t[k]==='manipulation'),'ボタンの touch-action '+JSON.stringify(t));
  ok(t.map!=='manipulation'&&t.mapbox!=='manipulation','地図の touch-action が変わった '+JSON.stringify(t));
  if(errs.length)fail.push('JSエラー '+errs.join(' / '));await c.close()}finally{await b.close()}
  if(fail.length){console.error('FAIL ページの言語・連続タップ\n'+fail.join('\n'));process.exitCode=1}else console.log('PASS ページの言語・連続タップ（lang=ja・ボタンは続けて押しても拡大しない・地図はそのまま）')})();
