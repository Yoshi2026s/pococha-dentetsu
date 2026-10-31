// 見やすさ・表記の見直し 第4弾（2026-10-31）の回帰テスト（Playwright・Chromium のスマホ表示エミュレーション）
// 1) 手番の表示に日時を重ねて出さない（日時は地図の左上）  2) 検算OKは出さない  3) 空席に「—」の札を出さない  4) 部屋コードの説明が短い
// 5) 道の候補の文字が12px・📍で止まるマス  6) メニューの音ボタンが「音：オン」と押した状態を持つ  7) カードを開いているときお知らせは下に出る
// 8) 決算・最終結果のグラフの名札が「1P」でなく名前  9) 行動ログの文字が12px
const {chromium}=require('playwright');const path=require('path');
const fail=[];const ok=(c,m)=>{if(!c)fail.push(m)};
(async()=>{const b=await chromium.launch();try{
  const c=await b.newContext({viewport:{width:360,height:740},isMobile:true,hasTouch:true});const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
  await p.route(/firebase|gstatic|googleapis/,r=>r.abort());await p.goto('file://'+path.resolve('index.html'));await p.waitForFunction(()=>!document.querySelector('#bCreate').disabled);
  ok((await p.locator('#codeHelp').textContent()).length<=60,'部屋コードの説明が長い');
  await p.click('#bCreate');await p.waitForTimeout(300);
  ok(await p.evaluate(()=>[...document.querySelectorAll('#seats .seat')].filter(s=>/空席/.test(s.textContent)).every(s=>!/—/.test(s.textContent))),'空席に「—」が出ている');
  await p.click('#bStart');await p.waitForTimeout(2500);
  const tt=await p.locator('#turnText').textContent();ok(/^第\d+手番/.test(tt)&&!/日目|:00/.test(tt)&&tt.includes('あなたの番'),'手番の表示 '+tt);
  ok(!(await p.locator('#verify').textContent()).trim(),'検算OKが出ている');
  ok(await p.evaluate(()=>getComputedStyle(document.querySelector('#log')).fontSize==='12px'),'行動ログの文字が12pxでない');
  ok(await p.evaluate(()=>{const g=assetChart([[1e4,1e4,1e4,1e4],[2e4,1.5e4,1.2e4,1.1e4]]);return !/>[1-4]P</.test(g)&&g.includes('>'+pawnLabels()[0]+'<')}),'グラフの名札が1Pのまま');
  await p.click('#bMenu');await p.waitForTimeout(400);const sb=await p.evaluate(()=>{const b=document.querySelector('#mnSound');return [b.textContent,b.getAttribute('aria-pressed')]});ok(/音：(オン|オフ)/.test(sb[0])&&/true|false/.test(sb[1]),'音ボタンの表示 '+sb);
  const tp=await p.evaluate(()=>{toast('テスト');const t=document.querySelector('#toast').getBoundingClientRect();return t.top>innerHeight*.6});ok(tp,'カードを開いているのにお知らせが上に出る');
  await p.evaluate(()=>{const o=document.querySelector('#ov');o.hidden=true;o.innerHTML='';document.querySelector('#toast').hidden=true});
  await p.click('#bRoll');await p.waitForFunction(()=>pending&&pending.stage==='route',null,{timeout:8000});await p.waitForTimeout(400);
  const ro=await p.evaluate(()=>[...document.querySelectorAll('#routeOpts .ob-t small')].map(s=>getComputedStyle(s).fontSize+(/止まる：/.test(s.textContent)?'!':'')));ok(ro.length&&ro.every(x=>x==='12px'),'道の候補の文字 '+ro);
  if(errs.length)fail.push('JSエラー '+errs.join(' / '));await c.close()
}finally{await b.close()}
  if(fail.length){console.error('FAIL 見やすさ・表記の見直し 第4弾\n'+fail.join('\n'));process.exitCode=1}else console.log('PASS 見やすさ・表記の見直し 第4弾（手番表示・検算・空席・説明文・道の候補・音ボタン・お知らせの位置・グラフの名札・行動ログ）')})();
