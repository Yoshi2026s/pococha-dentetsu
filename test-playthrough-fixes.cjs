// 通しプレイ点検（2026-10-29）で見つけた不具合の回帰テスト（jsdom・端末内モード）
// 1) ゲーム終了後の上部欄が「いまの番：0P CPU」にならない
// 2) 地図が非表示（幅0）のとき fitMap が表示比率 VH を NaN にしない
// 3) 描画フレームの時刻がカメラ移動の開始より前でも、地図の viewBox が負の幅にならない
// 4) 「新しい部屋でもう一度（再招待）」の後、部屋画面に「次の対戦へ」とゲーム用の表示（ingame）が残らない
const {JSDOM,VirtualConsole}=require('jsdom');const fs=require('fs'),assert=require('assert');
const errors=[],vc=new VirtualConsole();vc.on('jsdomError',e=>{if(!e.message.includes('Not implemented'))errors.push(e.message)});
const s=fs.readFileSync('index.html','utf8').replace(/<script[^>]+src=[^>]+><\/script>/g,'');
const dom=new JSDOM(s,{url:'https://example.test/',runScripts:'dangerously',pretendToBeVisual:true,virtualConsole:vc,beforeParse(w){w.matchMedia=()=>({matches:true,addEventListener(){},removeEventListener(){}});w.HTMLCanvasElement.prototype.getContext=()=>new Proxy({},{get:()=>()=>{}});w.SVGElement.prototype.getScreenCTM=()=>({a:1,b:0,c:0,d:1,e:0,f:0});w.SVGElement.prototype.getBBox=()=>({x:0,y:0,width:100,height:100});w.Element.prototype.animate=()=>({cancel(){},finished:Promise.resolve()});}});
const wait=ms=>new Promise(r=>setTimeout(r,ms));
setTimeout(async()=>{const w=dom.window,d=w.document;try{
  d.querySelector('#bCreate').click();await wait(150);d.querySelector('#bStart').click();await wait(300);
  if(d.querySelector('#vGame').hidden)throw Error('ゲーム開始失敗');

  // 2) jsdomでは要素の幅が0なので、地図非表示と同じ状態になる
  w.eval('VH=560;fitMap()');assert(Number.isFinite(w.eval('VH')),'幅0の地図でVHがNaNになった');

  // 3) 最初のフレーム時刻を開始時刻の1秒前にする（重い処理の直後にカメラ移動したときと同じ）
  const raf=w.requestAnimationFrame;let first=true;
  w.requestAnimationFrame=f=>raf.call(w,t=>{const now=first?w.performance.now()-1000:t;first=false;f(now)});
  w.eval('setVB([100,2800,300,300]);tween([300,3000,100,100],60)');
  const seen=[];for(let i=0;i<10;i++){seen.push(w.eval('vb.slice()'));await wait(20)}w.requestAnimationFrame=raf;
  assert(seen.every(v=>v[2]>0&&v[3]>0),'viewBoxが負の幅になった：'+JSON.stringify(seen.find(v=>!(v[2]>0&&v[3]>0))));

  // 1) 最終手番の盤面を終了扱いにして描画
  w.eval('dispState=null;for(const r of records.values())r.state.finished=true;render()');
  const head=d.querySelector('#status .st-head').textContent;
  assert(!/0P/.test(head)&&head.includes('ゲーム終了'),'終了後の上部欄：'+head);

  // 4) 再招待
  await w.eval('rematch()');await wait(300);
  assert(!d.querySelector('#vRoom').hidden,'再招待後に部屋画面が出ない');
  assert(!d.querySelector('#nextBox'),'再招待した本人の部屋画面に「次の対戦へ」が残った');
  assert(!d.body.classList.contains('ingame'),'再招待後の部屋画面にingameが残った');
  d.querySelector('#bStart').click();await wait(300);if(d.querySelector('#vGame').hidden)throw Error('再招待後の開始失敗');
  if(errors.length)throw Error(errors.join('\n'));
  console.log('PASS 通しプレイ点検4項目（終了後の手番表示・非表示地図のVH・カメラ移動の範囲・再招待後の表示）');dom.window.close();
}catch(e){console.error(e);dom.window.close();process.exitCode=1;}},100);
