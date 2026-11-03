// 見た目・押しやすさの改善10（2026-11-03）のテスト（Playwright・Chromium・iPhone幅320/375px）
// 1) カードの「とじる」・タイトルの「遊び方」「システム説明」は高さ48px以上  2) 小さい画面でも「買えるだけ獲得（…）」は1行
// 3) 分かれ道の「近道」の札が方面名に重ならない・「この先にも分かれ道」を単語の途中で切らない  4) 分かれ道を選ぶときは、ほかの人の結果カードを消す
const {chromium}=require('playwright');const path=require('path');
const fail=[];const ok=(c,m)=>{if(!c)fail.push(m)};
const hit=(a,b)=>a&&b&&a.left<b.right&&b.left<a.right&&a.top<b.bottom&&b.top<a.bottom;
(async()=>{const b=await chromium.launch();try{for(const W of [320,375]){const c=await b.newContext({viewport:{width:W,height:W<375?568:667},isMobile:true,hasTouch:true});const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
  await p.route(/firebase|gstatic|googleapis/,r=>r.abort());await p.addInitScript(()=>{try{localStorage.setItem('poco-set',JSON.stringify({bgm:0,se:0,fast:true}))}catch{}});
  await p.goto('file://'+path.resolve(__dirname,'index.html'));await p.waitForFunction(()=>!document.querySelector('#bCreate').disabled);
  const lob=await p.evaluate(()=>['#bHow','#bSys'].map(s=>document.querySelector(s).getBoundingClientRect().height));ok(lob.every(h=>h>=48),W+'px タイトルのボタンの高さ '+lob);
  await p.evaluate(()=>{showOverlay('<h3>確認</h3><p>テスト</p>')});await p.waitForTimeout(900);
  const cl=await p.evaluate(()=>document.querySelector('#ovClose').offsetHeight);ok(cl>=48,W+'px 「とじる」の高さ '+cl);await p.evaluate(()=>{const o=document.querySelector('#ov');o.hidden=true;o.innerHTML=''});
  const ba=await p.evaluate(()=>{const d=document.createElement('button');d.id='bBuyAll';d.textContent='🏠 買えるだけ獲得（10件・123,400G）';const w=document.createElement('div');w.style.width=(innerWidth-32)+'px';w.appendChild(d);document.body.appendChild(w);const r=[d.scrollWidth<=d.clientWidth+1,d.offsetHeight];w.remove();return r});
  ok(ba[0]&&ba[1]<60,W+'px 買えるだけ獲得のボタンが1行に収まらない '+ba);
  await p.click('#bCreate');await p.waitForTimeout(300);await p.click('#bStart');await p.waitForTimeout(1200);
  let checked=0,near=0,fork=0;const t0=Date.now();
  while(Date.now()-t0<150000&&checked<4){await p.waitForTimeout(150);const st=await p.evaluate(()=>pending&&pending.stage);
    if(st==='route'){await p.waitForTimeout(300);
      if(!checked){/* ほかの人の結果カードを置いてから、もう一度分かれ道を出す */await p.evaluate(()=>{const e=fxEl('respop','<b>テスト</b>',null,null,7000);e.id='tRes';stepRoute()});await p.waitForTimeout(400);ok(!await p.$('#tRes'),W+'px 分かれ道で、ほかの人の結果カードが残っている')}
      const r=await p.evaluate(()=>[...document.querySelectorAll('#routeOpts .optbtn')].map(bt=>{const R=e=>{if(!e)return null;const r=e.getBoundingClientRect();return{left:r.left,right:r.right,top:r.top,bottom:r.bottom}};const ks=[...bt.querySelectorAll('.ob-f')].filter(e=>/分かれ道/.test(e.textContent));
        return{t:bt.textContent,b:R(bt.querySelector('.ob-t b')),n:R(bt.querySelector('.ob-near')),bt:R(bt),fk:ks.map(e=>{const g=document.createRange();g.selectNodeContents(e.lastChild);return e.lastChild.textContent==='分かれ道'&&g.getClientRects().length===1})}}));
      for(const o of r){if(o.n){near++;ok(!hit(o.n,o.b),W+'px 近道の札が方面名に重なる '+o.t);ok(o.n.top>=o.bt.top&&o.n.right<=o.bt.right+1,W+'px 近道の札がボタンからはみ出す '+o.t)}
        if(/分かれ道/.test(o.t)){fork++;ok(o.fk.length&&o.fk.every(Boolean),W+'px 「この先にも分かれ道」を単語の途中で切っている '+o.t)}}
      checked++;await p.click('#routeOpts .optbtn').catch(()=>{});continue}
    if(st==='act')await p.click('#bRoll').catch(()=>{});else if(st==='buy')await p.click('#bSkip').catch(()=>{});else if(st==='shop')await p.click('#bShopOk').catch(()=>{});else if(st==='reward')await p.click('#bRwCoin').catch(()=>{});
    const ac=await p.$('#acOk');if(ac&&await ac.isVisible().catch(()=>false))await ac.click().catch(()=>{})}
  ok(checked>0,W+'px 分かれ道に来なかった');
  console.log(`  ${W}px：分かれ道${checked}回（近道の札${near}件・「この先にも分かれ道」${fork}件）`);
  if(errs.length)fail.push(W+'px JSエラー '+errs.join(' / '));await c.close()}}finally{await b.close()}
  if(fail.length){console.error('FAIL 見た目・押しやすさの改善10\n'+fail.join('\n'));process.exitCode=1}else console.log('PASS 見た目・押しやすさの改善10（とじる48px・買えるだけ獲得1行・近道の札・分かれ道の結果カード）')})();
