// 「続きから遊ぶ」の削除（2026-11-01）のテスト（Playwright・Chromium・端末内モード）
// 1) 一覧の各行に「削除」ボタン（48px以上）  2) 確認で「キャンセル」なら何も消さない
// 3) 「OK」で一覧から消え、端末内の部屋のデータ（games/部屋コード 以下）も消える  4) 「元に戻す」でデータと一覧が戻り、続きから入れる
const {chromium}=require('playwright');const path=require('path');
const fail=[];const ok=(c,m)=>{if(!c)fail.push(m)};
(async()=>{const b=await chromium.launch();try{for(const [W,H] of [[390,844],[320,568]]){const tag=W+'×'+H;
  const c=await b.newContext({viewport:{width:W,height:H},isMobile:true,hasTouch:true});const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
  await p.route(/firebase|gstatic|googleapis/,r=>r.abort());await p.addInitScript(()=>{try{localStorage.setItem('poco-set',JSON.stringify({bgm:0,se:0,fast:true}))}catch{}});
  let answer=false,dmsg='';p.on('dialog',d=>{dmsg=d.message();answer?d.accept():d.dismiss()});
  await p.goto('file://'+path.resolve('index.html'));await p.waitForFunction(()=>!document.querySelector('#bCreate').disabled);await p.click('#bCreate');await p.waitForTimeout(300);await p.click('#bStart');await p.waitForTimeout(1500);
  const t0=Date.now();while(Date.now()-t0<40000){await p.waitForTimeout(250);if(await p.evaluate(()=>dispState&&dispState.turn>=2))break;const st=await p.evaluate(()=>pending&&pending.stage);if(st==='act')await p.click('#bRoll').catch(()=>{});else if(st==='route')await p.click('#bAuto').catch(()=>{});else if(st==='buy')await p.click('#bSkip').catch(()=>{});else if(st==='shop')await p.click('#bShopOk').catch(()=>{});else if(st==='reward')await p.click('#bRwCoin').catch(()=>{});const ac=await p.$('#acOk');if(ac&&await ac.isVisible().catch(()=>false))await ac.click().catch(()=>{})}
  ok(await p.evaluate(()=>dispState&&dispState.turn>=2),tag+' 2手番まで進んだ');
  const room=await p.evaluate(()=>code);const keys=()=>p.evaluate(rc=>Object.keys(localStorage).filter(k=>k.startsWith('pdl:d:games/'+rc)).length,room);
  const k0=await keys();await p.evaluate(()=>leaveRoom());await p.waitForSelector('#resumeBox:not([hidden]) .resumedel',{timeout:8000});
  const sz=await p.evaluate(()=>{const r=document.querySelector('.resumedel').getBoundingClientRect();return[r.width,r.height]});ok(sz[0]>=48&&sz[1]>=48,tag+' 削除ボタンの大きさ '+sz);
  /* プレイヤー名（2026.11.05.7）：一覧の行に4人の名前、削除の確認にも同じ名前。行は画面の幅に収まる */
  const pl=await p.evaluate(()=>{const e=document.querySelector('.resumerow .rs-pl'),r=e&&e.getBoundingClientRect(),row=document.querySelector('.resumerow').getBoundingClientRect();return e?{dbg:[r.right,row.right,document.documentElement.scrollWidth,innerWidth],t:e.textContent,ok:r.right<=row.right+1&&document.documentElement.scrollWidth<=innerWidth,names:[0,1,2,3].map(i=>seatName(i))}:null});
  ok(pl&&/^👥 /.test(pl.t)&&pl.t.split('・').length===4&&pl.t.includes('あなた'),tag+' 一覧にプレイヤー名が無い：'+(pl&&pl.t));ok(pl&&pl.ok,tag+' プレイヤー名の行がはみ出した'+JSON.stringify(pl&&pl.dbg));
  answer=false;dmsg='';await p.click('.resumedel');await p.waitForTimeout(300);ok(dmsg.includes('プレイヤー：')&&dmsg.includes(pl.t.replace('👥 ','')),tag+' 削除の確認にプレイヤー名が無い：'+dmsg);
  ok(await p.evaluate(rc=>document.querySelector('.resumedel').dataset.c===rc,room),tag+' 削除ボタンが部屋の行にある');
  answer=false;await p.click('.resumedel');await p.waitForTimeout(400);ok(await keys()===k0&&await p.evaluate(()=>!!document.querySelector('.resumebtn')),tag+' キャンセルなら消さない');
  answer=true;await p.click('.resumedel');await p.waitForTimeout(600);
  const del=await p.evaluate(rc=>({list:!document.querySelector('.resumebtn[data-c="'+rc+'"]'),saved:JSON.parse(localStorage.getItem('poco-rooms')||'[]').some(x=>x.c===rc),undo:!!document.querySelector('#bUndoDel')}),room);
  ok(k0>0&&await keys()===0&&del.list&&!del.saved&&del.undo,tag+' 削除でデータと一覧が消える '+JSON.stringify({k0,...del}));
  await p.click('#bUndoDel');await p.waitForSelector('.resumebtn',{timeout:5000}).catch(()=>{});
  ok(await keys()===k0&&await p.evaluate(rc=>!!document.querySelector('.resumebtn[data-c="'+rc+'"]'),room),tag+' 元に戻す');
  await p.click('.resumebtn');await p.waitForTimeout(1500);{const st=await p.evaluate(rc=>({code,rc,ph:meta&&meta.phase,turn:dispState&&dispState.turn,tip:(curTip()||{}).turn}),room);ok(st.code===room&&st.ph==='playing'&&st.tip>=2,tag+' 元に戻した続きから入れる '+JSON.stringify(st))}
  if(errs.length)fail.push(tag+' JSエラー '+errs.join(' / '));await c.close()}}finally{await b.close()}
  if(fail.length){console.error('FAIL 続きからの削除\n'+fail.join('\n'));process.exitCode=1}else console.log('PASS 続きからの削除（削除ボタン・確認・データと一覧の削除・元に戻す）')})();
