// 見やすさ・表記の見直し 第6弾（2026-10-31）の回帰テスト（Playwright・Chromium のスマホ表示エミュレーション）
// 1) システム説明：音の説明から内部の話（地図に色を重ねない等）を外す・「匿名ID」を使わない  2) カードの閉じるボタンは「とじる」にそろえる
// 3) 端末内モードの部屋：準備OKのボタン・札と「全員準備OK」の文を出さない（開始はできる）  4) 物件の一括ボタンは「買えるだけ獲得」
// 5) 中断の表示：名前と「が」の間に空白を入れない・説明が短い  6) 行動ログ：名前は色つき太字、CPUの手番に毎回「（CPU）」を付けない
// 7) ゴール画面の「タップでとばす」が14px以上
const {chromium}=require('playwright');const path=require('path');
const fail=[];const ok=(c,m)=>{if(!c)fail.push(m)};
(async()=>{const b=await chromium.launch();try{
  const c=await b.newContext({viewport:{width:360,height:740},isMobile:true,hasTouch:true});const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
  await p.addInitScript(()=>{try{localStorage.setItem('poco-set',JSON.stringify({bgm:0,se:0,fast:true}))}catch{}});
  await p.route(/firebase|gstatic|googleapis/,r=>r.abort());await p.goto('file://'+path.resolve('index.html'));await p.waitForFunction(()=>!document.querySelector('#bCreate').disabled);
  const sys=await p.evaluate(()=>SYS.map(x=>x[2]).join(''));ok(!/匿名ID|地図には色を重ねません|BGMを少し下げて/.test(sys),'システム説明に内部の話が残る');
  await p.click('#bCreate');await p.waitForTimeout(400);
  const room=await p.evaluate(()=>({ready:!document.querySelector('#bReady').hidden,chip:/準備OK/.test(document.querySelector('#seats').textContent),note:document.querySelector('#roomNote').textContent,start:!document.querySelector('#bStart').disabled}));
  ok(!room.ready&&!room.chip&&!/全員準備OK/.test(room.note)&&room.start,'端末内モードの部屋の準備OK '+JSON.stringify(room));
  await p.click('#bStart');await p.waitForTimeout(1500);
  ok(await p.evaluate(async()=>{const pr=showOverlay('<h3>テスト</h3>',0);const t=document.querySelector('#ovClose').textContent;document.querySelector('#ovClose').click();await pr;return t==='とじる'}),'カードの閉じるボタンが「とじる」でない');
  ok(await p.evaluate(()=>{const k=NODES.findIndex(n=>n.type==='station'&&n.bases&&n.bases.length>=3);const seat=curSeat(pending.st);pending.stage='buy';pending.base={type:'roll'};pending.pv={pos:k,nd:NODES[k],own:NODES[k].bases.map(()=>null),coin:5e6,seat};pending.sel=new Set();drawBaseList();render();const t=document.querySelector('#bBuyAll').textContent;pending.stage='act';render();return /買えるだけ獲得/.test(t)}),'物件の一括ボタンの表記');
  await p.evaluate(()=>{pending.stage='act';render()});await p.click('#bRoll');
  for(let i=0;i<80;i++){await p.waitForTimeout(400);const st=await p.evaluate(()=>[pending&&pending.stage,document.querySelectorAll('#log li').length]);if(st[1]>=3)break;if(st[0]==='route')await p.click('#bAuto').catch(()=>{});else if(st[0]==='buy')await p.click('#bSkip').catch(()=>{});else if(st[0]==='shop')await p.click('#bShopOk').catch(()=>{});else if(st[0]==='reward')await p.click('#bRwCoin').catch(()=>{});else if(st[0]==='act')await p.click('#bRoll').catch(()=>{});const o=await p.$('#ov:not([hidden]) #ovClose');if(o)await o.click().catch(()=>{});const ac=await p.$('#acOk');if(ac&&await ac.isVisible())await ac.click().catch(()=>{})}
  const lg=await p.evaluate(()=>[...document.querySelectorAll('#log li')].map(l=>({b:!!l.querySelector('.lg-who'),c:l.querySelector('.lg-who')&&l.querySelector('.lg-who').style.color,t:l.textContent})));
  ok(lg.length>=2&&lg.every(x=>x.b&&x.c)&&!lg.some(x=>/（CPU）/.test(x.t)),'行動ログの名前・（CPU） '+JSON.stringify(lg).slice(0,200));
  const pz=await p.evaluate(()=>{meta.paused={seat:mySeat(),at:Date.now()};drawPause(true);const t=document.querySelector('.pausebox').innerText;meta.paused=null;drawPause(true);return t});
  ok(!/ が中断| の番から/.test(pz)&&!/次に開いたとき/.test(pz),'中断の表示 '+pz.replace(/\n/g,' ').slice(0,120));
  const gs=await p.evaluate(()=>{goalShow(mySeat(),NODES[dispState.goal],1000,NODES[0]);return new Promise(r=>setTimeout(()=>{const e=document.querySelector('.gfs-skip');r(e?parseFloat(getComputedStyle(e).fontSize):0)},400))});ok(gs>=14,'タップでとばすが小さい '+gs);
  if(errs.length)fail.push('JSエラー '+errs.join(' / '));await c.close()
}finally{await b.close()}
  if(fail.length){console.error('FAIL 見やすさ・表記の見直し 第6弾\n'+fail.join('\n'));process.exitCode=1}else console.log('PASS 見やすさ・表記の見直し 第6弾（説明の整理・とじる・端末内の準備OK・獲得の表記・中断の表示・行動ログ・とばす案内）')})();
