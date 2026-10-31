// 下のボタンの見た目と、ポコチャレの表示（2026-10-31）を確かめる（端末内モード・Playwright）
// 1) メニュー・ポコチャレ・カード・サイコロの4つが1段に並び（サイコロが一番右）、48px以上で画面からはみ出さない（2026-10-31に2×2から変更）
// 2) ポコチャレの内容は最初は出ておらず、ポコチャレボタンを押したときだけ表示され、とじるで消える
// 3) 対戦中のお知らせ（トースト）が上の順位表に重ならない
// 4) 獲得の画面では、メニュー・ポコチャレの列を隠す
// 実行：node test-bottom-buttons.cjs
const {chromium}=require('playwright');const path=require('path');
(async()=>{const b=await chromium.launch();const fail=[];const ok=(c,m)=>{if(!c)fail.push(m)};
  for(const [W,H] of [[393,852],[375,667],[320,568],[852,393]]){const tag=`${W}×${H}`;
    const p=await b.newPage({viewport:{width:W,height:H},isMobile:true,hasTouch:true});const errs=[];p.on('pageerror',e=>errs.push(e.message));
    await p.route(/gstatic\.com|firebase-config|fonts\.(googleapis|gstatic)/,r=>r.abort());
    await p.goto('file://'+path.resolve('index.html'));await p.waitForTimeout(800);
    await p.evaluate(()=>{SET.fast=true});await p.click('#bCreate');await p.waitForTimeout(400);await p.click('#bStart');
    try{
      const t0=Date.now();while(Date.now()-t0<30000){if(await p.evaluate(()=>!!(pending&&pending.stage==='act')))break;await p.waitForTimeout(200)}
      for(let i=0;i<5;i++){const c=await p.$('#ov:not([hidden]) button');if(!c)break;await c.click().catch(()=>{});await p.waitForTimeout(300)}
      await p.waitForTimeout(300);
      const R=await p.evaluate(()=>['#bMenu','#bMis','#bCard','#bRoll'].map(s=>{const r=document.querySelector(s).getBoundingClientRect();return{s,w:r.width,h:r.height,l:r.left,r:r.right,t:r.top}}));
      // 2026-10-31：1段に4つ（左から メニュー・ポコチャレ・カード・サイコロ）。サイコロは一番右で少し広い
      ok(R.every(x=>Math.abs(x.h-R[0].h)<1.5&&Math.abs(x.t-R[0].t)<1),tag+' 4つのボタンが1段に同じ高さで並んでいない '+JSON.stringify(R));
      ok(R.slice(0,3).every(x=>Math.abs(x.w-R[0].w)<1.5)&&R[3].w>=R[0].w,tag+' メニュー・ポコチャレ・カードの幅がそろっていない／サイコロが狭い');
      ok(R.every((x,i)=>i===0||x.l>=R[i-1].r-1),tag+' 左から メニュー・ポコチャレ・カード・サイコロ の順でない');
      ok(R.every(x=>x.h>=48&&x.w>=48),tag+' ボタンが48px未満');
      ok(await p.evaluate(()=>[...document.querySelectorAll('#btnRow button')].every(b=>b.scrollWidth<=b.clientWidth+1)),tag+' ボタンの文字がはみ出す');
      ok(R.every(x=>x.l>=0&&x.r<=innerWidthOf(W)),tag+' ボタンが画面の横からはみ出す');
      ok(await p.evaluate(()=>!document.querySelector('#misSheet')&&!document.querySelector('.misbar')),tag+' ポコチャレの内容が最初から出ている');
      ok(/^\d\/\d$/.test(await p.textContent('#misCnt')),tag+' ポコチャレボタンに達成数がない');
      await p.click('#bMis');await p.waitForTimeout(300);
      ok(await p.evaluate(()=>!!document.querySelector('#misSheet')&&!document.querySelector('#ov').hidden&&document.querySelectorAll('#misSheet .ms-r').length===pending.st.mis.length),tag+' ポコチャレボタンで内容が出ない');
      await p.click('#msClose');await p.waitForTimeout(200);
      ok(await p.evaluate(()=>document.querySelector('#ov').hidden&&!document.querySelector('#misSheet')),tag+' とじるで消えない');
      const T=await p.evaluate(()=>{toast('テストのお知らせ');const t=document.querySelector('#toast').getBoundingClientRect(),s=document.querySelector('#status').getBoundingClientRect();return{t:t.top,s:s.bottom,vis:s.bottom>0&&s.bottom<innerHeight*.5}});
      if(T.vis)ok(T.t>=T.s,tag+' お知らせが順位表に重なる '+JSON.stringify(T));
      await p.evaluate(()=>{pending.stage='buy';pending.base={type:'roll'};const k=NODES.findIndex(n=>n.bases&&n.bases.length);pending.pv={pos:k,nd:NODES[k],own:NODES[k].bases.map(()=>null),coin:5e6,seat:curSeat(pending.st)};pending.sel=new Set();drawBaseList();render()});await p.waitForTimeout(200);
      ok(await p.evaluate(()=>getComputedStyle(document.querySelector('.bar .toprow')).display==='none'),tag+' 獲得の画面でメニュー・ポコチャレの列が出たまま');
    }catch(e){fail.push(tag+' '+e.message)}
    if(errs.length)fail.push(tag+' JSエラー：'+errs.join(' / '));await p.close()}
  await b.close();
  if(fail.length){console.log('FAIL 下のボタンとポコチャレ\n'+fail.join('\n'));process.exit(1)}
  console.log('PASS 下のボタンとポコチャレ（4ボタン1段・サイコロが右・押したときだけ内容表示・お知らせの位置・獲得画面で非表示）4画面')})();
function innerWidthOf(W){return W+0.5}
