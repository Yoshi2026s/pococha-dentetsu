// 見えにくい・分かりにくい・不要な表示の手直し（2026.11.05.19）（Playwright・Chromium・iPhone SE 縦）
// 1) 端末内モードの部屋では「招待文をコピー」を出さない・空席は「開始時にCPU」（押しても何も起きない「タップで座る」を出さない）
// 2) プレイヤーの詳細のコアファンの補足が右で切れない  3) 行動ログを広げている間はリスナーコメント・CPUのひとことを隠す
// 4) 夜の決算の見出しにふちどりを付けない  5) 時間帯の表の「ゴールデン」が折れない  6) 名前の入力欄の案内文が切れない
const {chromium,devices}=require('playwright');const path=require('path'),assert=require('assert');
(async()=>{const b=await chromium.launch();let code=0;try{const c=await b.newContext({...devices['iPhone SE']});const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
  await p.route(/firebase|gstatic|googleapis/,r=>r.abort());await p.addInitScript(()=>{try{localStorage.setItem('poco-set',JSON.stringify({bgm:0,se:0,fast:true}))}catch{}});
  await p.goto('file://'+path.resolve('index.html'));await p.waitForFunction(()=>!document.querySelector('#bCreate').disabled);await p.waitForTimeout(300);
  /* 8) 端末内モードのタイトル：見出しは「CPU対戦で遊ぶ」、コードの説明に「届いた」と書かない（2026.11.05.21） */const tt=await p.evaluate(()=>({h:document.querySelector('#lobbyH').textContent,c:document.querySelector('#codeHelp').textContent}));
  assert(tt.h==='CPU対戦で遊ぶ'&&!/届いた/.test(tt.c)&&/この端末で遊んだ/.test(tt.c),'端末内モードのタイトルの表示 '+JSON.stringify(tt));
  await p.click('#bCreate');await p.waitForTimeout(500);
  const lob=await p.evaluate(()=>({copy:document.querySelector('#bCopy').hidden,seats:[...document.querySelectorAll('#seats > *')].map(e=>e.textContent)}));
  assert(lob.copy,'端末内モードで「招待文をコピー」が出た');assert(lob.seats.slice(1).every(t=>t.includes('開始時にCPU')&&!t.includes('タップで座る')),'空席の表示：'+lob.seats.join(' / '));
  await p.click('#bStart');await p.waitForTimeout(1500);
  const pl=await p.evaluate(()=>{showPlayer(dispState,mySeat());const f=document.querySelector('#ov .pl-fan'),i=document.querySelector('#iPName');const ok=f&&f.scrollWidth<=f.clientWidth+1;
    const ph=i?(()=>{const cv=document.createElement('canvas').getContext('2d');cv.font=getComputedStyle(i).font;return cv.measureText(i.placeholder).width<=i.clientWidth})():true;document.querySelector('#ov').hidden=true;document.querySelector('#ov').innerHTML='';return{ok,ph,txt:f&&f.textContent}});
  assert(pl.ok,'コアファンの補足が切れた：'+pl.txt);assert(pl.ph,'名前の入力欄の案内文が切れた');
  const lg=await p.evaluate(async()=>{comments('good',3);await new Promise(r=>setTimeout(r,300));const box=document.querySelector('#cmts'),before=box&&getComputedStyle(box).display;document.querySelector('#logPanel').click();await new Promise(r=>setTimeout(r,200));
    const after=box&&getComputedStyle(box).display;document.querySelector('#logPanel').click();await new Promise(r=>setTimeout(r,200));return{before,after,back:box&&getComputedStyle(box).display}});
  assert(lg.before!=='none'&&lg.after==='none'&&lg.back!=='none','ログを広げてもコメントが隠れない '+JSON.stringify(lg));
  const ni=await p.evaluate(()=>{const o=document.querySelector('#ov');o.innerHTML='<div class="card night"><h3>0:00 決算</h3></div>';o.hidden=false;const h=o.querySelector('h3'),w=getComputedStyle(h).webkitTextStrokeWidth;o.hidden=true;o.innerHTML='';return w});
  assert(parseFloat(ni)===0,'夜の決算の見出しにふちどり：'+ni);
  const wx=await p.evaluate(()=>{showWx();const th=[...document.querySelectorAll('#ov .xtab tr>th:first-child')].find(e=>e.textContent.includes('ゴールデン'));const r=th&&th.firstChild&&(()=>{const rg=document.createRange();rg.selectNodeContents(th.firstChild);return rg.getClientRects().length})();document.querySelector('#ov').hidden=true;document.querySelector('#ov').innerHTML='';return r});
  assert.equal(wx,1,'「ゴールデン」が折れた');
  /* 7) 振動が使えない端末（iPhoneなど）では「振動（Androidのみ）」を出さない（2026.11.05.21） */
  const vb=await p.evaluate(()=>{document.querySelector('#bSet').click();const l=document.querySelector('label[for="sV"]');const r=!!l&&l.offsetParent!==null;document.querySelector('#ov').hidden=true;document.querySelector('#ov').innerHTML='';return r});assert(vb,'振動が使える端末で振動の項目が出ない');
  {const c2=await b.newContext({...devices['iPhone SE']});const q=await c2.newPage();await q.route(/firebase|gstatic|googleapis/,r=>r.abort());await q.addInitScript(()=>{try{Object.defineProperty(Navigator.prototype,'vibrate',{value:undefined,configurable:true})}catch{}});
    await q.goto('file://'+path.resolve('index.html'));await q.waitForFunction(()=>!document.querySelector('#bCreate').disabled);await q.click('#bCreate');await q.waitForTimeout(300);await q.click('#bStart');await q.waitForTimeout(1200);
    const nv=await q.evaluate(()=>{document.querySelector('#bSet').click();const l=document.querySelector('label[for="sV"]');return{has:!!l,vis:!!l&&l.offsetParent!==null}});assert(nv.has&&!nv.vis,'振動が使えない端末に振動の項目が出た '+JSON.stringify(nv));await c2.close()}
  assert.deepEqual(errs,[],'エラー：'+errs.join(' / '));console.log('PASS 見えにくい・分かりにくい表示の手直し')}catch(e){console.error('NG',e.message);code=1}finally{await b.close();process.exit(code)}})();
