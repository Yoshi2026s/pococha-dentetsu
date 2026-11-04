// ラストスパート・逆転ボーナス（2026.11.05.1）：最後の8手番は目的地の賞金2倍、資産が単独最下位の人の1番乗りは1.5倍。以前の盤面（ls無し）は従来どおり（jsdom）
const {JSDOM,VirtualConsole}=require('jsdom');const fs=require('fs'),assert=require('assert');
const errors=[],vc=new VirtualConsole();vc.on('jsdomError',e=>{if(!e.message.includes('Not implemented'))errors.push(e.message)});
const s=fs.readFileSync('index.html','utf8').replace(/<script[^>]+src=[^>]+><\/script>/g,'');
const dom=new JSDOM(s,{url:'https://example.test/',runScripts:'dangerously',pretendToBeVisual:true,virtualConsole:vc,beforeParse(w){w.matchMedia=()=>({matches:true,addEventListener(){},removeEventListener(){}});w.HTMLCanvasElement.prototype.getContext=()=>new Proxy({},{get:()=>()=>{}});w.SVGElement.prototype.getScreenCTM=()=>({a:1,b:0,c:0,d:1,e:0,f:0});w.SVGElement.prototype.getBBox=()=>({x:0,y:0,width:100,height:100});w.Element.prototype.animate=()=>({cancel(){},finished:Promise.resolve()});}});
const wait=ms=>new Promise(r=>setTimeout(r,ms));
setTimeout(async()=>{const w=dom.window,d=w.document;try{
  d.querySelector('#bCreate').click();await wait(150);d.querySelector('#bStart').click();await wait(400);
  assert.equal(w.eval('genesisState("ABCDEFGHIJKL",1).ls'),1,'新しい盤面にラストスパートの印(ls=1)が無い');
  // 目的地の隣から目的地へ進む手番を、条件を変えて計算し、表示した賞金を返す
  w.eval(`window.goalRun=(mod,ls)=>{const base=curTip().state;for(let tr=0;tr<40;tr++){const st=JSON.parse(JSON.stringify(base)),seat=curSeat(st);
    const g=st.goal;st.players[seat].pos=ADJ[g][tr%ADJ[g].length];st.rng=tr*5;mod(st,seat);if(ls)st.ls=1;else delete st.ls;
    try{const s1=applyTurn(st,{type:'roll',route:[g],buy:false,reward:'coin',shopDone:true},meta.seed,{noForce:true});const ge=(s1.ev||[]).find(e=>e.k==='goal');if(!ge)continue;
      return {prize:+(ge.t.match(/＋([\\d,]+)G/)||[])[1].replace(/,/g,''),gx:((s1.ev||[]).find(e=>e.k==='goalx')||{}).v||null,t:ge.t,tr}}catch(e){}}return null}`);
  const near=(a,b,r)=>Math.abs(a*r-b)<=100;
  // ふつうの時間（全員同じ資産）：倍率なし
  const n1=w.eval('JSON.stringify(goalRun(()=>{},1))'),n0=w.eval('JSON.stringify(goalRun(()=>{},0))');const N1=JSON.parse(n1),N0=JSON.parse(n0);
  assert(N1&&N0,'目的地に止まる手番を作れない');assert.equal(N1.prize,N0.prize,'ふつうの時間で賞金が変わった');assert.equal(N1.gx,null,'ふつうの時間に倍率が付いた');
  // ラストスパート：2倍
  const ls=JSON.parse(w.eval('JSON.stringify(goalRun(st=>{st.turn=st.maxTurn-5},1))')),ls0=JSON.parse(w.eval('JSON.stringify(goalRun(st=>{st.turn=st.maxTurn-5},0))'));
  assert(near(ls0.prize,ls.prize,2),`ラストスパートで2倍になっていない ${ls0.prize}→${ls.prize}`);assert.deepEqual(ls.gx,['🔥 ラストスパート×2']);assert(/（ラストスパート×2）/.test(ls.t),'記録の文に倍率が無い：'+ls.t);
  assert.equal(ls0.gx,null,'以前の盤面に倍率が付いた');
  // ラストスパートの1手番前（残り9手番）は対象外
  const pre=JSON.parse(w.eval('JSON.stringify(goalRun(st=>{st.turn=st.maxTurn-9},1))'));assert.equal(pre.gx,null,'残り9手番で倍率が付いた');
  // 逆転ボーナス：単独最下位は1.5倍、同率最下位は対象外
  const cb=JSON.parse(w.eval('JSON.stringify(goalRun((st,seat)=>{st.players.forEach((q,i)=>{if(i!==seat)q.coin=20000})},1))'));
  assert(near(N0.prize,cb.prize,1.5),`逆転ボーナスで1.5倍になっていない ${N0.prize}→${cb.prize}`);assert.deepEqual(cb.gx,['⤴️ 逆転ボーナス×1.5']);
  const tie=JSON.parse(w.eval('JSON.stringify(goalRun((st,seat)=>{st.players.forEach((q,i)=>{if(i!==seat)q.coin=i===(seat+1)%4?10000:20000})},1))'));assert.equal(tie.gx,null,'同率最下位に逆転ボーナスが付いた');
  const both=JSON.parse(w.eval('JSON.stringify(goalRun((st,seat)=>{st.turn=st.maxTurn-3;st.players.forEach((q,i)=>{if(i!==seat)q.coin=20000})},1))'));
  assert.equal(both.gx.length,2,'両方の倍率が付いていない');assert(both.prize>=N0.prize*3-200,'両方で3倍になっていない');
  // 知らせ：残り8手番になった手番で1回だけ。以前の盤面では出ない
  const ann=JSON.parse(w.eval(`JSON.stringify((()=>{const st=JSON.parse(JSON.stringify(curTip().state));st.turn=st.maxTurn-9;const run=x=>{for(let r=0;r<30;r++){try{const y=JSON.parse(JSON.stringify(x));y.rng=r*7;return applyTurn(y,{type:'roll',buy:false,reward:'coin',shopDone:true},meta.seed,{noForce:true})}catch(e){}}};
    const a=run(st),b=run(a),o=JSON.parse(JSON.stringify(st));delete o.ls;const c=run(o);const f=x=>(x.ev||[]).filter(e=>e.k==='laststretch').map(e=>e.t);return{a:f(a),b:f(b),c:f(c),lsA:a.lsA,on:lsOn(a),on0:lsOn(st)}})())`));
  assert.deepEqual(ann.a,['🔥 ラストスパート！ 残り8手番は目的地の賞金が2倍'],'残り8手番の知らせが無い');assert.deepEqual(ann.b,[],'知らせが2回出た');assert.deepEqual(ann.c,[],'以前の盤面で知らせが出た');
  assert.equal(ann.lsA,1);assert.equal(ann.on,true);assert.equal(ann.on0,false);
  assert.equal(w.eval('lsOn({ls:1,maxTurn:0,turn:5,finished:false})'),false,'無制限モードでラストスパートになった');
  // 手番の表示：ラストスパート中だけ「🔥賞金×2」
  w.eval('window._st=JSON.parse(JSON.stringify(curTip().state));drawTurnBar(_st,curSeat(_st))');assert(!d.querySelector('#turnBar .tb-ls'),'ふつうの時間に賞金×2が出た');
  w.eval('_st.turn=_st.maxTurn-4;drawTurnBar(_st,curSeat(_st))');const tl=d.querySelector('#turnBar .tb-ls');assert(tl&&tl.textContent==='🔥賞金×2','ラストスパート中に賞金×2が出ない');
  w.eval('const T=curTip().state;T.turn=T.maxTurn-4;dispState=T;render()');const sl=d.querySelector('.sh-goal .tb-ls');assert(sl&&sl.textContent==='🔥×2','上の目的地の欄に🔥×2が出ない');
  // 1番乗りの回数と「1番乗り王」
  const gl=JSON.parse(w.eval(`JSON.stringify((()=>{for(let tr=0;tr<40;tr++){const st=JSON.parse(JSON.stringify(curTip().state)),seat=curSeat(st),g=st.goal;st.players[seat].pos=ADJ[g][tr%ADJ[g].length];st.rng=tr*5;try{const s1=applyTurn(st,{type:'roll',route:[g],buy:false,reward:'coin',shopDone:true},meta.seed,{noForce:true});if((s1.ev||[]).some(e=>e.k==='goal'))return{seat,gl:s1.players[seat].gl,aw:awards(s1)}}catch(e){}}return null})())`));
  assert.equal(gl.gl,1,'1番乗りの回数が数えられていない');assert(gl.aw.includes('1番乗り王')&&gl.aw.includes('1回'),'1番乗り王が出ない');
  assert(!w.eval('(()=>{const st=JSON.parse(JSON.stringify(curTip().state));delete st.ls;return awards(st)})()').includes('1番乗り王'),'以前の盤面に1番乗り王が出た');
  // 遊び方に説明がある
  assert(w.eval('HOW.some(h=>h[1].some(t=>t.includes("ラストスパート")&&t.includes("逆転ボーナス")))'),'遊び方に説明が無い');
  assert.deepEqual(errors,[],'エラー：'+errors.join(' / '));
  console.log('OK ラストスパート・逆転ボーナス',JSON.stringify({normal:N0.prize,ls:ls.prize,cb:cb.prize,both:both.prize}));process.exit(0)}
catch(e){console.error('NG',e.message);process.exit(1)}},300);
