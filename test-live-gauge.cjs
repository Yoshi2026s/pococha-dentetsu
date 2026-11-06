// 通信対戦の途中経過：持ち時間のゲージ・目的地への近づき具合・📜からスタンプ（2026.11.06.6）のテスト（Playwright・Chromium・iPhone SE 縦 375×667・通信なし。通信の部分は差しかえ）
const {chromium}=require('playwright');const path=require('path');
const fail=[];const ok=(c,m)=>{if(!c)fail.push(m)};
(async()=>{const b=await chromium.launch();try{
  const c=await b.newContext({viewport:{width:375,height:667},isMobile:true,hasTouch:true});const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
  await p.route(/firebase|gstatic|googleapis/,r=>r.abort());
  await p.goto('file://'+path.resolve(__dirname,'index.html'));await p.waitForFunction(()=>!document.querySelector('#bCreate').disabled);
  await p.click('#bCreate');await p.waitForTimeout(400);await p.evaluate(()=>{const o=document.querySelector('#ov');o.hidden=true;o.innerHTML=''});await p.click('#bStart');
  await p.waitForFunction(()=>typeof pending!=='undefined'&&pending&&pending.stage==='act'&&!animating(),null,{timeout:20000});await p.waitForTimeout(2500);
  const r=await p.evaluate(async()=>{const tip=curTip(),st=tip.state,seat=curSeat(st),out={};const pos=st.players[seat].pos,x=ADJ[pos][0];
    db={...db,online:{setLive:async()=>{}}};seats=seats.map((v,i)=>i===seat?{...(v||{}),uid:'OTHER'}:v&&v.uid===myId?{...v,uid:'ME_AWAY'}:v);floatNum=()=>{};const toasts=[];toast=t=>toasts.push(t);const sent=[];grp={emit:async(t,d)=>{sent.push([t,d.i])}};
    const gauge=sec=>{meta={...meta,phase:'playing',paused:null,cpuTimeoutSec:90,turnAt:{toMillis:()=>Date.now()-sec*1000}};liveBubble();const e=document.querySelector('#liveBub');return[+getComputedStyle(e).getPropertyValue('--tl'),e.classList.contains('lb-low'),getComputedStyle(e,'::after').height]};
    const base={uid:'OTHER',turn:tip.turn,seat,d:1,ds:[],card:'',stage:'route',opts:[]};liveRolled=tip.turn;onLive({...base,path:[pos,x]});
    out.g0=gauge(0);out.g1=gauge(45);out.g2=gauge(70);
    const D0=D(st.goal);out.gg=[liveGoalGap(st,seat,x),`🏁あと${D0[pos]}→${D0[x]}`,liveGoalGap(st,seat,st.goal),liveCur.gg,liveText(liveCur)];
    out.log=(liveLog?liveLog.items:[]).map(i=>i.text).filter(t=>/^📍/.test(t));
    showLiveLog();await new Promise(r=>setTimeout(r,200));const bs=[...document.querySelectorAll('#ov .ll-stamps button')];out.st=[bs.length,Math.min(...bs.map(b=>b.offsetHeight)),bs.every(b=>b.scrollWidth<=b.clientWidth+1&&b.offsetHeight<=52),bs.map(b=>b.textContent).join('/'),document.querySelector('#llClose').getBoundingClientRect().bottom<=innerHeight+1];
    lastStamp=0;bs[0].click();bs[2].click();await new Promise(r=>setTimeout(r,50));out.sent=[JSON.stringify(sent),toasts.includes('スタンプは3秒に1回までです')];document.querySelector('#llClose').click();return out});
  ok(r.g0[0]===1&&!r.g0[1]&&r.g0[2]==='3px','持ち時間ゲージ（満タン） '+JSON.stringify(r.g0));
  ok(Math.abs(r.g1[0]-0.5)<0.03&&!r.g1[1],'持ち時間ゲージ（半分） '+JSON.stringify(r.g1));
  ok(r.g2[0]<0.25&&r.g2[1],'持ち時間ゲージ（残り30秒以下はオレンジ） '+JSON.stringify(r.g2));
  ok(r.gg[0]===r.gg[1]&&r.gg[2]===''&&r.gg[3]===r.gg[1]&&r.gg[4].endsWith('・'+r.gg[1]),'目的地への近づき具合 '+JSON.stringify(r.gg));
  ok(r.log.length===1&&r.log[0].endsWith('（'+r.gg[1]+'）'),'番の流れの止まるマス '+JSON.stringify(r.log));
  ok(r.st[0]===4&&r.st[1]>=48&&r.st[2]&&r.st[3]==='ナイス！/コアファンありがとう/やられた〜/がんばれ！'&&r.st[4],'📜のスタンプ（4つ・48px・とじるまで1画面） '+JSON.stringify(r.st));
  ok(r.sent[0]==='[["stamp",0]]'&&r.sent[1],'スタンプの送信と3秒の間隔 '+JSON.stringify(r.sent));
  ok(await p.evaluate(()=>{const i=SYS.findIndex(x=>x[0].includes('途中経過'));return i>=0&&/持ち時間/.test(SYS[i][2])&&/🏁あと16→11/.test(SYS[i][2])}),'システム説明');
  if(errs.length)fail.push('JSエラー '+errs.join(' / '));await c.close();
  }finally{await b.close()}
  if(fail.length){console.error('FAIL 途中経過（持ち時間・近づき具合・スタンプ）\n'+fail.join('\n'));process.exitCode=1}else console.log('PASS 途中経過（持ち時間のゲージ・目的地への近づき具合・📜のスタンプ）')})();
