// カードを使ったときの帯（2026-11-02・Playwright・Chromium のスマホ表示エミュレーション）
// 1) ゲーム最初の手番でカードを使っても、帯（ジャンルのマーク・カードの絵つき）が出る（以前は1手番目だけ演出が出なかった）
// 2) そのあともCPUの手番が進む
// 3) カードの絵は帯の中に収まり、画面の横にはみ出さない
const {chromium}=require('playwright');const path=require('path');
const fail=[];const ok=(c,m)=>{if(!c)fail.push(m)};
(async()=>{const b=await chromium.launch();try{for(const [W,H] of [[390,844],[320,568]]){
  const c=await b.newContext({viewport:{width:W,height:H},isMobile:true,hasTouch:true});const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
  await p.route(/firebase|gstatic|googleapis/,r=>r.abort());await p.goto('file://'+path.resolve('index.html'));await p.waitForFunction(()=>!document.querySelector('#bCreate').disabled);
  await p.click('#bCreate');await p.waitForTimeout(300);await p.click('#bStart');await p.waitForFunction(()=>!!pending&&curTip()&&curTip().turn===0,null,{timeout:15000});await p.waitForTimeout(800);
  await p.evaluate(()=>{window.__bn=[];const ob=banner;window.banner=function(...a){const e=ob.apply(this,a);if(e){const bc=e.querySelector('.bn');setTimeout(()=>{const k=e.querySelector('.bncard'),q=k&&k.getBoundingClientRect(),r=bc&&bc.getBoundingClientRect();__bn.push({t:a[0],card:!!k,inside:!!(q&&r&&q.left>=r.left-1&&q.right<=r.right+1)})},800)}return e};pending.st.players[curSeat(pending.st)].hand=['luckywarp'];render()});
  await p.click('#bCard');await p.waitForTimeout(400);await p.click('#ov .cardbtn[data-k="luckywarp"]');
  await p.waitForFunction(()=>__bn.some(x=>/ラッキーワープ/.test(x.t)),null,{timeout:8000}).catch(()=>{});
  const r=await p.evaluate(()=>({bn:__bn.find(x=>/ラッキーワープ/.test(x.t))||null,sw:document.documentElement.scrollWidth}));
  ok(r.bn&&r.bn.card&&r.bn.inside&&/🚄/.test(r.bn.t),`${W}px 最初の手番でカードの帯が出ない ${JSON.stringify(r.bn)}`);ok(r.sw<=W,`${W}px 横にはみ出す ${r.sw}`);
  await p.waitForFunction(()=>curTip().turn>=2,null,{timeout:20000}).catch(()=>{});ok(await p.evaluate(()=>curTip().turn>=2),`${W}px そのあと手番が進まない`);
  ok(!errs.length,`${W}px ページのエラー ${errs.slice(0,2).join(' / ')}`);await c.close()}}
  catch(e){fail.push('例外 '+e.message)}finally{await b.close()}
  if(fail.length){console.error('FAIL カードの帯\n'+fail.join('\n'));process.exitCode=1}else console.log('PASS カードの帯（最初の手番でも出る・カードの絵・はみ出さない）')})();
