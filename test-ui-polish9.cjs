// 見た目の改善（2026-11-01）のテスト（Playwright・Chromium）
// 1) 行動ログをたたんでいる間も、いちばん新しい行動を1行見せる（左側だけ・コメントと重ならない）。広げると隠れる
// 2) 「全体を見る」ボタンは高さ48px以上  3) 順位の行の「総G」は11px以上
// 4) 正式タイトル「ポコチャ電鉄・全国編」（タブ・ロゴ・ホーム画面名・招待文）。「対戦テスト」の表記なし
const {chromium}=require('playwright');const path=require('path');
const fail=[];const ok=(c,m)=>{if(!c)fail.push(m)};
(async()=>{const src=require('fs').readFileSync('index.html','utf8');ok(/<title>ポコチャ電鉄・全国編<\/title>/.test(src)&&/aria-label="ポコチャ電鉄・全国編"/.test(src)&&/data-t="全国編">全国編</.test(src)&&/web-app-title" content="ポコチャ電鉄・全国編"/.test(src)&&/【ポコチャ電鉄・全国編 オンライン対戦のお誘い】/.test(src)&&!/対戦テスト/.test(src),'正式タイトル');
  const b=await chromium.launch();try{for(const [W,H] of [[390,844],[320,568]]){const tag=W+'×'+H;
  const c=await b.newContext({viewport:{width:W,height:H},isMobile:true,hasTouch:true});const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
  await p.route(/firebase|gstatic|googleapis/,r=>r.abort());await p.addInitScript(()=>{try{localStorage.setItem('poco-set',JSON.stringify({bgm:0,se:0,fast:true}))}catch{}});
  await p.goto('file://'+path.resolve('index.html'));await p.waitForFunction(()=>!document.querySelector('#bCreate').disabled);await p.click('#bCreate');await p.waitForTimeout(300);await p.click('#bStart');await p.waitForTimeout(1500);
  const t0=Date.now();while(Date.now()-t0<60000){await p.waitForTimeout(250);if(await p.evaluate(()=>dispState&&dispState.turn>=2&&!document.querySelector('#lpLast:empty')&&pending&&pending.stage==='act'))break;
    const st=await p.evaluate(()=>pending&&pending.stage);if(st==='act')await p.click('#bRoll').catch(()=>{});else if(st==='route')await p.click('#bAuto').catch(()=>{});else if(st==='buy')await p.click('#bSkip').catch(()=>{});else if(st==='shop')await p.click('#bShopOk').catch(()=>{});else if(st==='reward')await p.click('#bRwCoin').catch(()=>{});const ac=await p.$('#acOk');if(ac&&await ac.isVisible().catch(()=>false))await ac.click().catch(()=>{})}
  /* 分かれ道を選ぶ間は行動ログを隠すので、選び終えてから確かめる */for(let i=0;i<40&&await p.evaluate(()=>pending&&pending.stage==='route');i++){await p.click('#bAuto').catch(()=>{});await p.waitForTimeout(300)}
  await p.evaluate(()=>comments('good',3));await p.waitForTimeout(900);
  const a=await p.evaluate(()=>{const e=document.querySelector('#lpLast'),r=e.getBoundingClientRect(),first=document.querySelector('#log li:not(.muted) span:not(.n)'),cm=document.querySelector('#cmts').getBoundingClientRect(),cs=getComputedStyle(e);
    return{txt:e.textContent,same:!!first&&first.textContent===e.textContent,vis:cs.display!=='none'&&r.height>0,right:r.right,cmL:cm.width?cm.left:9999,fs:parseFloat(cs.fontSize)}});
  ok(a.txt&&a.same&&a.vis&&a.right<=a.cmL+1&&a.fs>=12,tag+' たたんだ行動ログの最新1行 '+JSON.stringify(a));
  await p.click('#logPanel');await p.waitForTimeout(200);ok(await p.evaluate(()=>getComputedStyle(document.querySelector('#lpLast')).display==='none'),tag+' 広げると最新1行は隠れる');await p.click('#logPanel');
  const v=await p.evaluate(()=>{const r=document.querySelector('#bView').getBoundingClientRect(),t=document.querySelector('#status .pl-tot small');return[r.height,t?parseFloat(getComputedStyle(t).fontSize):0]});
  ok(v[0]>=48,tag+' 全体を見るボタンの高さ '+v[0]);ok(v[1]>=11,tag+' 総Gの文字 '+v[1]);
  if(errs.length)fail.push(tag+' JSエラー '+errs.join(' / '));await c.close()}}finally{await b.close()}
  if(fail.length){console.error('FAIL 見た目の改善9\n'+fail.join('\n'));process.exitCode=1}else console.log('PASS 見た目の改善9（行動ログの最新1行・全体を見るボタン48px・総Gの文字・正式タイトル）')})();
