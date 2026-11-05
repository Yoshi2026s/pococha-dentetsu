// 独占した・独占がくずれたときの演出と音（2026.11.05.7）：手番の前後で独占している駅をくらべ、それぞれ専用の帯・音を出す（jsdom）
const {JSDOM,VirtualConsole}=require('jsdom');const fs=require('fs'),assert=require('assert');
const errors=[],vc=new VirtualConsole();vc.on('jsdomError',e=>{if(!e.message.includes('Not implemented'))errors.push(e.message)});
const s=fs.readFileSync('index.html','utf8').replace(/<script[^>]+src=[^>]+><\/script>/g,'');
const dom=new JSDOM(s,{url:'https://example.test/',runScripts:'dangerously',pretendToBeVisual:true,virtualConsole:vc,beforeParse(w){w.matchMedia=()=>({matches:true,addEventListener(){},removeEventListener(){}});w.HTMLCanvasElement.prototype.getContext=()=>new Proxy({},{get:()=>()=>{}});w.SVGElement.prototype.getScreenCTM=()=>({a:1,b:0,c:0,d:1,e:0,f:0});w.SVGElement.prototype.getBBox=()=>({x:0,y:0,width:100,height:100});w.Element.prototype.animate=()=>({cancel(){},finished:Promise.resolve()});}});
const wait=ms=>new Promise(r=>setTimeout(r,ms));
setTimeout(async()=>{const w=dom.window,d=w.document;try{
  d.querySelector('#bCreate').click();await wait(150);d.querySelector('#bStart').click();await wait(400);w.eval('SET.fast=true');
  assert.equal(w.eval("typeof SE.monoGet+typeof SE.monoLost"),'functionfunction','独占の音が無い');
  // 物件が2つ以上ある駅を1人で持つ盤面
  w.eval(`window.mk=own=>{const st=JSON.parse(JSON.stringify(curTip().state)),k=NODES.findIndex(n=>n.type==='station'&&n.bases&&n.bases.length>=2);st.owner={};if(own!=null)st.owner[k]=NODES[k].bases.map((_,j)=>j===0?own:1);st.ev=[];st.lastSeat=curSeat(st);st.lastPath=[];window.__k=k;return st};window.mono=own=>{const s=mk(own);s.owner[__k]=NODES[__k].bases.map(()=>own);return s}`);
  const mc=JSON.parse(w.eval('JSON.stringify([monoChange(mk(0),mono(1)),monoChange(mono(1),mk(0)),monoChange(mono(1),mono(1)),monoChange(mono(0),mono(2))])'));
  assert.deepEqual(mc[0],{gain:[[1,w.eval('__k')]],lost:[]},'独占したのを数えられない');assert.deepEqual(mc[1],{gain:[],lost:[[1,w.eval('__k')]]},'独占がくずれたのを数えられない');
  assert.deepEqual(mc[2],{gain:[],lost:[]});assert.equal(mc[3].gain[0][0],2);assert.equal(mc[3].lost[0][0],0,'横取りで独占が移ったとき、両方を数えない');
  let seen=new Set();const watch=async ms=>{seen=new Set();for(let t=0;t<ms;t+=100){d.querySelectorAll('.bn span').forEach(e=>seen.add(e.textContent));await wait(100)}};
  const play=async(a,b)=>{w.__a=a;w.__b=b;w.eval('heatGoal=curTip().state.goal;dispState=__a;playOne({state:__b,id:"m"+Math.random(),turn:__b.turn})');await watch(7000);return[...seen]};
  let r=await play(w.eval('mk(0)'),w.eval('mono(1)'));assert(r.includes('独占！')&&!r.includes('独占くずれ…'),'独占したときの帯が出ない：'+r);
  r=await play(w.eval('mono(1)'),w.eval('mk(0)'));assert(r.includes('独占くずれ…')&&!r.includes('独占！'),'独占がくずれたときの帯が出ない：'+r);
  r=await play(w.eval('mono(0)'),w.eval('mono(2)'));assert(r.includes('独占！')&&r.includes('独占くずれ…'),'独占が移ったとき両方の帯が出ない：'+r);
  r=await play(w.eval('mono(1)'),w.eval('mono(1)'));assert(!r.some(t=>t.startsWith('独占')),'変化が無いのに帯が出た');
  // 独占リーチ：「あと1件で独占」になったら知らせる
  assert.deepEqual(JSON.parse(w.eval('JSON.stringify([reachList(mk(0),1),reachList(mono(1),1),reachList(null,0)])')).map(x=>x.length),[1,0,0]);
  let ts=[];const tw=async ms=>{ts=[];for(let t=0;t<ms;t+=100){const e=d.querySelector('#toast');if(e&&!e.hidden&&e.textContent.includes('独占まであと1件')&&!ts.includes(e.textContent))ts.push(e.textContent);await wait(100)}};
  w.__a=w.eval('(()=>{const s=mk(null);return s})()');w.__b=w.eval('(()=>{const s=mk(null),n=NODES[__k].bases.length;s.owner[__k]=NODES[__k].bases.map((_,j)=>j<n-1?curSeat(s):null);return s})()');
  w.eval('dispState=__a;playOne({state:__b,id:"r1",turn:__b.turn})');await tw(5000);assert(ts.length===1,'独占リーチの知らせが無い：'+ts);
  // CPUのひとこと（2026.11.05.16）：独占をくずされたCPUはくやしがり、独占した・フィーバーに止まったCPUは喜ぶ
  let sp=[];const swatch=async ms=>{sp=[];for(let t=0;t<ms;t+=100){d.querySelectorAll('#bar .sp-bub').forEach(e=>{if(!sp.includes(e.textContent))sp.push(e.textContent)});await wait(100)}};
  const talk=async(a,b,seat)=>{w.__a=a;w.__b=b;w.eval(`__b.ev=__b.ev||[];cpuTalk(__b,__a,${seat},'')`);await swatch(4000);return sp};
  const cpuS=w.eval('(meta.cpu||[]).slice()');assert(cpuS.length>=2,'CPUの席が足りない');const [c1,c2]=cpuS;
  let t1=await talk(w.eval('mono('+c1+')'),w.eval('mono('+c2+')'),c2);
  const L=JSON.parse(w.eval(`JSON.stringify([cpuChar(${c1}).L.bad,cpuChar(${c2}).L.good,seatName(${c1}),seatName(${c2})])`));
  assert(t1.some(t=>t.includes(L[0])),'独占をくずされたCPUがくやしがらない：'+t1);assert(t1.some(t=>t.includes(L[1])),'独占したCPUが喜ばない：'+t1);
  t1=await talk(w.eval('mk(null)'),w.eval(`(()=>{const s=mk(null);s.ev=[{k:'fever',t:'',v:0}];return s})()`),c2);assert(t1.some(t=>t.includes(L[1])),'フィーバーでCPUが喜ばない：'+t1);
  // 今日足した場面のリスナーコメント（2026.11.05.15）
  assert(w.eval("['fever','monolost','heat','lead','laststretch'].every(k=>Array.isArray(CMT[k])&&CMT[k].length>=10)"),'新しい場面のコメントが無い');
  assert.deepEqual(errors,[],'エラー：'+errors.join(' / '));console.log('OK 独占の演出と音');process.exit(0)}
catch(e){console.error('NG',e.message);process.exit(1)}},300);
