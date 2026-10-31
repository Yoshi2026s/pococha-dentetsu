// なめらかさ（2026-10-31）のテスト（Playwright・Chromium）
// 1) マスの記号の型（<defs>）はアニメを止める（全マスで使い回すため、動くと地図全体が毎コマ描き直しになる）
// 2) 待ち時間に上の各プレイヤー欄を作り直さない（中身が同じなら再描画しない）  3) 演出中はゴールの輪も止める
const {chromium}=require('playwright');const path=require('path'),fs=require('fs');
const fail=[];const ok=(c,m)=>{if(!c)fail.push(m)};
(async()=>{const src=fs.readFileSync('index.html','utf8');
  ok(/\.sqx\{animation:none!important\}/.test(src)&&/built=true;sqStatic\(\)/.test(src),'記号の型のアニメ停止の仕組み');
  ok(/body\.fxbusy #map \.goalpulse/.test(src),'演出中のゴールの輪の停止');
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
  if(errs.length)fail.push('JSエラー '+errs.join(' / '));await c.close()}finally{await b.close()}
  if(fail.length){console.error('FAIL なめらかさ\n'+fail.join('\n'));process.exitCode=1}else console.log('PASS なめらかさ（記号の型のアニメ停止・上の欄の再描画の省略・演出中の停止）')})();
