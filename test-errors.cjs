// エラーの理由表示と名前入力（2026-10-30）：エラー時は日本語の理由を出す／入力中の名前を画面の更新で消さない（jsdom・端末内モード）
const {JSDOM,VirtualConsole}=require('jsdom');const fs=require('fs'),assert=require('assert');
const errors=[],vc=new VirtualConsole();vc.on('jsdomError',e=>{if(!e.message.includes('Not implemented'))errors.push(e.message)});
const s=fs.readFileSync('index.html','utf8').replace(/<script[^>]+src=[^>]+><\/script>/g,'');
const dom=new JSDOM(s,{url:'https://example.test/',runScripts:'dangerously',pretendToBeVisual:true,virtualConsole:vc,beforeParse(w){w.matchMedia=()=>({matches:true,addEventListener(){},removeEventListener(){}});w.HTMLCanvasElement.prototype.getContext=()=>new Proxy({},{get:()=>()=>{}});w.SVGElement.prototype.getScreenCTM=()=>({a:1,b:0,c:0,d:1,e:0,f:0});w.SVGElement.prototype.getBBox=()=>({x:0,y:0,width:100,height:100});w.Element.prototype.animate=()=>({cancel(){},finished:Promise.resolve()});}});
const wait=ms=>new Promise(r=>setTimeout(r,ms));
setTimeout(async()=>{const w=dom.window,d=w.document,E=c=>w.eval(c);try{
  const toastT=()=>d.querySelector('#toast').textContent;
  // 1) 理由の日本語化：通信のコード・ゲーム処理の英語の理由・日本語の理由・不明なもの
  assert(/権限がありません.*（permission-denied）/.test(E(`errReason({code:'permission-denied',message:'Missing or insufficient permissions.'})`)),'通信コードの理由');
  assert(/サーバーにつながりません/.test(E(`errReason({code:'firestore/unavailable'})`)),'前に種類の付いたコード');
  assert(/物件を売る必要があります.*（need sell）/.test(E(`errReason(new Error('need sell'))`)),'ゲーム処理の英語の理由');
  assert.equal(E(`errReason(new Error('部屋が見つかりません'))`),'部屋が見つかりません','日本語の理由はそのまま');
  assert.equal(E(`errReason(new Error('xyz broke'))`),'原因不明のエラー（xyz broke）','不明なものは原文を添える');
  assert.equal(E(`errReason(null)`),'原因不明のエラー');
  assert(/理由：/.test(E(`errText({code:'weird'})`)),'端末内モードのエラー文に理由がない：'+E(`errText({code:'weird'})`));
  // 2) 席に座る前に名前を変える → 理由
  d.querySelector('#bCreate').click();await wait(300);const me=E('mySeat()');
  // 3) 入力中の名前は、入力欄から離れても画面の更新で消えない（iPhone でボタンを押す瞬間の再現）→ ボタンで確定
  const inp=d.querySelector('#iMyName');inp.focus();inp.value='よしゆき';inp.dispatchEvent(new w.Event('input',{bubbles:true}));inp.blur();
  E('render()');assert.equal(inp.value,'よしゆき','入力欄から離れたあとの画面の更新で、入力した名前が消えた');
  d.querySelector('#bMyName').click();await wait(300);assert.equal(E(`seatName(${me})`),'よしゆき','ボタンで名前が変わらない');assert(!inp.dataset.dirty,'確定後も入力中のまま');
  // 確定キー（Enter）でも変えられる
  inp.focus();inp.value='ポコ太郎';inp.dispatchEvent(new w.Event('input',{bubbles:true}));inp.dispatchEvent(new w.KeyboardEvent('keydown',{key:'Enter',bubbles:true}));await wait(300);
  assert.equal(E(`seatName(${me})`),'ポコ太郎','確定キーで名前が変わらない');
  // 4) 名前を変えられないとき（ほかの人の席）→ 理由
  const other=E(`[0,1,2,3].find(i=>i!==${me})`);E(`seats[${other}]={uid:'someone-else',ready:true}`);await E(`setName(${other},'だれか')`);
  assert(/変えられません。理由：ほかの人の席/.test(toastT()),'変えられない理由が出ない：'+toastT());E(`seats[${other}]=null`);
  // 5) 予期しないエラー → 理由を表示（音声の自動再生の制限は表示しない）
  const ev=new w.Event('unhandledrejection');ev.reason=Object.assign(new Error('x'),{code:'deadline-exceeded'});w.dispatchEvent(ev);
  assert(/エラーが起きました。理由：通信が時間切れ/.test(toastT()),'予期しないエラーの理由が出ない：'+toastT());
  E(`toast('')`);const ev2=new w.Event('unhandledrejection');ev2.reason=Object.assign(new Error('play() failed'),{name:'NotAllowedError'});w.dispatchEvent(ev2);
  assert(!/エラーが起きました/.test(toastT()),'音声の自動再生の制限まで表示した');
  if(errors.length)throw Error(errors.join('\n'));
  console.log('PASS エラーの理由表示（通信・ゲーム処理・名前・予期しないエラー）と名前入力（更新で消えない・確定キー）');dom.window.close();
}catch(e){console.error(e);dom.window.close();process.exitCode=1;}},100);
