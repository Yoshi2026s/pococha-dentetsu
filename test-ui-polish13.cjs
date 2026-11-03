// 配信モードの見た目の改善（2026-11-03）のテスト（Playwright・Chromium・iPhone幅320/390px）
// 1) 下のボタンは3列（メニュー・カード・サイコロ）で「サイコロ」が切れない  2) おまかせルートの結果・選んだ物件のボタンは暗い背景（白い文字が読める）
// 3) 「配信モードを終わる」は高さ48px以上
const {chromium}=require('playwright');const path=require('path');
const fail=[];const ok=(c,m)=>{if(!c)fail.push(m)};
(async()=>{const b=await chromium.launch();try{for(const [W,H] of [[320,568],[390,844]]){const c=await b.newContext({viewport:{width:W,height:H},isMobile:true,hasTouch:true});const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
  await p.route(/firebase|gstatic|googleapis/,r=>r.abort());await p.addInitScript(()=>{try{localStorage.setItem('poco-set',JSON.stringify({bgm:0,se:0,fast:true,stream:true}))}catch{}});
  await p.goto('file://'+path.resolve(__dirname,'index.html'));await p.waitForFunction(()=>!document.querySelector('#bCreate').disabled);
  await p.click('#bCreate');await p.waitForTimeout(300);await p.click('#bStart');await p.waitForTimeout(1800);
  const r=await p.evaluate(()=>{const lum=e=>{const m=getComputedStyle(e).backgroundColor.match(/[\d.]+/g).map(Number);const v=/^color\(/.test(getComputedStyle(e).backgroundColor)?m.slice(0,3).map(x=>x*255):m.slice(0,3);return (.2126*v[0]+.7152*v[1]+.0722*v[2])/255};
    const q=s=>document.querySelector(s),R=s=>q(s).getBoundingClientRect();
    const ro=q('#routeOpts');ro.insertAdjacentHTML('beforeend','<div class="autoconf" id="tAc"><div class="ac-end">テスト</div></div>');const bl=q('#baseList');bl.insertAdjacentHTML('beforeend','<button class="basebtn fanbtn on" id="tOn">テスト</button>');
    const out={stream:document.body.classList.contains('stream'),roll:[q('#bRoll').scrollWidth<=q('#bRoll').clientWidth+1,Math.round(R('#bRoll').width),Math.round(R('#bCard').width)],same:Math.abs(R('#bRoll').top-R('#bMenu').top)<2,
      ac:[lum(q('#tAc')),getComputedStyle(q('#tAc')).color],on:[lum(q('#tOn')),getComputedStyle(q('#tOn')).color],exit:R('#exitStream').height};q('#tAc').remove();q('#tOn').remove();return out});
  ok(r.stream,W+'px 配信モードになっていない');
  ok(r.roll[0]&&r.roll[1]>r.roll[2]&&r.same,W+'px 「サイコロ」のボタン '+JSON.stringify(r.roll));
  ok(r.ac[0]<.3&&r.ac[1]==='rgb(255, 255, 255)',W+'px おまかせルートの結果の背景 '+JSON.stringify(r.ac));
  ok(r.on[0]<.45&&r.on[1]==='rgb(255, 255, 255)',W+'px 選んだ物件のボタンの背景 '+JSON.stringify(r.on));
  ok(r.exit>=48,W+'px 配信モードを終わるの高さ '+r.exit);
  if(errs.length)fail.push(W+'px JSエラー '+errs.join(' / '));await c.close()}}finally{await b.close()}
  if(fail.length){console.error('FAIL 配信モードの見た目\n'+fail.join('\n'));process.exitCode=1}else console.log('PASS 配信モードの見た目（サイコロのボタン・おまかせ結果と選んだ物件の背景・終わるボタン48px）')})();
