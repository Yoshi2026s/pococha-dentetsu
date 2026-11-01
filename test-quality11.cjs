// 品質の改善（2026-11-01 第3回）のテスト（Playwright・Chromium）
// 1) ボタンの音は直前0.22秒以内に別の効果音が鳴っていたら鳴らさない  2) 大きめの効果音が0.14秒以内に続くと後の音を0.18秒ずらす
// 3) システム説明のタブ・分かれ道の「1つ戻す」「おまかせ」は高さ48px以上  4) 分かれ道を選ぶ間は行動ログを隠す
const {chromium}=require('playwright');const path=require('path');
const fail=[];const ok=(c,m)=>{if(!c)fail.push(m)};
(async()=>{const b=await chromium.launch();try{const c=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
  await p.route(/firebase|gstatic|googleapis/,r=>r.abort());await p.addInitScript(()=>{try{localStorage.setItem('poco-set',JSON.stringify({bgm:40,se:70}))}catch{}});
  await p.goto('file://'+path.resolve('index.html'));await p.waitForFunction(()=>!document.querySelector('#bCreate').disabled);
  const r=await p.evaluate(()=>{const log=[];AU.ac={currentTime:10};AU.duck=null;const keep={};for(const k of ['ui','dice','yell','rarSR','step','rankup','firework'])keep[k]=SE[k],SE[k]=(t)=>log.push([k,+(t-10).toFixed(2)]);
    const now=performance.now.bind(performance);let fake=1e6;performance.now=()=>fake;AU.seT=-1e9;AU.seK=null;
    sfx('dice');fake+=50;sfx('ui');fake+=1000;sfx('ui');fake+=1000;sfx('yell');fake+=8;sfx('rarSR');fake+=1000;sfx('step');fake+=10;sfx('step');fake+=1000;sfx('rankup');fake+=40;sfx('firework');
    performance.now=now;for(const k in keep)SE[k]=keep[k];AU.ac=null;return log});
  const m=Object.fromEntries(r.map((x,i)=>[i+':'+x[0],x[1]]));
  ok(r.filter(x=>x[0]==='ui').length===1,'サイコロ直後のボタンの音は鳴らさない（離れていれば鳴る） '+JSON.stringify(r));
  const y=r.find(x=>x[0]==='rarSR'),f=r.find(x=>x[0]==='firework'),st=r.filter(x=>x[0]==='step');
  ok(y&&Math.abs(y[1]-.2)<.001&&f&&Math.abs(f[1]-.2)<.001,'続いた大きめの効果音は0.18秒ずらす '+JSON.stringify(r));
  ok(st.length===2&&st.every(x=>Math.abs(x[1]-.02)<.001),'足音はずらさない '+JSON.stringify(st));
  await p.click('button:has-text("システム説明")');await p.waitForTimeout(400);
  const tabs=await p.evaluate(()=>[...document.querySelectorAll('.sys-tabs button')].map(e=>e.getBoundingClientRect().height));ok(tabs.length&&tabs.every(h=>h>=48),'システム説明のタブの高さ '+tabs.join(','));
  await p.evaluate(()=>{document.querySelector('#ov').hidden=true});
  await p.click('#bCreate');await p.waitForTimeout(300);await p.click('#bStart');await p.waitForTimeout(1500);
  const t0=Date.now();let got=false;while(Date.now()-t0<90000){await p.waitForTimeout(200);const st=await p.evaluate(()=>pending&&pending.stage);if(st==='route'){got=true;break}if(st==='act')await p.click('#bRoll').catch(()=>{});else if(st==='buy')await p.click('#bSkip').catch(()=>{});else if(st==='shop')await p.click('#bShopOk').catch(()=>{});else if(st==='reward')await p.click('#bRwCoin').catch(()=>{});const ac=await p.$('#acOk');if(ac&&await ac.isVisible().catch(()=>false))await ac.click().catch(()=>{})}
  if(got){await p.waitForTimeout(500);const q=await p.evaluate(()=>({btn:['#bUndo','#bAuto'].map(s=>document.querySelector(s).getBoundingClientRect().height),log:getComputedStyle(document.querySelector('#logPanel')).display}));
    ok(q.btn.every(h=>h>=48),'分かれ道のボタンの高さ '+q.btn);ok(q.log==='none','分かれ道を選ぶ間は行動ログを隠す '+q.log)}else fail.push('分かれ道に来なかった（90秒）');
  if(errs.length)fail.push('JSエラー '+errs.join(' / '));await c.close()}finally{await b.close()}
  if(fail.length){console.error('FAIL 品質の改善11\n'+fail.join('\n'));process.exitCode=1}else console.log('PASS 品質の改善11（効果音の重なり・押しやすさ48px・分かれ道で行動ログを隠す）')})();
