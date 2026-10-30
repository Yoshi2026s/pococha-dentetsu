// 目的地の賞金（2026-10-30 修正）：目的地に止まったとき、表示した賞金が所持金と総収入に入ることを確かめる（jsdom）
const {JSDOM,VirtualConsole}=require('jsdom');const fs=require('fs'),assert=require('assert');
const errors=[],vc=new VirtualConsole();vc.on('jsdomError',e=>{if(!e.message.includes('Not implemented'))errors.push(e.message)});
const s=fs.readFileSync('index.html','utf8').replace(/<script[^>]+src=[^>]+><\/script>/g,'');
const dom=new JSDOM(s,{url:'https://example.test/',runScripts:'dangerously',pretendToBeVisual:true,virtualConsole:vc,beforeParse(w){w.matchMedia=()=>({matches:true,addEventListener(){},removeEventListener(){}});w.HTMLCanvasElement.prototype.getContext=()=>new Proxy({},{get:()=>()=>{}});w.SVGElement.prototype.getScreenCTM=()=>({a:1,b:0,c:0,d:1,e:0,f:0});w.SVGElement.prototype.getBBox=()=>({x:0,y:0,width:100,height:100});w.Element.prototype.animate=()=>({cancel(){},finished:Promise.resolve()});}});
const wait=ms=>new Promise(r=>setTimeout(r,ms));
setTimeout(async()=>{const w=dom.window,d=w.document;try{
  d.querySelector('#bCreate').click();await wait(150);d.querySelector('#bStart').click();await wait(400);
  // 目的地の1マス手前から目的地へ進む同じ手番を、賞金の印(gp)ありと無し（以前の盤面）で計算して、所持金の差を返す
  w.eval(`window.goalRun=()=>{const base=curTip().state;for(let tr=0;tr<40;tr++){const st=JSON.parse(JSON.stringify(base)),seat=curSeat(st);
    const g=st.goal;st.players[seat].pos=ADJ[g][tr%ADJ[g].length];st.rng=tr*5;const run=gp=>{const x=JSON.parse(JSON.stringify(st));if(gp)x.gp=1;else delete x.gp;return applyTurn(x,{type:'roll',route:[g],buy:false,reward:'coin',shopDone:true},meta.seed,{noForce:true})};
    try{const s1=run(1),s0=run(0);const ge=(s1.ev||[]).find(e=>e.k==='goal');if(!ge)continue;
      const prize=+(ge.t.match(/＋([\\d,]+)G/)||[])[1].replace(/,/g,'');const p1=s1.players[seat],p0=s0.players[seat];
      return {prize,dc:p1.coin-p0.coin,de:p1.earned-p0.earned,newGoal:s1.goal!==g,goal0:(s0.ev||[]).some(e=>e.k==='goal'),gp1:s1.gp}}catch(e){}}return null}`);
  assert.equal(w.eval('genesisState("ABCDEFGHIJKL",1).gp'),1,'新しい盤面に賞金の印(gp=1)が無い');
  const a=w.eval('goalRun()');assert(a,'目的地に止まる手番を作れない');assert(a.prize>0,'賞金が0');assert(a.newGoal,'次の目的地に変わっていない');assert.equal(a.gp1,1,'手番のあと印が消えた');
  assert.equal(a.dc,a.prize,`賞金が所持金に入っていない（賞金${a.prize}・差${a.dc}）`);assert.equal(a.de,a.prize,'賞金が総収入(earned)に入っていない');
  // 以前の盤面（印なし）も目的地のイベント自体は起きる（賞金の加算だけが従来どおり無い＝途中のゲームの検算がずれない）
  assert(a.goal0,'以前の盤面で目的地のイベントが起きない');
  if(errors.length)throw Error(errors.join('\n'));
  console.log(`PASS 目的地の賞金（新しい盤面は所持金・総収入に＋${a.prize.toLocaleString()}G／以前の盤面は検算が合うよう従来どおり）`);dom.window.close();
}catch(e){console.error(e);dom.window.close();process.exitCode=1;}},100);
