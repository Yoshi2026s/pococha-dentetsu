// リスナーコメント（2026-10-29、2026-10-31に表示位置を変更）：場面ごとのコメント・順位欄の見出しの右に1件ずつ・少しずつずらして表示・約6秒で消える（jsdom・端末内モード）
const {JSDOM,VirtualConsole}=require('jsdom');const fs=require('fs'),assert=require('assert');
const errors=[],vc=new VirtualConsole();vc.on('jsdomError',e=>{if(!e.message.includes('Not implemented'))errors.push(e.message)});
const html=fs.readFileSync('index.html','utf8'),s=html.replace(/<script[^>]+src=[^>]+><\/script>/g,'');
const dom=new JSDOM(s,{url:'https://example.test/',runScripts:'dangerously',pretendToBeVisual:true,virtualConsole:vc,beforeParse(w){w.matchMedia=()=>({matches:true,addEventListener(){},removeEventListener(){}});w.HTMLCanvasElement.prototype.getContext=()=>new Proxy({},{get:()=>()=>{}});w.SVGElement.prototype.getScreenCTM=()=>({a:1,b:0,c:0,d:1,e:0,f:0});w.SVGElement.prototype.getBBox=()=>({x:0,y:0,width:100,height:100});w.Element.prototype.animate=()=>({cancel(){},finished:Promise.resolve()});}});
const wait=ms=>new Promise(r=>setTimeout(r,ms));
setTimeout(async()=>{const w=dom.window,d=w.document,E=c=>w.eval(c);try{
  d.querySelector('#bCreate').click();await wait(150);d.querySelector('#bStart').click();await wait(400);
  // 種類とバリエーション
  const kinds=E('Object.keys(CMT)'),total=E('Object.values(CMT).reduce((a,b)=>a+b.length,0)');
  for(const k of ['plus','minus','yell','card','rare','event','bad','buy','mono','goal','troll','rankup','rankdown','settle','mission','shop','air','sea','golden','night','morning','storm','rain','sunny','bigdice','smalldice','myturn','sell','final','meter','liver'])assert(kinds.includes(k),'場面がない：'+k);
  assert(total>=500,'コメントの数が少ない：'+total);assert(E('CMT_NAME.length')>=80,'リスナー名が少ない');assert(E('new Set(CMT_NAME).size===CMT_NAME.length'),'リスナー名が重複');
  for(const k of kinds)assert(E(`new Set(CMT["${k}"]).size===CMT["${k}"].length`),'同じ場面に同じ文が重複：'+k);
  // Pocochaらしい言葉が入っている
  const all=E('Object.values(CMT).flat().join("／")');for(const w of ['ライバー','リスナー','枠','ランクメーター','時間ダイヤ','イベントポイント','いいね'])assert(all.includes(w),'Pocochaの言葉がない：'+w);
  // 2026-10-31：上の順位欄の見出しの右側に1件ずつ（地図には出さない）
  assert(/#cmts\.cmts-top\{position:fixed;/.test(html),'表示位置の指定が順位欄の見出しではない');
  // 少しずつずらして1件ずつ出る・最後の1件は約6秒で消える
  E('window.__origC=comments;comments=(k,n)=>/^(__|minus$|good$)/.test(k)?__origC(k,n):null;/* 進行中の対戦のコメントは止めて、試験のコメントだけ数える */cmtQ.length=0;clearTimeout(cmtT);cmtT=0;cmtLast=0;SET.fast=false;CMT.__test=["試験A","試験B","試験C"];window.__t=[];new MutationObserver(ms=>ms.forEach(m=>m.addedNodes.forEach(n=>{if(n.classList&&n.classList.contains("cmt")&&/試験/.test(n.textContent))window.__t.push(performance.now())}))).observe(document.body,{subtree:true,childList:true});comments("__test",3)');
  await wait(100);assert.equal(E('window.__t.length'),1,'最初の1件');assert.equal(d.querySelector('#cmts').parentNode,d.body,'コメント欄が順位欄の上（body直下）にない');assert(!d.querySelector('#mapbox #cmts'),'コメントが地図の中にある');
  await wait(4400);const t=E('window.__t');assert.equal(t.length,3,'3件出ない：'+t.length);assert(t[1]-t[0]>=1000&&t[2]-t[1]>=1000,'1件ずつ間をあけて出ていない');
  assert.equal(d.querySelectorAll('#cmts .cmt').length,1,'同時に2件以上出ている');
  const last=d.querySelector('#cmts .cmt');await wait(3800);assert(last.isConnected,'6秒より前に消えた');await wait(2400);assert(!last.isConnected,'約6秒で消えない');
  assert(/cmtout \.6s ease-in 5\.6s/.test(html),'フェードアウトの指定（5.6秒から0.6秒）');
  // 場面に合ったコメント：マイナスマスならマイナス用の文から選ばれる
  E('document.querySelector("#cmts").innerHTML="";comments("minus",1)');await wait(30);const txt=[...d.querySelectorAll('#cmts .cmt')].pop().childNodes[1].textContent.trim();assert(E('CMT.minus').includes(txt),'場面に合わない：'+txt);
  // たくさん来ても同時に出るのは1件だけ（待ちは最大5件）
  E('comments("good",8)');let mx=0;for(let i=0;i<20;i++){await wait(200);mx=Math.max(mx,d.querySelectorAll('#cmts .cmt').length)}assert(mx<=1,'同時に2件以上：'+mx);assert(E('cmtQ.length')<=5,'待ちが多すぎる');
  if(errors.length)throw Error(errors.join('\n'));
  console.log(`PASS リスナーコメント（${kinds.length}場面・${total}種類・順位欄の見出しの右・1件ずつ・ずらして表示・約6秒で消える）`);dom.window.close();
}catch(e){console.error(e);dom.window.close();process.exitCode=1;}},100);
