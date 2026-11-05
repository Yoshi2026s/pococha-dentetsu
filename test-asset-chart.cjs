// 総Gの推移のグラフ（2026.11.05.4）：3日までの対戦は1時間ごとに記録し、目盛りは時刻。終わったら最後の点は最終結果の合計。以前の盤面・4日以上は日ごと（jsdom）
const {JSDOM,VirtualConsole}=require('jsdom');const fs=require('fs'),assert=require('assert');
const errors=[],vc=new VirtualConsole();vc.on('jsdomError',e=>{if(!e.message.includes('Not implemented'))errors.push(e.message)});
const s=fs.readFileSync('index.html','utf8').replace(/<script[^>]+src=[^>]+><\/script>/g,'');
const dom=new JSDOM(s,{url:'https://example.test/',runScripts:'dangerously',pretendToBeVisual:true,virtualConsole:vc,beforeParse(w){w.matchMedia=()=>({matches:true,addEventListener(){},removeEventListener(){}});w.HTMLCanvasElement.prototype.getContext=()=>new Proxy({},{get:()=>()=>{}});w.SVGElement.prototype.getScreenCTM=()=>({a:1,b:0,c:0,d:1,e:0,f:0});w.SVGElement.prototype.getBBox=()=>({x:0,y:0,width:100,height:100});w.Element.prototype.animate=()=>({cancel(){},finished:Promise.resolve()});}});
const wait=ms=>new Promise(r=>setTimeout(r,ms));
setTimeout(async()=>{const w=dom.window,d=w.document;try{
  d.querySelector('#bCreate').click();await wait(150);d.querySelector('#bStart').click();await wait(400);
  const r=JSON.parse(await w.eval(`(async()=>{const o={};for(const days of [1,2,3,7,0])o['d'+days]=Array.isArray(genesisState(meta.seed,days).hh);
    let st=genesisState(meta.seed,1);const n0=st.hh.length;let hours=0,ok=true;while(!st.finished){const h0=st.hour,a=await cpuDecide(st);st=applyTurn(st,a,meta.seed);if(st.hour!==h0)hours++;if(st.hh.length!==n0+hours)ok=false}
    const [h,hr]=chartOf(st),t=[];st.final.forEach(f=>t[f.seat]=f.total);o.len=st.hh.length;o.hours=hours;o.ok=ok;o.hr=hr;o.last=JSON.stringify(h[h.length-1])===JSON.stringify(t);
    const svg=assetChart(h,false,hr);o.lab=[...svg.matchAll(/>([^<>]*時|開始|\\d+日目)</g)].map(m=>m[1]);
    const old=JSON.parse(JSON.stringify(st));delete old.hh;o.oldHr=chartOf(old)[1];o.oldLab=[...assetChart(...[chartOf(old)[0],false,chartOf(old)[1]]).matchAll(/>(開始|\\d+日目)</g)].map(m=>m[1]);
    showFinal(st);o.ovChart=!!document.querySelector('#ov svg.achart');return JSON.stringify(o)})()`));
  assert.deepEqual([r.d1,r.d2,r.d3,r.d7,r.d0],[true,true,true,false,false],'1時間ごとの記録の対象（3日まで）が違う');
  assert(r.ok,'1時間ごとに1つずつ記録されていない');assert.equal(r.len,7,'1日の対戦（18:00〜24:00）で7点にならない');
  assert.equal(r.hr,true);assert(r.last,'最後の点が最終結果の合計と違う');
  assert.deepEqual(r.lab,['開始','20時','22時','0時'],'目盛りが時刻でない：'+r.lab.join(','));
  assert.equal(r.oldHr,false,'以前の盤面が1時間ごとになった');assert.deepEqual(r.oldLab,['開始','1日目'],'以前の盤面の目盛りが変わった');
  assert(r.ovChart,'最終結果にグラフが無い');
  assert.deepEqual(errors,[],'エラー：'+errors.join(' / '));console.log('OK 総Gの推移のグラフ');process.exit(0)}
catch(e){console.error('NG',e.message);process.exit(1)}},300);
