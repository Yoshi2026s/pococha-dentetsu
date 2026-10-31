// システム説明の追加分（2026-10-29）：時間帯・天気の倍率表、地図左上の時刻・天気タップ、数字入りの説明がゲームの定数と一致するか（jsdom・端末内モード）
const {JSDOM,VirtualConsole}=require('jsdom');const fs=require('fs'),assert=require('assert');
const errors=[],vc=new VirtualConsole();vc.on('jsdomError',e=>{if(!e.message.includes('Not implemented'))errors.push(e.message)});
const s=fs.readFileSync('index.html','utf8').replace(/<script[^>]+src=[^>]+><\/script>/g,'');
const dom=new JSDOM(s,{url:'https://example.test/',runScripts:'dangerously',pretendToBeVisual:true,virtualConsole:vc,beforeParse(w){w.matchMedia=()=>({matches:true,addEventListener(){},removeEventListener(){}});w.HTMLCanvasElement.prototype.getContext=()=>new Proxy({},{get:()=>()=>{}});w.SVGElement.prototype.getScreenCTM=()=>({a:1,b:0,c:0,d:1,e:0,f:0});w.SVGElement.prototype.getBBox=()=>({x:0,y:0,width:100,height:100});w.Element.prototype.animate=()=>({cancel(){},finished:Promise.resolve()});}});
const wait=ms=>new Promise(r=>setTimeout(r,ms));
setTimeout(async()=>{const w=dom.window,d=w.document;try{
  d.querySelector('#bCreate').click();await wait(150);d.querySelector('#bStart').click();await wait(300);
  const sky=d.querySelector('#skyLabel');assert(sky.textContent.includes('倍率'),'地図左上の札に「倍率」の目印がない');
  // 1日目18:00・天気を雨にした状態でタップ → 昼×雨の倍率が出る
  w.eval('dispState.weather=2;dispState.hour=20');sky.click();await wait(50);
  const box=d.querySelector('#ov .wxsheet');assert(box,'時刻・天気をタップしても説明が開かない');
  const now=[...box.querySelectorAll('.wxnow b')].map(b=>b.textContent);
  const P=w.eval('PLUSM'),M=w.eval('MINUSM'),Y=w.eval('YELLM'),f=v=>'×'+(+v.toFixed(2));
  assert.deepEqual(now,[f(P.tz[2]*P.wx[2]),f(M.tz[2]*M.wx[2]),f(Y.tz[2]*Y.wx[2])],'いまの倍率（ゴールデン×雨）が定数と違う：'+now);
  const on=[...box.querySelectorAll('tr.on th')].map(t=>t.textContent);assert(on[0].startsWith('ゴールデン')&&on[1].includes('雨'),'いまの時間帯・天気の強調：'+on);
  assert(box.textContent.includes('次に天気が変わるのは 0:00')||box.textContent.includes('次の天気の変化と決算は 0:00'),'次の天気の時刻（20時→0:00。決算と同じ時刻なら1つにまとめた表記）');
  // 「くわしい説明」→システム説明の時間タブ
  d.querySelector('#wxMore').click();await wait(50);const body=d.querySelector('.sys-body');
  assert(body&&body.querySelector('h4').textContent==='時間と天気'&&body.querySelectorAll('.xtab').length===2,'くわしい説明で時間タブの表が出ない');
  // 数字入りの説明が定数から作られている
  const SYS=w.eval('SYS'),tab=k=>SYS.find(x=>x[0].includes(k))[2];
  assert(tab('決算').includes('＋'+w.eval('CONDS')[0][2])&&tab('決算').includes('新人応援'),'決算タブ');
  assert(tab('ランク').includes(w.eval('BASEPT').S6.toLocaleString())&&tab('ランク').includes(w.eval('BONUS').S6.toLocaleString()),'ランク表がBASEPT・BONUSと違う');
  assert(tab('物件').includes('＋'+Math.round(w.eval('TB')[0]*100)+'%')&&tab('物件').includes('1.4〜2.0倍'),'物件数ボーナス・独占');
  assert(tab('時間').includes(f(P.tz[2]*P.wx[0])),'時間タブの例（ゴールデン×晴れ）');
  if(errors.length)throw Error(errors.join('\n'));
  console.log('PASS システム説明（時刻・天気タップの倍率・強調・次の天気・くわしい説明・数字入りタブ5種）');dom.window.close();
}catch(e){console.error(e);dom.window.close();process.exitCode=1;}},100);
