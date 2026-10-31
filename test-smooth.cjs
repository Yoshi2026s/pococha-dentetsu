// なめらかさ（2026-10-31）のテスト（Playwright・Chromium）
// 1) マスの記号の型（<defs>）はアニメを止める（全マスで使い回すため、動くと地図全体が毎コマ描き直しになる）
// 2) 待ち時間に上の各プレイヤー欄を作り直さない（中身が同じなら再描画しない）
// 3) 動くもの（コマ・手番の輪・目的地の印・分かれ道）は地図に重ねた別のSVG（#mapfx）に置き、表示範囲・大きさ・位置が地図と常に一致する（2026-11-01）
const {chromium}=require('playwright');const path=require('path'),fs=require('fs');
const fail=[];const ok=(c,m)=>{if(!c)fail.push(m)};
(async()=>{const src=fs.readFileSync('index.html','utf8');
  ok(/\.sqx\{animation:none!important\}/.test(src)&&/built=true;sqStatic\(\)/.test(src),'記号の型のアニメ停止の仕組み');
  ok(/#map,#mapfx\{will-change:transform\}/.test(src)&&/if\(v===last\)return;last=v;document\.documentElement\.style\.setProperty\('--barh'/.test(src),'地図と重ねSVGの層分け・下の欄の高さの書き換えは変わったときだけ');
  const b=await chromium.launch();try{const c=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
  await p.route(/firebase|gstatic|googleapis/,r=>r.abort());await p.goto('file://'+path.resolve('index.html'));await p.waitForFunction(()=>!document.querySelector('#bCreate').disabled);
  await p.click('#bCreate');await p.waitForTimeout(300);await p.click('#bStart');await p.waitForTimeout(2500);
  const d=await p.evaluate(()=>{const els=[...document.querySelectorAll('#map defs *')];const tagged=els.filter(e=>e.classList.contains('sqx')).length;
    const run=document.getAnimations().filter(a=>a.playState==='running'&&a.effect&&a.effect.target&&a.effect.target.closest&&a.effect.target.closest('#map defs')).length;
    const anyAnim=els.filter(e=>{const n=getComputedStyle(e).animationName;return n&&n!=='none'}).length;return {tagged,run,anyAnim}});
  ok(d.tagged>0&&d.run===0&&d.anyAnim===0,'記号の型のアニメが止まっている '+JSON.stringify(d));
  const m=await p.evaluate(()=>new Promise(r=>{let n=0;const o=new MutationObserver(l=>n+=l.length);o.observe(document.querySelector('#status'),{childList:true,subtree:true});render();render();setTimeout(()=>{o.disconnect();r(n)},1500)}));
  ok(m===0,'中身が同じなら上の欄を作り直さない（変化 '+m+'）');
  const ch=await p.evaluate(()=>{const v=document.querySelector('#status').__sig;document.querySelector('#status').__sig='x';render();return document.querySelector('#status').__sig!=='x'&&!!document.querySelector('#status .pl')});
  ok(ch,'中身が変わると作り直す');
  const inFx=await p.evaluate(()=>['pawns','turnRing','goalMark','choices','ghost','stepfx','stepleft'].every(id=>{const e=document.getElementById(id);return e&&e.closest('#mapfx')&&!e.closest('#map')}));
  ok(inFx,'動くものは重ねSVGの中');
  const same=()=>p.evaluate(()=>{const a=document.querySelector('#map'),o=document.querySelector('#mapfx'),A=a.getBoundingClientRect(),O=o.getBoundingClientRect(),m=a.getScreenCTM(),n=o.getScreenCTM();
    return a.getAttribute('viewBox')===o.getAttribute('viewBox')&&[A.x-O.x,A.y-O.y,A.width-O.width,A.height-O.height,m.a-n.a,m.e-n.e,m.f-n.f].every(x=>Math.abs(x)<.6)});
  ok(await same(),'止まっているとき地図と重ねSVGが一致');
  const live=await p.evaluate(()=>new Promise(r=>{const seat=mySeat();let k=(ADJ[dispState.players[seat].pos]||[])[0];animN++;movePawn(seat,k,true);camAt(NODES[k],ZM,600,false,'lin');setTimeout(()=>r(!!camLive),250)}));
  ok(await same(),'カメラが動いている間も一致（camLive '+live+'）');await p.waitForTimeout(1200);ok(await same(),'カメラが止まった後も一致');await p.evaluate(()=>animN--);
  if(errs.length)fail.push('JSエラー '+errs.join(' / '));await c.close()}finally{await b.close()}
  if(fail.length){console.error('FAIL なめらかさ\n'+fail.join('\n'));process.exitCode=1}else console.log('PASS なめらかさ（記号の型のアニメ停止・上の欄の再描画の省略・動くものの重ねSVG）')})();
