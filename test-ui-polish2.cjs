// 画面まわりの改善 第2弾（2026-10-31）の回帰テスト（Playwright・Chromium のスマホ表示エミュレーション）
// 1) 320pxで「音と設定」シートと曲の試聴欄が画面からはみ出さない  2) キャラの入れかえ欄がはみ出さない
// 3) 右上の×・演出の見本ボタンが48px以上  4) ダークモードの見出しの影が明るい色でない
// 5) Esc キーで開いているカードを閉じる  6) 「全体を見る」の押せる範囲が48px以上
// 7) 小さい横持ち（568×320）で「ポコチャレ 0/3」がはみ出さない  8) 端末内モードで見つからない部屋の案内
const {chromium}=require('playwright');const path=require('path');
const fail=[];const ok=(c,m)=>{if(!c)fail.push(m)};
async function open(b,W,H,o={}){const c=await b.newContext({viewport:{width:W,height:H},isMobile:true,hasTouch:true,...o});const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
  await p.route(/firebase|gstatic|googleapis/,r=>r.abort());await p.goto('file://'+path.resolve('index.html'));await p.waitForFunction(()=>!document.querySelector('#bCreate').disabled);p.errs=errs;p.ctx=c;return p}
const start=async p=>{await p.click('#bCreate');await p.waitForTimeout(300);await p.click('#bStart');await p.waitForTimeout(1300)};
const closeOv=p=>p.evaluate(()=>{document.querySelectorAll('#misSheet').forEach(e=>e.remove());const o=document.querySelector('#ov');o.hidden=true;o.innerHTML=''});
const inView=p=>p.evaluate(()=>{const W=document.documentElement.clientWidth;return [...document.querySelectorAll('#ov .card, #ov .card *')].filter(e=>e.getClientRects().length&&!e.closest('.sys-tabs')).filter(e=>{const r=e.getBoundingClientRect();return r.width&&(r.left<-1||r.right>W+1)}).map(e=>e.id||e.className||e.tagName).slice(0,5)});
(async()=>{const b=await chromium.launch();try{
  {const p=await open(b,320,640);
    await p.fill('#iCode','ZZZZ');await p.click('#bJoin');await p.waitForTimeout(600);ok(/この端末で作った部屋/.test(await p.locator('#toast').textContent()),'端末内モードの見つからない部屋の案内');
    await start(p);await p.click('#bMenu');await p.waitForTimeout(300);await p.click('#mnSet');await p.waitForTimeout(900);
    const o1=await inView(p);ok(!o1.length,'320px 音と設定がはみ出す '+o1);
    const hs=await p.evaluate(()=>[...document.querySelectorAll('#ov .xclose,#demoRow button')].map(e=>e.offsetHeight));ok(hs.length>1&&hs.every(h=>h>=48),'×・演出の見本ボタンが48px未満 '+hs);
    await p.keyboard.press('Escape');await p.waitForTimeout(300);ok(await p.evaluate(()=>document.querySelector('#ov').hidden),'Esc で音と設定が閉じない');
    for(const id of ['#bMenu','#bMis','#bCard']){await p.click(id);await p.waitForTimeout(500);await p.keyboard.press('Escape');await p.waitForTimeout(300);ok(await p.evaluate(()=>document.querySelector('#ov').hidden),'Esc で閉じない '+id);await closeOv(p)}
    await p.click('#status .pl >> nth=1');await p.waitForTimeout(900);const o2=await inView(p);ok(!o2.length,'320px キャラの入れかえ欄がはみ出す '+o2);await closeOv(p);
    const hit=await p.evaluate(()=>{const e=document.querySelector('#bView'),r=e.getBoundingClientRect();const pts=[[r.left+r.width/2,r.top-3],[r.left+r.width/2,r.bottom+3],[r.left-3,r.top+r.height/2]];return pts.map(([x,y])=>{const t=document.elementFromPoint(x,y);return !!t&&(t===e||e.contains(t))})});
    ok(hit.every(Boolean),'「全体を見る」の押せる範囲が狭い '+hit);
    if(p.errs.length)fail.push('320px JSエラー '+p.errs.join(' / '));await p.ctx.close()}
  {const p=await open(b,360,640,{colorScheme:'dark'});await p.click('#bSys');await p.waitForTimeout(500);
    const sh=await p.evaluate(()=>getComputedStyle(document.querySelector('#ov h3')).textShadow);const m=sh.match(/rgba?\(([\d.]+), ([\d.]+), ([\d.]+)/);ok(m&&(+m[1]+ +m[2]+ +m[3])<200,'ダークモードの見出しの影が明るい '+sh);await p.ctx.close()}
  {const p=await open(b,568,320);await start(p);const r=await p.evaluate(()=>[...document.querySelectorAll('#bar button')].filter(e=>e.offsetParent&&e.scrollWidth>e.clientWidth+2).map(e=>e.id));ok(!r.length,'568×320 でボタンの文字がはみ出す '+r);
    if(p.errs.length)fail.push('横持ち JSエラー '+p.errs.join(' / '));await p.ctx.close()}
}finally{await b.close()}
  if(fail.length){console.error('FAIL 画面まわりの改善 第2弾\n'+fail.join('\n'));process.exitCode=1}else console.log('PASS 画面まわりの改善 第2弾（設定・キャラ欄のはみ出し・48pxの×・ダークの見出し・Escで閉じる・全体を見るの範囲・小さい横持ち・部屋の案内）')})();
