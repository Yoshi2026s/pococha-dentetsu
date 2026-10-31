// 画面まわりの改善 第3弾（2026-10-31）の回帰テスト（Playwright・Chromium のエミュレーション）
// 1) iPad 横・パソコン（幅900px以上の横長）は左に順位と操作、右に大きな地図  2) カードを開くと読み上げ・キーボードの位置がカードへ移り、閉じると元のボタンへ戻る
// 3) theme-color などの指定  4) 行動ログはタップで広がる  5) 自分の結果カードは演出カードより下（決算などが押せる）
// 6) 時間帯と天気の「コアファンマス」が1行  7) 目的地の駅名・検算OK の文字が濃い（明るい背景）  8) 「番」の文字が白  9) サイコロの合計と目的地の矢印が重ならない
const {chromium}=require('playwright');const path=require('path');
const fail=[];const ok=(c,m)=>{if(!c)fail.push(m)};
async function open(b,W,H,o={}){const c=await b.newContext({viewport:{width:W,height:H},...o});const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
  await p.route(/firebase|gstatic|googleapis/,r=>r.abort());await p.goto('file://'+path.resolve('index.html'));await p.waitForFunction(()=>!document.querySelector('#bCreate').disabled);p.errs=errs;p.ctx=c;return p}
const start=async p=>{await p.click('#bCreate');await p.waitForTimeout(300);await p.click('#bStart');await p.waitForTimeout(1500)};
(async()=>{const b=await chromium.launch();try{
  {const p=await open(b,1180,820);await start(p);const r=await p.evaluate(()=>{const m=document.querySelector('#mapbox').getBoundingClientRect(),s=document.querySelector('#status').getBoundingClientRect();return {mw:m.width,mh:m.height,side:m.left>=s.right}});
    ok(r.side&&r.mw>600&&r.mh>700,'iPad横で地図が右に大きく出ない '+JSON.stringify(r));await p.ctx.close()}
  {const p=await open(b,390,844,{isMobile:true,hasTouch:true});
    ok(await p.evaluate(()=>!!document.querySelector('meta[name=theme-color]')&&!!document.querySelector('meta[name=apple-mobile-web-app-title]')),'theme-color などの指定がない');
    await p.focus('#bSys');await p.keyboard.press('Enter');await p.waitForTimeout(400);
    const f1=await p.evaluate(()=>{const o=document.querySelector('#ov');return {role:o.getAttribute('role'),inCard:o.querySelector('.card').contains(document.activeElement),lab:!!document.getElementById(o.getAttribute('aria-labelledby')||'x')}});
    ok(f1.role==='dialog'&&f1.inCard&&f1.lab,'カードを開いたとき位置がカードに移らない '+JSON.stringify(f1));
    await p.keyboard.press('Escape');await p.waitForTimeout(300);ok(await p.evaluate(()=>document.activeElement&&document.activeElement.id==='bSys'),'閉じたあと元のボタンへ戻らない');
    await start(p);
    const lp=await p.evaluate(()=>{const l=document.querySelector('#logPanel'),h0=getComputedStyle(document.querySelector('#log')).maxHeight;l.click();const h1=getComputedStyle(document.querySelector('#log')).maxHeight,e=l.getAttribute('aria-expanded');l.click();return {h0,h1,e,e2:l.getAttribute('aria-expanded')}});
    ok(parseFloat(lp.h0)<=50&&parseFloat(lp.h1)>100&&lp.e==='true'&&lp.e2==='false','行動ログが広がらない '+JSON.stringify(lp));
    ok(await p.evaluate(()=>{const d=document.createElement('div');d.className='myres';document.body.appendChild(d);const z=+getComputedStyle(d).zIndex;d.remove();return z<+getComputedStyle(document.querySelector('#ov')).zIndex}),'自分の結果カードが演出カードより上');
    ok(await p.evaluate(()=>getComputedStyle(document.querySelector('.pl-now')).color==='rgb(255, 255, 255)'),'「番」の文字が白でない');
    ok(await p.evaluate(()=>{const c=getComputedStyle(document.querySelector('.st-head .sh-goal b')).color;return !/rgb\(255, 138, 61\)/.test(c)}),'目的地の駅名が明るいまま');
    const ar=await p.evaluate(async()=>{let n=0,hit=0;for(let k=0;k<NODES.length;k+=17){rollCube(12,[5,3,4]);await new Promise(r=>setTimeout(r,80));camAt(NODES[k],ZN+.3,0);await new Promise(r=>setTimeout(r,700));/* 合計の札の登場アニメが終わってから測る */const a=document.querySelector('#goalArrow'),t=document.querySelector('#diceTag');if(a.hidden||!t||t.hidden)continue;n++;const A=a.getBoundingClientRect(),B=t.getBoundingClientRect();if(A.left<B.right&&B.left<A.right&&A.top<B.bottom&&B.top<A.bottom)hit++}return {n,hit}});
    ok(ar.n>15&&ar.hit===0,'サイコロの合計と目的地の矢印が重なる '+JSON.stringify(ar));
    await p.click('#skyLabel');await p.waitForTimeout(700);const wx=await p.evaluate(()=>[...document.querySelectorAll('.wxnow small')].map(s=>s.offsetHeight<=Math.ceil(parseFloat(getComputedStyle(s).fontSize)*1.6)));ok(wx.length===3&&wx.every(Boolean),'「コアファンマス」が2行になる '+wx);
    if(p.errs.length)fail.push('JSエラー '+p.errs.join(' / '));await p.ctx.close()}
  {const p=await open(b,320,640,{isMobile:true});await start(p);await p.click('#skyLabel');await p.waitForTimeout(700);const wx=await p.evaluate(()=>[...document.querySelectorAll('.wxnow small')].map(s=>s.scrollWidth<=s.clientWidth&&s.offsetHeight<=Math.ceil(parseFloat(getComputedStyle(s).fontSize)*1.6)));ok(wx.every(Boolean),'320pxで「コアファンマス」がはみ出す・2行 '+wx);await p.ctx.close()}
}finally{await b.close()}
  if(fail.length){console.error('FAIL 画面まわりの改善 第3弾\n'+fail.join('\n'));process.exitCode=1}else console.log('PASS 画面まわりの改善 第3弾（iPad横の配置・カードの読み上げ位置・theme-color・行動ログ・結果カードの重なり順・天気の表示・文字の濃さ・番の文字・矢印とサイコロ）')})();
