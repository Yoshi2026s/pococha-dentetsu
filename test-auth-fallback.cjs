// 匿名ログインに失敗したとき、端末内モード（CPU対戦のみ）に切り替わり「部屋を作る」が押せることを確認する
const {JSDOM,VirtualConsole}=require('jsdom');const fs=require('fs');
const html=fs.readFileSync('index.html','utf8').replace(/<script[^>]+src=[^>]+><\/script>/g,'');
const fakes={
 'ログイン失敗':`window.FIREBASE_CONFIG={apiKey:'test',projectId:'pococha-dentetsu'};
  const auth=()=>({setPersistence:async()=>{},signInAnonymously:()=>Promise.reject(Object.assign(new Error('fail'),{code:'auth/network-request-failed'})),currentUser:null});auth.Auth={Persistence:{LOCAL:'local'}};
  const firestore=()=>({settings(){},doc(){},collection(){}});firestore.FieldValue={serverTimestamp(){}};
  window.firebase={initializeApp(){},auth,firestore};`,
 '初期化エラー':`window.FIREBASE_CONFIG={apiKey:'test',projectId:'pococha-dentetsu'};window.firebase={initializeApp(){throw Object.assign(new Error('init'),{code:'app/invalid'})}};`,
 '設定ちがい':`window.FIREBASE_CONFIG={apiKey:'test',projectId:'other'};window.firebase={};`};
const run=(name,fake)=>new Promise((ok,ng)=>{const errors=[],vc=new VirtualConsole();vc.on('jsdomError',e=>{if(!e.message.includes('Not implemented'))errors.push(e.message)});
 const s=html.replace('<script>','<script>'+fake+'</script><script>');
 const dom=new JSDOM(s,{url:'https://example.test/',runScripts:'dangerously',pretendToBeVisual:true,virtualConsole:vc,beforeParse(w){w.matchMedia=()=>({matches:true,addEventListener(){},removeEventListener(){}});w.HTMLCanvasElement.prototype.getContext=()=>new Proxy({},{get:()=>()=>{}});w.SVGElement.prototype.getScreenCTM=()=>({a:1,b:0,c:0,d:1,e:0,f:0});w.SVGElement.prototype.getBBox=()=>({x:0,y:0,width:100,height:100});w.Element.prototype.animate=()=>({cancel(){},finished:Promise.resolve()});}});
 setTimeout(async()=>{try{const d=dom.window.document,note=d.querySelector('#permNote').textContent;
  if(d.querySelector('#bCreate').disabled)throw Error('部屋を作るが押せない：'+note);
  if(!note.includes('端末内モード'))throw Error('案内文が端末内モードになっていない：'+note);
  d.querySelector('#bCreate').click();await new Promise(r=>setTimeout(r,150));if(d.querySelector('#vRoom').hidden)throw Error('ロビー表示失敗');
  d.querySelector('#bStart').click();await new Promise(r=>setTimeout(r,300));if(d.querySelector('#vGame').hidden)throw Error('ゲーム開始失敗');
  if(errors.length)throw Error(errors.join('\n'));console.log('PASS '+name+'：'+note);ok({name,note})}catch(e){ng(Object.assign(e,{message:name+'：'+e.message}))}finally{dom.window.close()}},800)});
(async()=>{const out=[];for(const [n,f] of Object.entries(fakes))out.push(await run(n,f));fs.writeFileSync('auth-fallback-results.json',JSON.stringify(out,null,2));process.exit(0)})().catch(e=>{console.error('FAIL',e.message);process.exit(1)});
