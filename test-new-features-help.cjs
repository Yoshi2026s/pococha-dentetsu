// 遊び方・システム説明の「✨ 新しい要素」ページ（2026.11.05.12）：今日追加した要素がまとまっている（jsdom）
const {JSDOM,VirtualConsole}=require('jsdom');const fs=require('fs'),assert=require('assert');
const errors=[],vc=new VirtualConsole();vc.on('jsdomError',e=>{if(!e.message.includes('Not implemented'))errors.push(e.message)});
const s=fs.readFileSync('index.html','utf8').replace(/<script[^>]+src=[^>]+><\/script>/g,'');
const dom=new JSDOM(s,{url:'https://example.test/',runScripts:'dangerously',pretendToBeVisual:true,virtualConsole:vc,beforeParse(w){w.matchMedia=()=>({matches:true,addEventListener(){},removeEventListener(){}});w.HTMLCanvasElement.prototype.getContext=()=>new Proxy({},{get:()=>()=>{}});w.SVGElement.prototype.getScreenCTM=()=>({a:1,b:0,c:0,d:1,e:0,f:0});w.SVGElement.prototype.getBBox=()=>({x:0,y:0,width:100,height:100});w.Element.prototype.animate=()=>({cancel(){},finished:Promise.resolve()});}});
const wait=ms=>new Promise(r=>setTimeout(r,ms));
setTimeout(async()=>{const w=dom.window,d=w.document;try{
  const how=JSON.parse(w.eval('JSON.stringify(HOW[HOW.length-1])'));assert.equal(how[0],'✨ 新しい要素','遊び方の最後のページが新しい要素でない');
  const ht=how[1].join('');for(const k of ['ラストスパート','逆転ボーナス','応援ブースト','フィーバー駅','独占くずれ','デッドヒート','1位の入れかわり','名場面','追い上げ王','結果をシェア','ストーリー用の画像','新しく始めた対戦'])assert(ht.includes(k),'遊び方に「'+k+'」が無い');
  const sys=JSON.parse(w.eval('JSON.stringify(SYS.find(x=>x[0]==="✨ 新要素")||null)'));assert(sys,'システム説明に新要素のページが無い');
  for(const k of ['ラストスパート','応援ブースト','逆転ボーナス','ご当地フィーバー駅','1日の対戦の目的地','独占くずれ','あと1件で独占','デッドヒート','1位の入れかわり','最後の手番','総Gの推移','名場面','1番乗り王','追い上げ王','結果をシェア','ストーリー用の画像','プレイヤー名','〆（0:00の決算）'])assert(sys[2].includes(k),'システム説明に「'+k+'」が無い');
  // 画面で開ける
  d.querySelector('#bHow').click();await wait(200);w.eval('howI=HOW.length-1;showHow()');await wait(200);assert(d.querySelector('#ov').textContent.includes('✨ 新しい要素'),'遊び方の最後で新しい要素が開かない：'+d.querySelector('#ov').textContent.slice(0,80));assert.equal(d.querySelector('#hNext').textContent,'とじる');
  w.eval('showSys(SYS.findIndex(x=>x[0]==="✨ 新要素"))');await wait(200);assert(d.querySelector('#ov').textContent.includes('新しい要素（2026年11月5日）'),'システム説明で新要素が開かない');
  assert.deepEqual(errors,[],'エラー：'+errors.join(' / '));console.log('OK 新しい要素のページ（遊び方・システム説明）');process.exit(0)}
catch(e){console.error('NG',e.message);process.exit(1)}},300);
