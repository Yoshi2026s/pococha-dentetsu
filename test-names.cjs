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
  // 地図上の電車の札：名前の頭文字。重なるときは2文字、それでも同じなら頭文字＋席の番号。4人とも必ず違う
  E('drawPawnLabels()');const pl=()=>[0,1,2,3].map(i=>d.querySelector('#pw'+i+' .pwl').textContent);
  {const L=pl();assert.equal(L[me],'よ','自分の札：'+L.join(','));assert(L.every(x=>!/^[1-4]P$/.test(x)),'札に「〇P」が残っている：'+L.join(','));assert.equal(new Set(L).size,4,'札が重なっている：'+L.join(','))}
  E(`meta.uname[seats[${me}].uid]=seatName(${o}).replace(/\\s/g,'').slice(0,1)+'ポコ'`);E('drawPawnLabels()');
  {const L=pl();assert.equal(new Set(L).size,4,'頭文字が同じとき札が重なる：'+L.join(','));assert.equal(L[me].length,2,'頭文字が同じとき2文字になっていない：'+L.join(','))}
  E(`meta.uname[seats[${me}].uid]=seatName(${o})`);E('drawPawnLabels()');
  {const L=pl();assert.equal(new Set(L).size,4,'名前が同じとき札が重なる：'+L.join(','));assert(/[1-4]$/.test(L[me])&&/[1-4]$/.test(L[o]),'名前が同じとき席の番号が付かない：'+L.join(','))}
  // 名前を設定していないときは従来どおり「あなた」
  E(`meta.uname={}`);assert.equal(E(`seatName(${me})`),'あなた');
  if(errors.length)throw Error(errors.join('\n'));
  console.log(`PASS プレイヤーの呼び方（自分＝設定した名前・ほか＝名前・記録の文も名前に・電車の札は頭文字・未設定は「あなた」）`);dom.window.close();
}catch(e){console.error(e);dom.window.close();process.exitCode=1;}},100);
