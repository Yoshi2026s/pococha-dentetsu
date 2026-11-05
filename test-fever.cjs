// ご当地フィーバー駅（2026.11.05.10）：目的地の近く（2〜10マス・いちばん近い人から2〜8マス）の1駅。最初に止まった人に基本ゴールド×3・コアファン＋3人・＋10pt、止まられる・6時間ごと・目的地が変わると移る。以前の盤面は従来どおり（jsdom）
const {JSDOM,VirtualConsole}=require('jsdom');const fs=require('fs'),assert=require('assert');
const errors=[],vc=new VirtualConsole();vc.on('jsdomError',e=>{if(!e.message.includes('Not implemented'))errors.push(e.message)});
const s=fs.readFileSync('index.html','utf8').replace(/<script[^>]+src=[^>]+><\/script>/g,'');
const dom=new JSDOM(s,{url:'https://example.test/',runScripts:'dangerously',pretendToBeVisual:true,virtualConsole:vc,beforeParse(w){w.matchMedia=()=>({matches:true,addEventListener(){},removeEventListener(){}});w.HTMLCanvasElement.prototype.getContext=()=>new Proxy({},{get:()=>()=>{}});w.SVGElement.prototype.getScreenCTM=()=>({a:1,b:0,c:0,d:1,e:0,f:0});w.SVGElement.prototype.getBBox=()=>({x:0,y:0,width:100,height:100});w.Element.prototype.animate=()=>({cancel(){},finished:Promise.resolve()});}});
const wait=ms=>new Promise(r=>setTimeout(r,ms));
setTimeout(async()=>{const w=dom.window,d=w.document;try{
  d.querySelector('#bCreate').click();await wait(150);d.querySelector('#bStart').click();await wait(400);
  const g=JSON.parse(w.eval(`JSON.stringify((()=>{const o=[];for(let i=0;i<40;i++){const s=genesisState('FV'+i,2);o.push([s.fv,D(s.goal)[s.fever],NODES[s.fever].type])}return o})())`));
  assert(g.every(([fv,dd,ty])=>fv===1&&dd>=2&&dd<=12&&ty==="station"),'フィーバー駅が目的地から2〜12マスの駅でない：'+JSON.stringify(g.slice(0,5)));
  // フィーバー駅の隣から1マス進んで止まる
  w.eval(`window.run=(fv)=>{const base=JSON.parse(JSON.stringify(curTip().state));for(let tr=0;tr<60;tr++){const st=JSON.parse(JSON.stringify(base)),seat=curSeat(st),f=st.fever;if(!fv){delete st.fv}st.players[seat].pos=ADJ[f][tr%ADJ[f].length];st.rng=tr*5;
    try{const s1=applyTurn(st,{type:'roll',route:[f],buy:false,reward:'coin',shopDone:true},meta.seed,{noForce:true});if(s1.players[seat].pos!==f)continue;return{f,s1,st,seat}}catch(e){}}return null}`);
  const r=JSON.parse(w.eval(`(()=>{const x=run(1),y=run(0);const ev=x.s1.ev.find(e=>e.k==='fever');return JSON.stringify({ev:ev&&ev.t,moved:x.s1.fever!==x.f,nf:D(x.s1.goal)[x.s1.fever],ye:x.s1.players[x.seat].ye-x.st.players[x.seat].ye,old:y?(y.s1.ev||[]).some(e=>/^fever/.test(e.k)):false,dcoin:x.s1.players[x.seat].coin-y.s1.players[x.seat].coin,B:BASEPT[x.st.players[x.seat].rank]})})()`));
  assert(r.ev&&/ご当地フィーバー！.*＋[\d,]+G・コアファン＋3人・＋10pt/.test(r.ev),'フィーバーのできごとが無い：'+r.ev);assert(r.moved,'止まったあとフィーバー駅が移らない');assert(r.ye>=3,'コアファンが増えない');
  assert(!r.old,'以前の盤面にフィーバーが起きた');assert(r.dcoin>=r.B*3-100,`ゴールドが基本×3増えていない ${r.dcoin}`);
  // 6時間ごと・目的地が変わると移る
  const mv=JSON.parse(w.eval(`JSON.stringify((()=>{const s=JSON.parse(JSON.stringify(curTip().state));const f0=s.fever;let n=0;blockEnd(s,()=>rand('X',n++));const a=s.fever,ea=s.ev.some(e=>e.k==='fevermove');const t=JSON.parse(JSON.stringify(curTip().state));delete t.fv;t.fever=null;t.ev=[];blockEnd(t,()=>rand('X',n++));return{ea,a:a!=null,old:t.fever}})())`));
  assert(mv.ea&&mv.a,'6時間ごとに移らない');assert.equal(mv.old,null,'以前の盤面でフィーバー駅が作られた');
  // CPUはフィーバー駅を高く見る
  assert(w.eval('(()=>{const s=curTip().state,seat=curSeat(s),a=landValue(s,seat,s.fever),o=JSON.parse(JSON.stringify(s));delete o.fv;return a>landValue(o,seat,s.fever)})()'),'CPUがフィーバー駅を高く見ない');
  // 地図の目印・遊び方
  w.eval('drawPawns(curTip().state)');assert(d.querySelector('#goalMark .fevermark'),'地図にフィーバー駅の目印が無い');
  assert(w.eval('HOW.some(h=>h[1].some(t=>t.includes("ご当地フィーバー駅")))'),'遊び方に説明が無い');
  // CPUだけで1日の対戦を最後まで（エラーなし）
  const n=await w.eval(`(async()=>{let c=0;for(const sx of ['','b']){let st=genesisState(meta.seed.slice(0,11)+sx,1);const S=meta.seed;meta.seed=meta.seed.slice(0,11)+sx;while(!st.finished){st=applyTurn(st,await cpuDecide(st),meta.seed);c+=(st.ev||[]).filter(e=>e.k==='fever').length}meta.seed=S}return c})()`);
  /* 止まる回数はCPUの乱数しだいなので条件にしない（止まったときの動きは上で確かめた） */
  assert.deepEqual(errors,[],'エラー：'+errors.join(' / '));console.log('OK ご当地フィーバー駅（CPU 1日×2回で '+n+'回）');process.exit(0)}
catch(e){console.error('NG',e.message);process.exit(1)}},300);
