// オンライン手番の重複防止と先読み（2026-10-29）：jsdom上で通信部分を置きかえて確認する
// 1) 部屋情報（revision）だけ先に届き、盤面の記録がまだのときに、同じ手番で「あなたの番」がもう一度始まらない
// 2) 参加者の先読み：送信と同時に結果の記録が手元に入り、サーバーの同じ記録が届いても演出を2回しない
// 3) サーバーの記録が先読みと違えば、表示をサーバーの盤面に直す
const {JSDOM,VirtualConsole}=require('jsdom');const fs=require('fs'),assert=require('assert');
const errors=[],vc=new VirtualConsole();vc.on('jsdomError',e=>{if(!e.message.includes('Not implemented'))errors.push(e.message)});
const s=fs.readFileSync('index.html','utf8').replace(/<script[^>]+src=[^>]+><\/script>/g,'');
const dom=new JSDOM(s,{url:'https://example.test/',runScripts:'dangerously',pretendToBeVisual:true,virtualConsole:vc,beforeParse(w){w.matchMedia=()=>({matches:true,addEventListener(){},removeEventListener(){}});w.HTMLCanvasElement.prototype.getContext=()=>new Proxy({},{get:()=>()=>{}});w.SVGElement.prototype.getScreenCTM=()=>({a:1,b:0,c:0,d:1,e:0,f:0});w.SVGElement.prototype.getBBox=()=>({x:0,y:0,width:100,height:100});w.Element.prototype.animate=()=>({cancel(){},finished:Promise.resolve()});}});
const wait=ms=>new Promise(r=>setTimeout(r,ms));
setTimeout(async()=>{const w=dom.window,d=w.document,E=c=>w.eval(c);try{
  d.querySelector('#bCreate').click();await wait(150);d.querySelector('#bStart').click();await wait(400);
  // 参加者（ホストではない）のオンライン状態にする。通信は記録するだけの置きかえ
  E(`window.__sent=[];window.__dec=0;window.__play=0;SET.fast=true;
    db=Object.assign({},db,{online:{submit:async(c,tip,seat,a)=>{window.__sent.push(tip.turn)},commit:async()=>false}});
    meta.host='HOST';meta.cpu=[];meta.cpuTimeoutSec=90;meta.turnAt={toMillis:()=>Date.now()};peers=[{id:'HOST',presence:{seat:1}}];
    {const M=myDecide;myDecide=function(st){window.__dec++;const p=M.apply(this,arguments);setTimeout(()=>{if(pending&&pending.res){const r=pending.res;pending=null;r({type:'roll',auto:true,buy:false,reward:'coin',shopDone:true})}},30);return p}}
    {const P=playOne;playOne=function(){window.__play++;return P.apply(this,arguments)}}`);
  const toMyTurn=()=>E(`(()=>{const t=curTip();t.state.order=[mySeat(),...[0,1,2,3].filter(i=>i!==mySeat())];t.state.oi=0;dispState=t.state;animN=0;animIdleAt=0;return t.id})()`);
  // ---- 1) 先読みなし（seedなし）で、部屋情報だけ先に進んだ場合
  E('meta.seed=null');const tip0=toMyTurn();E('tick()');await wait(200);
  assert.equal(E('window.__dec'),1,'自分の番が始まらない');assert.deepEqual(E('window.__sent'),[0],'送信されない');
  E('meta.revision=1;metaWait=metaWait.filter(f=>!f())');await wait(100);E('animN=0;animIdleAt=0;tick()');await wait(200);
  assert.equal(E('window.__dec'),1,'部屋情報だけ届いた時点で、同じ手番の「あなたの番」がもう一度始まった');assert.equal(E('window.__sent.length'),1,'同じ手番を2回送信した');
  // サーバーの記録が届けば待ちは終わる（10秒の時間切れを待たない）
  E(`(()=>{const t=curTip(),st=applyTurn(t.state,{type:'roll',auto:true,buy:false,reward:'coin',shopDone:true},'ABCDEFGHIJKL');records.set(st.turn+'-1',{id:st.turn+'-1',turn:st.turn,grant:1,parent:t.id,by:'x',action:{},state:JSON.parse(JSON.stringify(st)),rulesVersion:RULES_VERSION});onRecords()})()`);
  await wait(100);assert.equal(E('busy'),false,'記録が届いても確定待ちが終わらない');
  // ---- 2) 先読みあり
  E(`meta.seed='SEEDSEEDSEED';meta.revision=curTip().turn;window.__sent=[];window.__dec=0`);await wait(1500);toMyTurn();const before=E('curTip().turn');
  E('tick()');await wait(300);
  assert.equal(E('window.__sent.length'),1,'先読みありで送信されない');const pt=E('curTip()');assert(pt.pred&&pt.turn===before+1,'送信と同時に先読みの記録が入らない');
  const playsAfterPred=E('window.__play');
  E('animN=0;animIdleAt=0;tick()');await wait(200);assert.equal(E('window.__dec'),1,'先読み中に自分の番がもう一度始まった');
  // 同じ内容のサーバー記録が届く → 演出は増えない
  E(`(()=>{const t=curTip(),srv=JSON.parse(JSON.stringify({...t,pred:undefined}));delete srv.pred;confirmPred(t.id,srv);onRecords()})()`);await wait(100);
  assert(!E('curTip().pred'),'サーバー記録で先読みが置きかわらない');assert.equal(E('window.__play'),playsAfterPred,'同じ手番の演出を2回再生した');
  // ---- 3) 内容が違うサーバー記録 → 表示を直す
  E(`window.__fix=0;(()=>{const t=curTip();records.set(t.id,{...t,pred:Date.now()});shownTip=t.id;const srv=JSON.parse(JSON.stringify(t));delete srv.pred;srv.state.players[0].coin+=12345;confirmPred(t.id,srv);window.__fix=dispState.players[0].coin===srv.state.players[0].coin?1:0})()`);
  assert.equal(E('window.__fix'),1,'先読みと違うサーバー記録で表示が直らない');
  if(errors.length)throw Error(errors.join('\n'));
  console.log('PASS オンライン手番（部屋情報だけ先着でも二重操作なし・先読み・同一記録で演出1回・食い違いの修正）');dom.window.close();
}catch(e){console.error(e);dom.window.close();process.exitCode=1;}},100);
