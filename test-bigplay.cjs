// 名場面（2026.11.05.5）：1手番でいちばんゴールドが増えた場面を記録し、最終結果に出す。以前の盤面（hl無し）は記録しない（jsdom）
const {JSDOM,VirtualConsole}=require('jsdom');const fs=require('fs'),assert=require('assert');
const errors=[],vc=new VirtualConsole();vc.on('jsdomError',e=>{if(!e.message.includes('Not implemented'))errors.push(e.message)});
const s=fs.readFileSync('index.html','utf8').replace(/<script[^>]+src=[^>]+><\/script>/g,'');
const dom=new JSDOM(s,{url:'https://example.test/',runScripts:'dangerously',pretendToBeVisual:true,virtualConsole:vc,beforeParse(w){w.matchMedia=()=>({matches:true,addEventListener(){},removeEventListener(){}});w.HTMLCanvasElement.prototype.getContext=()=>new Proxy({},{get:()=>()=>{}});w.SVGElement.prototype.getScreenCTM=()=>({a:1,b:0,c:0,d:1,e:0,f:0});w.SVGElement.prototype.getBBox=()=>({x:0,y:0,width:100,height:100});w.Element.prototype.animate=()=>({cancel(){},finished:Promise.resolve()});}});
const wait=ms=>new Promise(r=>setTimeout(r,ms));
setTimeout(async()=>{const w=dom.window,d=w.document;try{
  d.querySelector('#bCreate').click();await wait(150);d.querySelector('#bStart').click();await wait(400);
  const r=JSON.parse(await w.eval(`(async()=>{const out=[];const S0=meta.seed;for(const sx of ['','b','c']){meta.seed=S0.slice(0,11)+sx;const seed=meta.seed;let st=genesisState(seed,1);let best=0,bt=null;
    while(!st.finished){const a=await cpuDecide(st);const seat=curSeat(st),c0=st.players[seat].coin;const s1=applyTurn(st,a,seed);
      const g=s1.players[seat].coin-c0;/* 0:00決算の分は除いて比べる（決算の前に記録する） */if(!s1.ev.some(e=>e.k==='monthend')&&g>best){best=g;bt=st.turn}st=s1}
    out.push({big:st.big,best,bt,html:bigPlay(st),oldHtml:bigPlay(Object.assign({},st,{big:null}))})}meta.seed=S0;return JSON.stringify(out)})()`));
  for(const x of r){assert(x.big&&x.big.g>0,'名場面が記録されていない');assert(x.big.g>=x.best,`名場面がいちばん大きい手番でない ${x.big.g}<${x.best}`);
    assert(x.big.t&&!/undefined|null/.test(x.big.t),'名場面の説明がおかしい：'+x.big.t);assert(x.html.includes('🎬 名場面')&&x.html.includes(x.big.g.toLocaleString()),'最終結果に名場面が出ない');
    assert.equal(x.oldHtml,'','記録の無い盤面に名場面が出た')}
  assert.equal(w.eval('genesisState("ABCDEFGHIJKL",1).hl'),1);
  // 以前の盤面（hl無し）では記録しない
  assert.equal(await w.eval(`(async()=>{let st=genesisState(meta.seed,1);delete st.hl;for(let i=0;i<8;i++){st=applyTurn(st,await cpuDecide(st),meta.seed)}return st.big===undefined})()`),true,'以前の盤面に名場面が記録された');
  assert.deepEqual(errors,[],'エラー：'+errors.join(' / '));console.log('OK 名場面',r.map(x=>x.big.t+' +'+x.big.g).join(' / '));process.exit(0)}
catch(e){console.error('NG',e.message);process.exit(1)}},300);
