// ホーム画面に追加・メニューの中断（2026-11-02）のテスト（Playwright・Chromium）
// 1) manifest.webmanifest・アイコン（180/192/512px）・head の manifest と apple-touch-icon  2) タイトル画面の「ホーム画面に追加」（48px以上）
// 3) iPhone・Android・アプリ内ブラウザーで案内の中身が変わる  4) Androidなどは確認画面（beforeinstallprompt）を出す  5) ホーム画面から開いているときはボタンを出さない
// 6) メニューに「ゲームを中断する」→中断の確認が出る
const {chromium}=require('playwright');const path=require('path'),fs=require('fs');
const fail=[];const ok=(c,m)=>{if(!c)fail.push(m)};
const UA={ios:'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1',android:'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Mobile Safari/537.36',line:'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Safari Line/14.0.0'};
(async()=>{let mf=null;try{mf=JSON.parse(fs.readFileSync('manifest.webmanifest','utf8'))}catch{}
  ok(mf&&mf.name==='ポコチャ電鉄・全国編'&&mf.display==='standalone'&&mf.start_url==='./'&&mf.icons.length>=2&&mf.icons.every(i=>fs.existsSync(i.src)),'manifest.webmanifest とアイコン');
  for(const [f,n] of [['icon-180.png',180],['icon-192.png',192],['icon-512.png',512]]){const b=fs.readFileSync(f);ok(b.readUInt32BE(16)===n&&b.readUInt32BE(20)===n,f+' の大きさ')}
  const src=fs.readFileSync('index.html','utf8'),head=src.slice(0,src.indexOf('<style>'));ok(/rel="manifest" href="manifest\.webmanifest"/.test(head)&&/rel="apple-touch-icon" href="icon-180\.png"/.test(head)&&/apple-mobile-web-app-title" content="ポコチャ電鉄・全国編"/.test(head),'head の manifest・アイコン・名前');
  const b=await chromium.launch();try{
  for(const [k,ua] of Object.entries(UA)){const c=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,userAgent:ua});const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
    await p.route(/firebase|gstatic|googleapis/,r=>r.abort());await p.goto('file://'+path.resolve('index.html'));await p.waitForFunction(()=>!document.querySelector('#bCreate').disabled);
    const bh=await p.evaluate(()=>{const e=document.querySelector('#bA2hs');return e&&!e.hidden?e.getBoundingClientRect().height:0});ok(bh>=48,k+' ホーム画面に追加ボタン '+bh);
    await p.click('#bA2hs');await p.waitForTimeout(300);const t=await p.evaluate(()=>document.querySelector('#ov:not([hidden]) .a2sheet')?document.querySelector('.a2sheet').innerText:'');
    ok(k==='ios'?/共有ボタン/.test(t)&&/ホーム画面に追加/.test(t)&&/Safariで開いたときとは別/.test(t):k==='android'?/︙/.test(t)&&/アプリをインストール/.test(t):/Safariで開く/.test(t),k+' 案内の中身 '+t.slice(0,80));
    await p.click('#a2Close');if(errs.length)fail.push(k+' JSエラー '+errs.join(' / '));await c.close()}
  {const c=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,userAgent:UA.android});const p=await c.newPage();await p.route(/firebase|gstatic|googleapis/,r=>r.abort());await p.goto('file://'+path.resolve('index.html'));await p.waitForFunction(()=>!document.querySelector('#bCreate').disabled);
    await p.evaluate(()=>{const e=new Event('beforeinstallprompt',{cancelable:true});e.prompt=()=>{window.__pr=(window.__pr||0)+1;return Promise.resolve()};e.userChoice=Promise.resolve({outcome:'accepted'});dispatchEvent(e)});
    await p.click('#bA2hs');await p.waitForTimeout(300);ok(await p.evaluate(()=>window.__pr===1&&document.querySelector('#ov').hidden),'Android：確認画面を出す（案内は出さない）');await c.close()}
  {const c=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});await c.addInitScript(()=>{const o=window.matchMedia.bind(window);window.matchMedia=q=>/display-mode: standalone/.test(q)?{matches:true,media:q,addEventListener(){},removeEventListener(){}}:o(q)});const p=await c.newPage();await p.route(/firebase|gstatic|googleapis/,r=>r.abort());await p.goto('file://'+path.resolve('index.html'));await p.waitForFunction(()=>!document.querySelector('#bCreate').disabled);
    ok(await p.evaluate(()=>document.querySelector('#bA2hs').hidden),'ホーム画面から開いているときはボタンを出さない');
    await p.click('#bCreate');await p.waitForTimeout(300);await p.click('#bStart');await p.waitForTimeout(2000);await p.click('#bMenu');await p.waitForTimeout(300);
    const mp=await p.evaluate(()=>{const b=document.querySelector('#mnPause');return b?[b.textContent,b.getBoundingClientRect().height]:null});ok(mp&&/ゲームを中断する/.test(mp[0])&&mp[1]>=44,'メニューの中断ボタン '+JSON.stringify(mp));
    await p.click('#mnPause');await p.waitForTimeout(500);ok(await p.evaluate(()=>/ここで中断しますか/.test(document.querySelector('#ov').innerText)),'中断の確認が出る');await c.close()}
  }finally{await b.close()}
  if(fail.length){console.error('FAIL ホーム画面に追加・中断\n'+fail.join('\n'));process.exitCode=1}else console.log('PASS ホーム画面に追加・中断（manifest・アイコン・案内・確認画面・ホーム画面では非表示・メニューの中断）')})();
