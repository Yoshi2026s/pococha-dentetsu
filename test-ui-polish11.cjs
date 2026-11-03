// 見た目・押しやすさの改善11（2026-11-03）のテスト（Playwright・Chromium・iPhone幅320/375px）
// 1) メニューの各ボタン・遊び方の「つぎへ」・招待文のコピー・名前の入力/変更・音と設定の音量/演出の量は高さ48px以上
// 2) メニューの「音：オン」「音と設定」は1行、中断ボタンは「（あとで続きから）」の前でだけ折り返す
const {chromium}=require('playwright');const path=require('path');
const fail=[];const ok=(c,m)=>{if(!c)fail.push(m)};
const lines=e=>{const r=document.createRange();r.selectNodeContents(e);return new Set([...r.getClientRects()].map(x=>Math.round(x.top))).size};
(async()=>{const b=await chromium.launch();try{for(const W of [320,375]){const c=await b.newContext({viewport:{width:W,height:W<375?568:667},isMobile:true,hasTouch:true});const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
  await p.route(/firebase|gstatic|googleapis/,r=>r.abort());await p.addInitScript(()=>{try{localStorage.setItem('poco-set',JSON.stringify({bgm:0,se:0,fast:true}))}catch{}});
  await p.goto('file://'+path.resolve(__dirname,'index.html'));await p.waitForFunction(()=>!document.querySelector('#bCreate').disabled);
  const H=sel=>p.evaluate(s=>[...document.querySelectorAll(s)].filter(e=>e.offsetParent).map(e=>(e.id||e.tagName)+':'+Math.round(e.getBoundingClientRect().height)),sel);
  const chk=(a,m)=>ok(a.length&&a.every(x=>+x.split(':').pop()>=48),W+'px '+m+' '+a);
  await p.click('#bHow');await p.waitForTimeout(400);chk(await H('#hNext'),'遊び方の「つぎへ」');await p.click('#hNext');await p.waitForTimeout(300);chk(await H('#hPrev,#hNext'),'遊び方の「まえへ/つぎへ」');
  await p.evaluate(()=>{const o=document.querySelector('#ov');o.hidden=true;o.innerHTML=''});
  await p.click('#bCreate');await p.waitForTimeout(400);chk(await H('#bCopy,#iMyName,#bMyName'),'部屋の画面');
  await p.click('#bStart');await p.waitForTimeout(2000);
  await p.click('#bMenu');await p.waitForTimeout(400);chk(await H('.menusheet button'),'メニューのボタン');
  const ln=await p.evaluate(l=>{const f=eval(l);return Object.fromEntries([...document.querySelectorAll('.menusheet button')].map(e=>[e.id,f(e)]))},lines.toString());
  ok(ln.mnSound===1&&ln.mnSet===1,W+'px メニューの音ボタンが折り返す '+JSON.stringify(ln));
  const pz=await p.evaluate(()=>{const e=document.querySelector('#mnPause');if(!e)return null;const t=[...e.childNodes].filter(n=>n.nodeType===3);const r=document.createRange();r.selectNodeContents(t[t.length-1]);return [t[t.length-1].textContent,new Set([...r.getClientRects()].map(x=>Math.round(x.top))).size]});
  ok(pz&&pz[0]==='（あとで続きから）'&&pz[1]===1,W+'px 中断ボタンの折り返し '+pz);
  await p.click('#mnSet');await p.waitForTimeout(400);chk(await H('#sB,#sS,#sQ'),'音と設定の音量・演出の量');
  if(errs.length)fail.push(W+'px JSエラー '+errs.join(' / '));await c.close()}}finally{await b.close()}
  if(fail.length){console.error('FAIL 見た目・押しやすさの改善11\n'+fail.join('\n'));process.exitCode=1}else console.log('PASS 見た目・押しやすさの改善11（メニュー・遊び方・部屋・音と設定の48px・メニューの折り返し）')})();
