// 通信対戦の画面まわりの改善（2026-11-03）のテスト（Playwright・Chromium・iPhone幅375px・通信なし）
// 1) 名前を決めていない人は「ホスト」「2Pさん」のように区別できる（以前は全員「参加者」）
// 2) スマホで共有画面が使えるときは「招待を送る」で共有画面を開く（閉じたらそれで終わり）。使えないときは今までどおりコピー
const {chromium}=require('playwright');const path=require('path');
const fail=[];const ok=(c,m)=>{if(!c)fail.push(m)};
(async()=>{const b=await chromium.launch();try{
  {const c=await b.newContext({viewport:{width:375,height:667},isMobile:true,hasTouch:true});const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
    await p.route(/firebase|gstatic|googleapis/,r=>r.abort());await p.addInitScript(()=>{window.__shared=[];navigator.share=async d=>{window.__shared.push(d)}});
    await p.goto('file://'+path.resolve(__dirname,'index.html'));await p.waitForFunction(()=>!document.querySelector('#bCreate').disabled);
    await p.click('#bCreate');await p.waitForTimeout(400);
    ok(/招待を送る/.test(await p.locator('#bCopy').textContent()),'共有画面が使えるのに「招待を送る」になっていない');
    await p.click('#bCopy');await p.waitForTimeout(200);const sh=await p.evaluate(()=>[window.__shared.length,(window.__shared[0]||{}).text||'',code]);
    ok(sh[0]===1&&sh[1].includes(sh[2])&&sh[1].includes('?room='),'共有画面に招待文（部屋コード・URL）が渡っていない '+JSON.stringify(sh));
    const nm=await p.evaluate(()=>{const keep=[seats,meta];meta={...meta,host:'H',phase:'lobby',uname:{},pname:{}};seats=[{uid:'H'},{uid:'B'},{uid:'C'},null];const me=mySeat();const r=[0,1,2].map(i=>seatName(i));[seats,meta]=keep;return [me,r]});
    ok(nm[1][0]==='ホスト'&&nm[1][1]==='2Pさん'&&nm[1][2]==='3Pさん','名前を決めていない人の表示 '+JSON.stringify(nm));
    if(errs.length)fail.push('JSエラー '+errs.join(' / '));await c.close()}
  {const c=await b.newContext({viewport:{width:1000,height:700}});const p=await c.newPage();await p.route(/firebase|gstatic|googleapis/,r=>r.abort());
    await p.goto('file://'+path.resolve(__dirname,'index.html'));await p.waitForFunction(()=>!document.querySelector('#bCreate').disabled);await p.click('#bCreate');await p.waitForTimeout(400);
    ok(/招待文をコピー/.test(await p.locator('#bCopy').textContent()),'パソコンでは「招待文をコピー」のまま');await c.close()}
  }finally{await b.close()}
  if(fail.length){console.error('FAIL 通信対戦の画面まわり\n'+fail.join('\n'));process.exitCode=1}else console.log('PASS 通信対戦の画面まわり（名前の区別・招待を共有画面から送る）')})();
