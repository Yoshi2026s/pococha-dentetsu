// 通信対戦の途中経過：番の動きの再生（📜 ▶ 動きをもう一度見る・2026.11.06.8）のテスト（Playwright・Chromium・iPhone SE 縦 375×667・通信なし。通信の部分は差しかえ）
const {chromium}=require('playwright');const path=require('path');
const fail=[];const ok=(c,m)=>{if(!c)fail.push(m)};
(async()=>{const b=await chromium.launch();try{
  const c=await b.newContext({viewport:{width:375,height:667},isMobile:true,hasTouch:true});const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
  await p.route(/firebase|gstatic|googleapis/,r=>r.abort());
  await p.goto('file://'+path.resolve(__dirname,'index.html'));await p.waitForFunction(()=>!document.querySelector('#bCreate').disabled);
  await p.click('#bCreate');await p.waitForTimeout(400);await p.evaluate(()=>{const o=document.querySelector('#ov');o.hidden=true;o.innerHTML=''});await p.click('#bStart');
  await p.waitForFunction(()=>typeof pending!=='undefined'&&pending&&pending.stage==='act'&&!animating(),null,{timeout:20000});await p.waitForTimeout(2500);
  const r=await p.evaluate(async()=>{const tip=curTip(),st=tip.state,seat=curSeat(st),out={};db={...db,online:{setLive:async()=>{}}};seats=seats.map((v,i)=>i===seat?{...(v||{}),uid:'OTHER'}:v&&v.uid===myId?{...v,uid:'ME_AWAY'}:v);SET.fast=true;
    const pv=preview(st,{type:'roll'}),pos=st.players[seat].pos,rt=smartRoute(st,pos,pv.dice,new Set([pos])).route,s1=applyTurn(st,{type:'roll',route:rt,buy:false,reward:'coin',shopDone:true},meta.seed,{noForce:true});
    liveLogFinal({state:s1,parent:tip.id,by:'s'+seat+':OTHER'},st);const g=liveLogs.find(x=>x.turn===tip.turn&&x.seat===seat);out.g=[!!g,g&&g.path&&g.path.join(','),(s1.lastPath||[]).join(','),g&&g.dice,s1.lastDice];
    const pawns=JSON.stringify(dispState.players.map(x=>x.pos));showLiveLog(g);await new Promise(r=>setTimeout(r,200));const rb=document.querySelector('#llReplay');out.btn=rb?rb.offsetHeight:0;rb&&rb.click();await new Promise(r=>setTimeout(r,100));
    const G=document.querySelector('#replayfx'),pw=()=>G.querySelector('.rp-pawn');out.start=[!!pw(),document.querySelector('#ov').hidden];
    const end=g.path[g.path.length-1],n=NODES[end],want=`translate(${n.x.toFixed(1)} ${n.y.toFixed(1)})`;await new Promise(r=>setTimeout(r,400+g.path.length*160+100));out.end=[pw()&&pw().getAttribute('transform')===want,G.querySelector('.rp-line').getAttribute('points').split(' ').length===g.path.length,JSON.stringify(dispState.players.map(x=>x.pos))===pawns];
    await new Promise(r=>setTimeout(r,2200));out.clear=G.children.length;
    /* 途中経過のない番（動いていない）には再生ボタンを出さない */const g2={turn:99,seat,start:Date.now(),items:[{tag:'x',text:'t',t:Date.now()}],done:true};liveLogs.push(g2);showLiveLog(g2);out.none=!document.querySelector('#llReplay');document.querySelector('#llClose').click();return out});
  ok(r.g[0]&&r.g[1]===r.g[2]&&r.g[1].includes(',')&&r.g[3]===r.g[4],'確定した番に道と目を残す '+JSON.stringify(r.g));
  ok(r.btn>=48,'再生ボタンが48px未満 '+r.btn);
  ok(r.start[0]&&r.start[1],'再生の開始（画面を閉じて半とうめいの駒） '+JSON.stringify(r.start));
  ok(r.end.every(Boolean),'最後のマスまで進む・道の線・本物の駒は動かない '+JSON.stringify(r.end));
  ok(r.clear===0,'再生のあと片づけ '+r.clear);
  ok(r.none,'動いていない番に再生ボタン');
  ok(await p.evaluate(()=>{const i=SYS.findIndex(x=>x[0].includes('途中経過'));return i>=0&&/もう一度見る/.test(SYS[i][2])}),'システム説明');
  if(errs.length)fail.push('JSエラー '+errs.join(' / '));await c.close();
  }finally{await b.close()}
  if(fail.length){console.error('FAIL 途中経過（番の動きの再生）\n'+fail.join('\n'));process.exitCode=1}else console.log('PASS 途中経過（番の動きの再生）')})();
