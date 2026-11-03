// 見た目・押しやすさの改善12（2026-11-03）のテスト（Playwright・Chromium）
// 1) 横持ち（740×360・844×390）でメニューに付く×は48pxの丸（横いっぱいの帯にならない）で、ボタンに重ならない
// 2) システム説明の「← まえ／つぎ →／とじる」・音と設定の「テスト音を鳴らす」は高さ48px以上（縦持ち375px）
const {chromium}=require('playwright');const path=require('path');
const fail=[];const ok=(c,m)=>{if(!c)fail.push(m)};
(async()=>{const b=await chromium.launch();try{
  const open=async(w,h)=>{const c=await b.newContext({viewport:{width:w,height:h},isMobile:true,hasTouch:true});const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
    await p.route(/firebase|gstatic|googleapis/,r=>r.abort());await p.addInitScript(()=>{try{localStorage.setItem('poco-set',JSON.stringify({bgm:0,se:0,fast:true}))}catch{}});
    await p.goto('file://'+path.resolve(__dirname,'index.html'));await p.waitForFunction(()=>!document.querySelector('#bCreate').disabled);
    await p.click('#bCreate');await p.waitForTimeout(300);await p.click('#bStart');await p.waitForTimeout(1800);return {c,p,errs}};
  for(const [w,h] of [[740,360],[844,390]]){const {c,p,errs}=await open(w,h);await p.click('#bMenu');await p.waitForTimeout(600);
    const r=await p.evaluate(()=>{const x=document.querySelector('.menusheet .xclose');if(!x)return null;const a=x.getBoundingClientRect(),bs=[...document.querySelectorAll('.menusheet button:not(.xclose)')].map(e=>e.getBoundingClientRect());return{w:a.width,h:a.height,hit:bs.some(q=>a.left<q.right&&q.left<a.right&&a.top<q.bottom&&q.top<a.bottom)}});
    ok(r&&r.w<=56&&r.h>=48&&!r.hit,`${w}×${h} メニューの× `+JSON.stringify(r));if(errs.length)fail.push('JSエラー '+errs.join(' / '));await c.close()}
  {const {c,p,errs}=await open(375,667);const H=s=>p.evaluate(s=>[...document.querySelectorAll(s)].filter(e=>e.offsetParent).map(e=>e.id+':'+Math.round(e.getBoundingClientRect().height)),s);
    await p.click('#bMenu');await p.waitForTimeout(300);await p.click('#mnSys');await p.waitForTimeout(500);const a=await H('#sysPrev,#sysNext,#sysClose');ok(a.length>=2&&a.every(x=>+x.split(':')[1]>=48),'システム説明のボタン '+a);
    await p.evaluate(()=>{const o=document.querySelector('#ov');o.hidden=true;o.innerHTML=''});await p.click('#bMenu');await p.waitForTimeout(300);await p.click('#mnSet');await p.waitForTimeout(500);
    const t=await H('#sT');ok(t.length&&t.every(x=>+x.split(':')[1]>=48),'テスト音のボタン '+t);if(errs.length)fail.push('JSエラー '+errs.join(' / '));await c.close()}
  }finally{await b.close()}
  if(fail.length){console.error('FAIL 見た目・押しやすさの改善12\n'+fail.join('\n'));process.exitCode=1}else console.log('PASS 見た目・押しやすさの改善12（横持ちのメニューの×・システム説明/テスト音のボタン48px）')})();
