// ミニ画像（2026-10-29）：マス・イベントの結果カードに内容が分かる小さな絵を出す（jsdom・端末内モード）
const {JSDOM,VirtualConsole}=require('jsdom');const fs=require('fs'),assert=require('assert');
const errors=[],vc=new VirtualConsole();vc.on('jsdomError',e=>{if(!e.message.includes('Not implemented'))errors.push(e.message)});
const s=fs.readFileSync('index.html','utf8').replace(/<script[^>]+src=[^>]+><\/script>/g,'');
const dom=new JSDOM(s,{url:'https://example.test/',runScripts:'dangerously',pretendToBeVisual:true,virtualConsole:vc,beforeParse(w){w.matchMedia=()=>({matches:true,addEventListener(){},removeEventListener(){}});w.HTMLCanvasElement.prototype.getContext=()=>new Proxy({},{get:()=>()=>{}});w.SVGElement.prototype.getScreenCTM=()=>({a:1,b:0,c:0,d:1,e:0,f:0});w.SVGElement.prototype.getBBox=()=>({x:0,y:0,width:100,height:100});w.Element.prototype.animate=()=>({cancel(){},finished:Promise.resolve()});}});
const wait=ms=>new Promise(r=>setTimeout(r,ms));
setTimeout(async()=>{const w=dom.window,d=w.document,E=c=>w.eval(c);try{
  d.querySelector('#bCreate').click();await wait(150);d.querySelector('#bStart').click();await wait(400);
  // すべてのイベント（通常・空港・港）とマスの種類に、存在する絵が割り当てられている
  const evKeys=E('Object.keys(EVN)'),noArt=evKeys.filter(k=>!E(`MI[MIEV["${k}"]]`));assert.equal(noArt.length,0,'絵のないイベント：'+noArt.join(','));
  assert(evKeys.length>=120,'イベント数：'+evKeys.length);
  for(const t of ['plus','minus','yell','card','shop','station','airport','port','plain'])assert(E(`!!MI[MISQ["${t}"]]`),'マスの絵がない：'+t);
  // 絵は正しいSVG（パースできる）
  for(const k of E('Object.keys(MI)')){const div=d.createElement('div');div.innerHTML=E(`miniArt("${k}",1)`);const svg=div.querySelector('svg.mini');assert(svg&&svg.querySelectorAll('*').length>3,'絵が壊れている：'+k)}
  // 実際の結果カード：プラスマスは小銭の絵と▲、マイナスマスは財布の絵と▼
  E(`window.land=(ty)=>{const base=curTip().state;const k=NODES.findIndex((n,i)=>n.type===ty&&ADJ[i]&&ADJ[i].length);for(let tr=0;tr<20;tr++){const st=JSON.parse(JSON.stringify(base)),seat=curSeat(st);st.players[seat].pos=ADJ[k][0];st.rng=tr*7;
    try{const s2=applyTurn(st,{type:'roll',route:[k],buy:false,reward:'coin',shopDone:true},meta.seed,{noForce:true});if(s2.players[seat].pos!==k)continue;const mv=(s2.ev||[]).find(e=>e.k==='move');const r=resultInfo(s2,st,seat,mv?mv.t:'',NODES[k]);return {art:r.art,tone:r.tone,html:resultHTML(r)}}catch(e){}}return null}`);
  const plus=E("land('plus')"),minus=E("land('minus')"),ev=E("land('event')");
  assert.equal(plus.art,'coins');assert.equal(plus.tone,1);assert(plus.html.includes('class="rc-art"')&&plus.html.includes('M49.5 56.5'),'プラスマスに▲の絵がない');
  assert.equal(minus.art,'wallet');assert.equal(minus.tone,-1);assert(minus.html.includes('M49.5 51.5'),'マイナスマスに▼がない');
  assert(ev&&E(`!!MI["${ev.art}"]`)&&ev.html.includes('svg class="mini"'),'イベントの絵がない');
  if(errors.length)throw Error(errors.join('\n'));
  console.log(`PASS ミニ画像（絵${E('Object.keys(MI).length')}種・イベント${evKeys.length}種すべてに割り当て・結果カードに表示・増減の▲▼）`);dom.window.close();
}catch(e){console.error(e);dom.window.close();process.exitCode=1;}},100);
