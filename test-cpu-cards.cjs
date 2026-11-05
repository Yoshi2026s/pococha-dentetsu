// CPUのカードの使いどき（2026.11.05.6）：目的地チェンジは「ライバルが目的地まで4マス以内で自分は遠い」ときにも使う。手札こうかんは相手の手札の値打ちが高いときに使う（jsdom）
const {JSDOM,VirtualConsole}=require('jsdom');const fs=require('fs'),assert=require('assert');
const errors=[],vc=new VirtualConsole();vc.on('jsdomError',e=>{if(!e.message.includes('Not implemented'))errors.push(e.message)});
const s=fs.readFileSync('index.html','utf8').replace(/<script[^>]+src=[^>]+><\/script>/g,'');
const dom=new JSDOM(s,{url:'https://example.test/',runScripts:'dangerously',pretendToBeVisual:true,virtualConsole:vc,beforeParse(w){w.matchMedia=()=>({matches:true,addEventListener(){},removeEventListener(){}});w.HTMLCanvasElement.prototype.getContext=()=>new Proxy({},{get:()=>()=>{}});w.SVGElement.prototype.getScreenCTM=()=>({a:1,b:0,c:0,d:1,e:0,f:0});w.SVGElement.prototype.getBBox=()=>({x:0,y:0,width:100,height:100});w.Element.prototype.animate=()=>({cancel(){},finished:Promise.resolve()});}});
const wait=ms=>new Promise(r=>setTimeout(r,ms));
setTimeout(async()=>{const w=dom.window,d=w.document;try{
  d.querySelector('#bCreate').click();await wait(150);d.querySelector('#bStart').click();await wait(400);
  w.eval(`window.mk=(meD,rivD,hand,rivHand)=>{const st=JSON.parse(JSON.stringify(curTip().state)),seat=curSeat(st),dg=D(st.goal),at=k=>dg.findIndex(v=>v===k);st.players.forEach((p,i)=>{p.pos=at(i===seat?meD:i===(seat+1)%4?rivD:meD+2);p.hand=i===seat?hand.slice():i===(seat+1)%4?(rivHand||[]).slice():[]});st.troll=null;return st}`);
  const dec=async st=>{w.__st=st;return JSON.parse(await w.eval('(async()=>JSON.stringify(await cpuDecideCore(__st)))()'))};
  let a=await dec(w.eval("mk(14,3,['goalchange'])"));assert.equal(a.card,'goalchange','ライバルが目的地まで3マスで自分が14マスなのに目的地チェンジを使わない：'+JSON.stringify(a));
  a=await dec(w.eval("mk(14,9,['goalchange'])"));assert.notEqual(a.card,'goalchange','ライバルが遠いのに目的地チェンジを使った');
  a=await dec(w.eval("mk(6,3,['goalchange'])"));assert.notEqual(a.card,'goalchange','自分も近いのに目的地チェンジを使った');
  a=await dec(w.eval("mk(14,30,['swaphand','local'],['linear','shinkansen'])"));assert.equal(a.card,'swaphand','相手の手札がずっと高いのに手札こうかんを使わない：'+JSON.stringify(a));
  a=await dec(w.eval("mk(14,30,['swaphand','linear','shinkansen'],['local','express'])"));assert.notEqual(a.card,'swaphand','自分の手札の方が高いのに手札こうかんを使った');
  assert.equal(w.eval("swapGain(mk(14,30,['swaphand'],['local','express','guard']),curSeat(curTip().state))"),true,'相手が2枚以上多いときに得と判断しない');
  assert.deepEqual(errors,[],'エラー：'+errors.join(' / '));console.log('OK CPUのカードの使いどき');process.exit(0)}
catch(e){console.error('NG',e.message);process.exit(1)}},300);
