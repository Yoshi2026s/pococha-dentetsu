// 結果のシェア（2026.11.05.8）：最終結果の「📤 結果をシェア」で、自分の順位・総G・賞・名場面だけの文をコピーする（ほかの人の名前は入れない・jsdom）
const {JSDOM,VirtualConsole}=require('jsdom');const fs=require('fs'),assert=require('assert');
const errors=[],vc=new VirtualConsole();vc.on('jsdomError',e=>{if(!e.message.includes('Not implemented'))errors.push(e.message)});
const s=fs.readFileSync('index.html','utf8').replace(/<script[^>]+src=[^>]+><\/script>/g,'');
const dom=new JSDOM(s,{url:'https://example.test/',runScripts:'dangerously',pretendToBeVisual:true,virtualConsole:vc,beforeParse(w){w.matchMedia=()=>({matches:true,addEventListener(){},removeEventListener(){}});w.HTMLCanvasElement.prototype.getContext=()=>new Proxy({},{get:()=>()=>{}});w.SVGElement.prototype.getScreenCTM=()=>({a:1,b:0,c:0,d:1,e:0,f:0});w.SVGElement.prototype.getBBox=()=>({x:0,y:0,width:100,height:100});w.Element.prototype.animate=()=>({cancel(){},finished:Promise.resolve()});}});
const wait=ms=>new Promise(r=>setTimeout(r,ms));
setTimeout(async()=>{const w=dom.window,d=w.document;try{
  d.querySelector('#bCreate').click();await wait(150);d.querySelector('#bStart').click();await wait(400);
  let copied=null;Object.defineProperty(w.navigator,'clipboard',{value:{writeText:async t=>{copied=t}},configurable:true});
  await w.eval(`(async()=>{let st=genesisState(meta.seed,1);while(!st.finished){st=applyTurn(st,await cpuDecide(st),meta.seed)}window.__fin=st;showFinal(st)})()`);await wait(600);
  const b=d.querySelector('#bShareRes');assert(b,'結果をシェアのボタンが無い');b.click();await wait(300);
  assert(copied,'結果の文がコピーされない');const me=w.eval('mySeat()'),k=w.eval('__fin.final.findIndex(f=>f.seat===mySeat())');
  assert(copied.includes(`で${k+1}位`),'順位が違う：'+copied);assert(copied.includes(w.eval('__fin.final[__fin.final.findIndex(f=>f.seat===mySeat())].total.toLocaleString()')+'G'),'総Gが無い');
  assert(copied.includes('#ポコチャ電鉄'),'ハッシュタグが無い');
  const others=[0,1,2,3].filter(i=>i!==me).map(i=>w.eval(`seatName(${i})`));assert(!others.some(n=>copied.includes(n)),'ほかの人の名前が入った：'+copied);
  assert(d.querySelector('#ov').hidden===false,'押したら結果の画面が閉じた');
  // 賞の一覧は今までどおり（4人全員が同じ賞のときは出さない）
  assert.equal(w.eval('awardList(__fin).every(a=>a[1].length>0&&a[1].length<4)'),true);assert(w.eval('awards(__fin)').includes('class="award"'));
  assert.equal(w.eval('resultText(null)'),'');
  // 最終結果のひとこと：1位なら2位との差、それ以外はひとつ上まであと何G
  const fn=w.eval(`(()=>{const s=JSON.parse(JSON.stringify(__fin)),me=mySeat(),o=[];const set=k=>{const i=s.final.findIndex(f=>f.seat===me),t=s.final.splice(i,1)[0];s.final.splice(k,0,t);s.final.forEach((f,j)=>f.total=50000-j*1000)};set(0);o.push(finNote(s,me));set(2);o.push(finNote(s,me));set(1);o.push(finNote(s,me));return JSON.stringify(o)})()`);
  const F=JSON.parse(fn);assert(/2位に<b>1,000G<\/b>差で優勝/.test(F[0]),'1位のひとことが違う：'+F[0]);assert(/あと<b>1,000G<\/b>で2位でした/.test(F[1]),'3位のひとことが違う：'+F[1]);assert(/あと<b>1,000G<\/b>で優勝でした/.test(F[2]),'2位のひとことが違う：'+F[2]);
  assert(d.querySelector('#ov .finnote'),'最終結果にひとことが無い');assert.equal(w.eval('finNote(__fin,-1)'),'');
  assert.deepEqual(errors,[],'エラー：'+errors.join(' / '));console.log('OK 結果のシェア\n'+copied);process.exit(0)}
catch(e){console.error('NG',e.message);process.exit(1)}},300);
