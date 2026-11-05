// デッドヒート（2026.11.05.5）：2人以上が目的地まで4マス以内に迫ったら、その目的地で1回だけ「デッドヒート！」を出す（表示だけ・jsdom）
const {JSDOM,VirtualConsole}=require('jsdom');const fs=require('fs'),assert=require('assert');
const errors=[],vc=new VirtualConsole();vc.on('jsdomError',e=>{if(!e.message.includes('Not implemented'))errors.push(e.message)});
const s=fs.readFileSync('index.html','utf8').replace(/<script[^>]+src=[^>]+><\/script>/g,'');
const dom=new JSDOM(s,{url:'https://example.test/',runScripts:'dangerously',pretendToBeVisual:true,virtualConsole:vc,beforeParse(w){w.matchMedia=()=>({matches:true,addEventListener(){},removeEventListener(){}});w.HTMLCanvasElement.prototype.getContext=()=>new Proxy({},{get:()=>()=>{}});w.SVGElement.prototype.getScreenCTM=()=>({a:1,b:0,c:0,d:1,e:0,f:0});w.SVGElement.prototype.getBBox=()=>({x:0,y:0,width:100,height:100});w.Element.prototype.animate=()=>({cancel(){},finished:Promise.resolve()});}});
const wait=ms=>new Promise(r=>setTimeout(r,ms));
setTimeout(async()=>{const w=dom.window,d=w.document;try{
  d.querySelector('#bCreate').click();await wait(150);d.querySelector('#bStart').click();await wait(400);w.eval('SET.fast=true');
  // 目的地のまわりに2人を置いた盤面を作る（目的地からちょうど2マス・3マスの駅以外のマス）
  w.eval(`window.mk=(n)=>{const st=JSON.parse(JSON.stringify(curTip().state)),dg=D(st.goal),far=dg.indexOf(Math.max(...dg.filter(v=>v<1e9)));const at=k=>dg.findIndex(v=>v===k);st.players.forEach((p,i)=>p.pos=i<n?at(2+i):far);st.ev=[];st.lastSeat=curSeat(st);st.lastPath=[];return st}`);
  assert.deepEqual(JSON.parse(w.eval('JSON.stringify(heatOf(mk(2)))')),[0,1],'4マス以内の2人を数えられない');
  assert.deepEqual(JSON.parse(w.eval('JSON.stringify(heatOf(mk(1)))')),[0]);assert.deepEqual(JSON.parse(w.eval('JSON.stringify(heatOf({...mk(2),finished:true}))')),[]);
  const bn=()=>[...d.querySelectorAll('.bn')].filter(e=>e.textContent.includes('デッドヒート')).length;
  let seen=0;const watch=async ms=>{seen=0;for(let t=0;t<ms;t+=100){seen=Math.max(seen,bn());await wait(100)}};
  const play=async st=>{w.eval('heatGoal=null');w.__st=st;w.eval('playOne({state:__st,id:"x",turn:__st.turn})');await watch(8000)};
  await play(w.eval('mk(1)'));assert.equal(seen,0,'1人だけでデッドヒートが出た');
  await play(w.eval('mk(2)'));assert.equal(seen,1,'2人が近いのにデッドヒートが出ない');assert(w.eval('heatGoal')===w.eval('curTip().state.goal'));
  w.__st=w.eval('mk(3)');w.eval('playOne({state:__st,id:"y",turn:__st.turn})');await watch(8000);assert.equal(seen,0,'同じ目的地で2回出た');
  // 1位の入れかわり：単独1位が変わったら「👑 ○○が1位に浮上！」（4手番目から・同点からは出さない）
  let tseen=[];const twatch=async ms=>{tseen=[];for(let t=0;t<ms;t+=100){const e=d.querySelector('#toast');if(e&&!e.hidden&&e.textContent.includes('1位に浮上')&&!tseen.includes(e.textContent))tseen.push(e.textContent);await wait(100)}};
  const lead=async(pre,post,turn)=>{w.__a=w.eval('mk(0)');w.__b=w.eval('mk(0)');w.__a.turn=w.__b.turn=turn;pre(w.__a);post(w.__b);w.eval('heatGoal=curTip().state.goal;dispState=__a;playOne({state:__b,id:"z"+Math.random(),turn:__b.turn})');await twatch(6000);return tseen};
  let t1=await lead(a=>a.players[0].coin=50000,b=>b.players[1].coin=50000,10);assert(t1.some(t=>t.includes('1位に浮上')&&t.includes('を逆転')),'1位が変わったのに知らせが無い：'+t1.join('/'));
  t1=await lead(a=>a.players[0].coin=50000,b=>b.players[0].coin=50000,10);assert.equal(t1.length,0,'1位が同じなのに知らせが出た');
  t1=await lead(a=>{},b=>b.players[1].coin=50000,10);assert.equal(t1.length,0,'同点からの変化で知らせが出た');
  t1=await lead(a=>a.players[0].coin=50000,b=>b.players[1].coin=50000,2);assert.equal(t1.length,0,'序盤（4手番未満）で知らせが出た');
  assert.equal(w.eval('leaderOf(null)'),-1);
  assert.deepEqual(errors,[],'エラー：'+errors.join(' / '));console.log('OK デッドヒート・1位の入れかわり');process.exit(0)}
catch(e){console.error('NG',e.message);process.exit(1)}},300);
