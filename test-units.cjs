// 数字の単位と呼び名（2026-10-29）：応援ポイント→ゴールド（G）、コアファン→物件（件）、エール→コアファン（人）（jsdom・端末内モード）
// 1) コアファン（旧エール）の人数の書き方：内部の値1＝1,000人、10以上は「万人」
// 2) プレイヤー欄の単位：ゴールドは「G」、物件は「🏠◯件」、コアファンは「💖◯千人／万人」
// 3) 画面とログに古い呼び名（エール・応援ポイント・♥）が残っていない（リスナーコメントの文面は除く）
const {JSDOM,VirtualConsole}=require('jsdom');const fs=require('fs'),assert=require('assert');
const errors=[],vc=new VirtualConsole();vc.on('jsdomError',e=>{if(!e.message.includes('Not implemented'))errors.push(e.message)});
const html=fs.readFileSync('index.html','utf8'),s=html.replace(/<script[^>]+src=[^>]+><\/script>/g,'');
const dom=new JSDOM(s,{url:'https://example.test/',runScripts:'dangerously',pretendToBeVisual:true,virtualConsole:vc,beforeParse(w){w.matchMedia=()=>({matches:true,addEventListener(){},removeEventListener(){}});w.HTMLCanvasElement.prototype.getContext=()=>new Proxy({},{get:()=>()=>{}});w.SVGElement.prototype.getScreenCTM=()=>({a:1,b:0,c:0,d:1,e:0,f:0});w.SVGElement.prototype.getBBox=()=>({x:0,y:0,width:100,height:100});w.Element.prototype.animate=()=>({cancel(){},finished:Promise.resolve()});}});
const wait=ms=>new Promise(r=>setTimeout(r,ms));
setTimeout(async()=>{const w=dom.window,d=w.document,E=x=>w.eval(x);try{
  // 1) 人数の書き方
  assert.deepEqual([E('kp(0)'),E('kp(2)'),E('kp(4.5)'),E('kp(10)'),E('kp(25)'),E('kp(1200)')],['0人','2人','4.5人','10人','25人','1,200人']);
  // 2) プレイヤー欄
  d.querySelector('#bCreate').click();await wait(150);d.querySelector('#bStart').click();await wait(400);
  if(d.querySelector('#vGame').hidden)throw Error('ゲーム開始失敗');
  E('const p=dispState.players[0];p.ye=25;render()');await wait(50);
  const row=d.querySelector('#status .pl-l2');assert(row,'プレイヤー欄がない');
  assert(/^[\d,.万億−]+G$/.test(row.querySelector('.pl-coin').textContent.trim()),'ゴールドの単位：'+row.querySelector('.pl-coin').textContent);
  assert(/^🏠\d+件$/.test(row.querySelector('.pl-fan').textContent.trim()),'物件の単位：'+row.querySelector('.pl-fan').textContent);
  assert.equal(d.querySelector('#status .pl-ye').textContent.trim(),'💖25人','コアファンの単位');
  assert.equal(d.querySelector('#status .pl-tot small').textContent,'総G','総資産の呼び名');assert(html.includes(".pl-tot b::after{content:'G'}"),'総Gの単位');
  assert.equal(E('assets(dispState,0)'),E('dispState.players[0].coin+Object.keys(dispState.owner).reduce((a,k)=>a+dispState.owner[k].reduce((b,x,j)=>b+(x===0?NODES[k].bases[j].price:0),0),0)'),'総G＝持っているG＋物件の値段の合計');
  // 4) イベントの呼び名と説明（物件にちなむもの・基本G）
  assert.deepEqual([E('EVN.photo'),E('EVN.tour'),E('EVN.newfans'),E('CARDN.fanfes')],['物件めぐり配信','コアファンと聖地めぐり','初見さんがコアファンに','物件まつり']);
  assert(!/基本×/.test(html.slice(html.indexOf('const EVDEF='),html.indexOf('const XEV='))),'イベント説明に「基本×」が残っている');
  assert.equal(E('MISQ.yell'),'fans','コアファンマスの絵がコアファン（ハートと人）になっていない');
  // 3) 古い呼び名：画面（リスナーコメント欄を除く）・ヘルプ・ソース（リスナーコメントの文面を除く）
  const cm=d.querySelector('#cmts');if(cm)cm.remove();
  const vt=d.querySelector('#vGame').textContent;assert(!/エール|応援ポイント|♥|📣/.test(vt),'画面に古い呼び名：'+(vt.match(/.{0,20}(エール|応援ポイント|♥|📣).{0,20}/)||[''])[0]);
  const a=html.indexOf('const CMT_NAME='),b=html.indexOf('function comments('),src=html.slice(0,a)+html.slice(b);
  for(const k of ['エール','応援ポイント','📣']){const m=src.match(new RegExp('.{0,30}'+k+'.{0,30}'));assert(!m,'ソースに古い呼び名「'+k+'」：'+(m&&m[0]))}
  assert(!/♥(?!['’])/.test(src.replace("e.textContent='♥'",'')),'金額に♥が残っている');
  // ログの金額にGがつく
  for(const t of ['プラスマス ＋${g.toLocaleString()}G','マイナスマス −${l.toLocaleString()}G'])assert(html.includes(t),'ログの単位：'+t);
  if(errors.length)throw Error(errors.join('\n'));
  console.log('PASS 単位と呼び名（ゴールドG・物件◯件・コアファン◯人・総G・イベント名・古い呼び名なし）');dom.window.close();
}catch(e){console.error(e);dom.window.close();process.exitCode=1;}},100);
