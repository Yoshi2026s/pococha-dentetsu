// リスナーコメント（2026-10-29）：場面ごとのコメント・画面右上・少しずつずらして表示・約5秒で消える（jsdom・端末内モード）
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
  // 地図（MAP表示欄）の上・右下寄り（サイコロの上）に重ねて表示
  assert(/#cmts\{position:absolute;right:8px;bottom:66px;/.test(html),'表示位置が地図の上ではない');
  // 少しずつずらして出る・約5秒で消える
  // 進行中のゲームのコメントと区別するため、試験用の場面を追加して数える
  E('SET.fast=false;CMT.__test=["試験A","試験B","試験C","試験D"];window.__t=[];new MutationObserver(ms=>ms.forEach(m=>m.addedNodes.forEach(n=>{if(n.classList&&n.classList.contains("cmt")&&/試験/.test(n.textContent))window.__t.push(performance.now())}))).observe(document.body,{subtree:true,childList:true});comments("__test",3)');
  await wait(100);assert.equal(E('window.__t.length'),1,'最初の1件');assert.equal(d.querySelector('#cmts').parentNode.id,'mapbox','コメントが地図の中にない');
  await wait(2200);const t=E('window.__t');assert.equal(t.length,3,'3件出ない：'+t.length);assert(t[1]-t[0]>=300&&t[2]-t[1]>=300,'ずらして出ていない');
  const first=[...d.querySelectorAll('#cmts .cmt')].find(c=>/試験/.test(c.textContent));await wait(2600);assert(first.isConnected,'5秒より前に消えた');await wait(1600);assert(!first.isConnected,'約5秒で消えない');
  assert(/cmtout \.7s ease-in 4\.3s/.test(html),'フェードアウトの指定（4.3秒から0.7秒）');
  // 場面に合ったコメント：プラスマスならプラス用の文から選ばれる
  E('document.querySelector("#cmts").innerHTML="";comments("minus",1)');await wait(30);const txt=[...d.querySelectorAll('#cmts .cmt')].pop().childNodes[1].textContent.trim();assert(E('CMT.minus').includes(txt),'場面に合わない：'+txt);
  // 一度に出るのは最大4件
  E('comments("good",8)');let mx=0;for(let i=0;i<30;i++){await wait(200);mx=Math.max(mx,d.querySelectorAll('#cmts .cmt').length)}assert(mx<=4,'同時に4件を超えた：'+mx);
  if(errors.length)throw Error(errors.join('\n'));
  console.log(`PASS リスナーコメント（${kinds.length}場面・${total}種類・地図の上・ずらして表示・約5秒で消える）`);dom.window.close();
}catch(e){console.error(e);dom.window.close();process.exitCode=1;}},100);
