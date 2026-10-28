const {JSDOM,VirtualConsole}=require('jsdom');const fs=require('fs');
const errors=[],vc=new VirtualConsole();vc.on('jsdomError',e=>{if(!e.message.includes('Not implemented'))errors.push(e.message)});
const s=fs.readFileSync('index.html','utf8').replace(/<script[^>]+src=[^>]+><\/script>/g,'');
const dom=new JSDOM(s,{url:'https://example.test/',runScripts:'dangerously',pretendToBeVisual:true,virtualConsole:vc,beforeParse(w){w.matchMedia=()=>({matches:true,addEventListener(){},removeEventListener(){}});w.HTMLCanvasElement.prototype.getContext=()=>new Proxy({},{get:()=>()=>{}});w.SVGElement.prototype.getScreenCTM=()=>({a:1,b:0,c:0,d:1,e:0,f:0});w.SVGElement.prototype.getBBox=()=>({x:0,y:0,width:100,height:100});w.Element.prototype.animate=()=>({cancel(){},finished:Promise.resolve()});}});
setTimeout(async()=>{try{const d=dom.window.document; if(d.querySelector('#bCreate').disabled)throw Error('作成不可：'+d.querySelector('#permNote').textContent);d.querySelector('#bCreate').click();
await new Promise(r=>setTimeout(r,150));if(d.querySelector('#vRoom').hidden)throw Error('ロビー表示失敗');d.querySelector('#bStart').click();await new Promise(r=>setTimeout(r,300));
if(d.querySelector('#vGame').hidden)throw Error('ゲーム開始失敗');if(d.querySelectorAll('#status .pl').length!==4)throw Error('4人表示失敗');if(errors.length)throw Error(errors.join('\n'));
console.log('PASS 端末内モード起動・部屋作成・CPU開始・4人表示');fs.writeFileSync('dom-test-results.json',JSON.stringify({passed:4,scope:'jsdom、実ブラウザのレイアウト・音声・タッチ操作は対象外'},null,2));dom.window.close();}catch(e){console.error(e);dom.window.close();process.exitCode=1;}},100);
