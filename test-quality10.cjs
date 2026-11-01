// 品質の改善（2026-11-01 第2回）のテスト（Playwright・Chromium）
// 1) 裏にいる間はマナーモード対策の無音の音声も止める・音の中断で表示を更新  2) 音量の係数（BGM 0.38・効果音 0.45）
// 3) 毎秒の画面更新で、上の欄の位置を測らない（作り直すときだけ）  4) 空の小窓は毎コマ大きさを測らない
// 5) 目的地の矢印は同じ表示なら書きかえない  6) 終了時の0:00に「また今日から集め直し」を出さない・表彰の数字に何の回数かを書く
const {chromium}=require('playwright');const path=require('path'),fs=require('fs');
const fail=[];const ok=(c,m)=>{if(!c)fail.push(m)};
(async()=>{const src=fs.readFileSync('index.html','utf8');
  ok(/if\(document\.hidden\)\{try\{ac\.suspend\(\)\}catch\{\}try\{AU\.silent&&AU\.silent\.pause\(\)\}catch\{\}\}/.test(src)&&/ac\.onstatechange=\(\)=>soundState\(\)/.test(src),'裏で無音の音声を止める・中断の表示');
  ok(/AU\.bgm\.gain\.value=SET\.bgm\/100\*\.38;AU\.se\.gain\.value=SET\.se\/100\*\.45/.test(src),'音量の係数');
  ok(/let vis=false;/.test(src)&&!/const oldR=\{\};const vis=box\.offsetParent/.test(src),'上の欄の位置は作り直すときだけ測る');
  ok(/pw=Math\.round\(WXW\.cw\*d\)/.test(src),'空の小窓の大きさを毎コマ測らない');
  ok(/if\(yr&&!s\.finished\)setTimeout\(/.test(src)&&/'達成'\+s\.players\[i\]\.mtot\+'回'/.test(src)&&/'マイナスマス'\+\(s\.players\[i\]\.minusTot\|\|0\)\+'回'/.test(src),'終了時の案内・表彰の数字');
  const b=await chromium.launch();try{const c=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
  await p.route(/firebase|gstatic|googleapis/,r=>r.abort());await p.goto('file://'+path.resolve('index.html'));await p.waitForFunction(()=>!document.querySelector('#bCreate').disabled);
  await p.click('#bCreate');await p.waitForTimeout(300);await p.click('#bStart');await p.waitForTimeout(2500);
  // 中身が同じ render() では offsetTop を読まない
  const reads=await p.evaluate(()=>{let n=0;const d=Object.getOwnPropertyDescriptor(HTMLElement.prototype,'offsetTop');Object.defineProperty(HTMLElement.prototype,'offsetTop',{configurable:true,get(){if(this.closest&&this.closest('#status'))n++;return d.get.call(this)}});render();render();Object.defineProperty(HTMLElement.prototype,'offsetTop',d);return n});
  ok(reads===0,'変化のない render で上の欄の位置を測った回数 '+reads);
  const wx=await p.evaluate(()=>new Promise(r=>{const c=document.querySelector('#wxw canvas,canvas.wxw,#skyCv')||null;let n=0;const d=Object.getOwnPropertyDescriptor(Element.prototype,'clientWidth');Object.defineProperty(Element.prototype,'clientWidth',{configurable:true,get(){if(this.tagName==='CANVAS')n++;return d.get.call(this)}});setTimeout(()=>{Object.defineProperty(Element.prototype,'clientWidth',d);r(n)},1500)}));
  ok(wx<=2,'空の小窓の大きさを測った回数（1.5秒） '+wx);
  const ga=await p.evaluate(()=>{const a=document.querySelector('#goalArrow');if(!a||a.hidden)return 'skip';updateGoalArrow();const h=a.innerHTML;let w=0;const o=new MutationObserver(l=>w+=l.length);o.observe(a,{childList:true,subtree:true,attributes:true});updateGoalArrow();updateGoalArrow();return new Promise(r=>setTimeout(()=>{o.disconnect();r(w)},50))});
  ok(ga==='skip'||ga===0,'目的地の矢印の書きかえ '+ga);
  await p.evaluate(()=>{AU.silent={paused:false,pause(){this.paused=true},play(){this.paused=false;return Promise.resolve()}};if(!AU.ac)AU.ac={state:'running',suspend(){},resume(){return Promise.resolve()},createBuffer(){throw 0}};Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});document.dispatchEvent(new Event('visibilitychange'))});
  ok(await p.evaluate(()=>AU.silent.paused),'裏にいる間は無音の音声を止める');
  if(errs.length)fail.push('JSエラー '+errs.join(' / '));await c.close()}finally{await b.close()}
  if(fail.length){console.error('FAIL 品質の改善10\n'+fail.join('\n'));process.exitCode=1}else console.log('PASS 品質の改善10（裏での音・音量・画面の再計算の削減・終了時の表記）')})();
