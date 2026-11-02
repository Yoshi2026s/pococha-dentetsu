// カードを使ったときの帯（2026-11-02・Playwright・Chromium のスマホ表示エミュレーション）
// 1) ゲーム最初の手番でカードを使っても、帯（ジャンルのマーク・カードの絵つき）が出る（以前は1手番目だけ演出が出なかった）
// 2) そのあともCPUの手番が進む
// 3) カードの絵は帯の中に収まり、画面の横にはみ出さない
// 4) URのカード：ULTRA RARE の文字は帯の中の一番上（文字→カードの絵→名前の順）で、重ならない
const {chromium}=require('playwright');const path=require('path');
const fail=[];const ok=(c,m)=>{if(!c)fail.push(m)};
(async()=>{const b=await chromium.launch();try{for(const [W,H] of [[390,844],[320,568]]){
  const c=await b.newContext({viewport:{width:W,height:H},isMobile:true,hasTouch:true});const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
  await p.route(/firebase|gstatic|googleapis/,r=>r.abort());await p.goto('file://'+path.resolve('index.html'));await p.waitForFunction(()=>!document.querySelector('#bCreate').disabled);
  await p.click('#bCreate');await p.waitForTimeout(300);await p.click('#bStart');await p.waitForFunction(()=>!!pending&&curTip()&&curTip().turn===0,null,{timeout:15000});await p.waitForTimeout(800);
  await p.evaluate(()=>{window.__bn=[];const ob=banner;window.banner=function(...a){const e=ob.apply(this,a);if(e){const bc=e.querySelector('.bn');setTimeout(()=>{const k=e.querySelector('.bncard'),q=k&&k.getBoundingClientRect(),r=bc&&bc.getBoundingClientRect();__bn.push({t:a[0],card:!!k,inside:!!(q&&r&&q.left>=r.left-1&&q.right<=r.right+1)})},800)}return e};pending.st.players[curSeat(pending.st)].hand=['luckywarp'];render()});
  await p.click('#bCard');await p.waitForTimeout(400);await p.click('#ov .cardbtn[data-k="luckywarp"]');
  // カードを使うとポコチャレ達成で報酬を選ぶ画面が出ることがある。そのときはゴールドを選んで手番を確定する
  for(let i=0;i<20;i++){await p.waitForTimeout(200);if(await p.evaluate(()=>!!pending&&pending.stage==='reward')){await p.click('#bRwCoin');break}if(await p.evaluate(()=>curTip().turn>=1))break}
  await p.waitForFunction(()=>__bn.some(x=>/ラッキーワープ/.test(x.t)),null,{timeout:8000}).catch(()=>{});
  const r=await p.evaluate(()=>({bn:__bn.find(x=>/ラッキーワープ/.test(x.t))||null,sw:document.documentElement.scrollWidth}));
  ok(r.bn&&r.bn.card&&r.bn.inside&&/🚄/.test(r.bn.t),`${W}px 最初の手番でカードの帯が出ない ${JSON.stringify(r.bn)}`);ok(r.sw<=W,`${W}px 横にはみ出す ${r.sw}`);
  await p.waitForFunction(()=>curTip().turn>=2,null,{timeout:20000}).catch(()=>{});ok(await p.evaluate(()=>curTip().turn>=2),`${W}px そのあと手番が進まない`);
  // URのカード：ULTRA RARE の文字は帯の中の一番上に入り、カードの絵・名前と重ならない
  // （テストで差し込む演出は、裏で進むCPUの手番の演出と重なると出ないことがあるので、出なかったときだけ1回やり直す）
  const urRun=()=>p.evaluate(async()=>{const st=JSON.parse(JSON.stringify(curTip().state));st.ev=[{k:'card',t:'目的地すぐそばワープを使った',v:'goalnear'}];st.lastSeat=0;st.lastPath=[st.players[0].pos];st.lastDice=null;playOne({state:st,turn:st.turn,id:'ur-test'});
    for(let i=0;i<200;i++){await new Promise(r=>setTimeout(r,100));const bx=[...document.querySelectorAll('.fx.banner .bn')].find(x=>/目的地すぐそばワープ/.test(x.textContent)),e=bx&&bx.querySelector('.bnur');if(e){await new Promise(r=>setTimeout(r,700));const R=x=>x&&x.getBoundingClientRect(),c=R(bx.querySelector('.bncard')),u=R(e),t=R(e.closest('.bn').querySelector(':scope>span')),ov=(a,b)=>!!(a&&b&&!(a.bottom<=b.top+1||b.bottom<=a.top+1));return{card:!!c,text:!!t,over:ov(u,c)||ov(u,t)||ov(c,t),order:!!(u&&c&&t&&u.bottom<=c.top+1&&c.bottom<=t.top+1),sep:document.querySelectorAll('.fx.urtxt').length}}}return null});let ur=await urRun();if(!ur)ur=await urRun();
  ok(ur&&ur.card&&ur.text&&!ur.over&&ur.order&&ur.sep===0,`${W}px URの帯で文字とカードの絵が重なる ${JSON.stringify(ur)}`);
  ok(!errs.length,`${W}px ページのエラー ${errs.slice(0,2).join(' / ')}`);await c.close()}}
  catch(e){fail.push('例外 '+e.message)}finally{await b.close()}
  if(fail.length){console.error('FAIL カードの帯\n'+fail.join('\n'));process.exitCode=1}else console.log('PASS カードの帯（最初の手番でも出る・カードの絵・はみ出さない・URの文字が重ならない）')})();
