// プレイヤーの呼び方（2026-10-30）：自分は設定した名前、ほかの人は「2P」などではなく名前で表示する（jsdom・端末内モード）
const {JSDOM,VirtualConsole}=require('jsdom');const fs=require('fs'),assert=require('assert');
const errors=[],vc=new VirtualConsole();vc.on('jsdomError',e=>{if(!e.message.includes('Not implemented'))errors.push(e.message)});
const s=fs.readFileSync('index.html','utf8').replace(/<script[^>]+src=[^>]+><\/script>/g,'');
const dom=new JSDOM(s,{url:'https://example.test/',runScripts:'dangerously',pretendToBeVisual:true,virtualConsole:vc,beforeParse(w){w.matchMedia=()=>({matches:true,addEventListener(){},removeEventListener(){}});w.HTMLCanvasElement.prototype.getContext=()=>new Proxy({},{get:()=>()=>{}});w.SVGElement.prototype.getScreenCTM=()=>({a:1,b:0,c:0,d:1,e:0,f:0});w.SVGElement.prototype.getBBox=()=>({x:0,y:0,width:100,height:100});w.Element.prototype.animate=()=>({cancel(){},finished:Promise.resolve()});}});
const wait=ms=>new Promise(r=>setTimeout(r,ms));
setTimeout(async()=>{const w=dom.window,d=w.document,E=c=>w.eval(c);try{
  d.querySelector('#bCreate').click();await wait(150);
  d.querySelector('#iMyName').value='よしゆき';d.querySelector('#bMyName').click();await wait(150);
  d.querySelector('#bStart').click();await wait(500);
  const me=E('mySeat()');assert.equal(E(`seatName(${me})`),'よしゆき','自分の名前が設定されていない');
  // 順位欄：自分は設定した名前、ほかは名前のみ（1P〜4P を付けない）
  const names=[...d.querySelectorAll('#status .pl-name')].map(e=>e.textContent);assert.equal(names.length,4,'順位欄の人数：'+names.join(','));
  assert(names.includes('よしゆき'),'順位欄に自分の名前がない：'+names.join(','));
  for(const n of names)assert(!/^[1-4]P/.test(n)&&n!=='あなた','順位欄に「〇P」「あなた」が残っている：'+n);
  const st=d.querySelector('#status').textContent;assert(!st.includes('あなた')&&!/[1-4]P\s/.test(st),'順位欄の見出し：'+st.slice(0,80));
  const tt=d.querySelector('#turnText').textContent;assert(tt.includes('よしゆきの番')&&!/[1-4]P/.test(tt),'手番の表示：'+tt);
  // 記録の文の「2P」などは表示のときに名前へ（記録そのものは変えない）
  const o=(me+1)%4,on=E(`seatName(${o})`);assert(on&&!/^[1-4]P$/.test(on),'ほかの人の名前：'+on);
  assert.equal(E(`nameize("${o+1}Pに小さなアンチ −500G")`),on+'に小さなアンチ −500G');
  assert.equal(E(`nameize("${me+1}Pのゴールドがマイナス・ランク30pt・E1")`),'よしゆきのゴールドがマイナス・ランク30pt・E1','名前以外まで置きかわった');
  E(`toast("${o+1}Pがブロックカードで防いだ")`);assert.equal(d.querySelector('#toast').textContent,on+'がブロックカードで防いだ','お知らせが名前になっていない');
  // 名前を設定していないときは従来どおり「あなた」
  E(`meta.uname={}`);assert.equal(E(`seatName(${me})`),'あなた');
  if(errors.length)throw Error(errors.join('\n'));
  console.log(`PASS プレイヤーの呼び方（自分＝設定した名前・ほか＝名前・記録の文も名前に・未設定は「あなた」）`);dom.window.close();
}catch(e){console.error(e);dom.window.close();process.exitCode=1;}},100);
