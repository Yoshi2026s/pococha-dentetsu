// 行動の見やすさ・荒らしラグ王の分かりやすさ（2026-11-01）のテスト（Playwright・Chromium）
// 1) 行動ログ：手番ごとに名前（席の色）・ゴールドの増減・できごと（アイコンつき1行ずつ）。演出が終わった手番まで（先出ししない）
// 2) たたんだ行動ログの1行にも名前・増減・できごと  3) プレイヤー欄をタップ→「最近の手番」（その人の手番だけ）
// 4) 荒らしラグ王：取りつかれた人の番の表示・プレイヤー欄の「😈お邪魔」・コマの上の😈・いたずらは専用のカード・名前で表示
const {chromium}=require('playwright');const path=require('path'),fs=require('fs');
const fail=[];const ok=(c,m)=>{if(!c)fail.push(m)};
(async()=>{const src=fs.readFileSync('index.html','utf8');
  ok(/const miP=showOverlay\(`<div class="trollbig glitchy">\$\{trollSvg\(big\)\}<\/div><p class="eyebrow tr-eb">/.test(src)&&/await miP\}/.test(src),'いたずらは専用のカード');
  ok(/<p class="tr-who">\$\{esc\(nameize\(tr\.t\)\)\}<\/p><p class="tr-help">/.test(src),'登場のカードは名前で・いたずらの説明つき');
  ok(/いたずらを防いだ！/.test(src),'ブロックで防いだときの表示');
  const b=await chromium.launch();try{for(const [W,H] of [[390,844],[320,568]]){const tag=W+'×'+H;
  const c=await b.newContext({viewport:{width:W,height:H},isMobile:true,hasTouch:true});const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
  await p.route(/firebase|gstatic|googleapis/,r=>r.abort());await p.addInitScript(()=>{try{localStorage.setItem('poco-set',JSON.stringify({bgm:0,se:0,fast:true}))}catch{}});
  await p.goto('file://'+path.resolve('index.html'));await p.waitForFunction(()=>!document.querySelector('#bCreate').disabled);await p.click('#bCreate');await p.waitForTimeout(300);await p.click('#bStart');await p.waitForTimeout(1500);
  const t0=Date.now();while(Date.now()-t0<80000){await p.waitForTimeout(250);if(await p.evaluate(()=>dispState&&dispState.turn>=5&&pending&&pending.stage==='act'))break;const st=await p.evaluate(()=>pending&&pending.stage);if(st==='act')await p.click('#bRoll').catch(()=>{});else if(st==='route')await p.click('#bAuto').catch(()=>{});else if(st==='buy')await p.click('#bSkip').catch(()=>{});else if(st==='shop')await p.click('#bShopOk').catch(()=>{});else if(st==='reward')await p.click('#bRwCoin').catch(()=>{});const ac=await p.$('#acOk');if(ac&&await ac.isVisible().catch(()=>false))await ac.click().catch(()=>{})}
  await p.waitForTimeout(500);
  const lg=await p.evaluate(()=>{const lis=[...document.querySelectorAll('#log li:not(.muted)')];const turns=lis.map(l=>+l.querySelector('.n').textContent.slice(1));
    return{n:lis.length,maxT:Math.max(...turns),ds:dispState.turn,who:lis.every(l=>{const w=l.querySelector('.lg-who');return w&&w.textContent&&w.style.color}),ev:lis.every(l=>l.querySelector('.lg-ev i')),moveIc:lis.some(l=>/^🎲\d/.test((l.querySelector('.lg-move i')||{}).textContent||'')),
      delta:lis.some(l=>l.querySelector('.lg-d')),deltaOk:[...document.querySelectorAll('#log .lg-d')].every(e=>/^[＋−][\d,]+G$/.test(e.textContent)),pv:document.querySelector('#lpLast').innerHTML.includes('lg-who')}});
  ok(lg.n>=3&&lg.who&&lg.ev&&lg.moveIc,tag+' 行動ログの名前・アイコン '+JSON.stringify(lg));ok(lg.delta&&lg.deltaOk,tag+' ゴールドの増減 '+JSON.stringify(lg));ok(lg.maxT<=lg.ds,tag+' 演出前の手番を先出ししない '+JSON.stringify(lg));ok(lg.pv,tag+' たたんだ1行にも名前');
  const seat=await p.evaluate(()=>{const s=[0,1,2,3].find(i=>i!==mySeat()&&recentTurns(i,3).length);return s==null?-1:s});
  if(seat>=0){await p.click(`#status .pl[data-seat="${seat}"]`);await p.waitForTimeout(400);
    const pr=await p.evaluate(s=>{const box=document.querySelector('#ov:not([hidden]) .pl-recent');if(!box)return null;const ts=[...box.querySelectorAll('.n')].map(e=>+e.textContent.slice(1));return{n:ts.length,mine:ts.every(t=>{const r=[...records.values()].find(x=>x.turn===t&&x.state);return r&&r.state.lastSeat===s})}},seat);
    ok(pr&&pr.n>=1&&pr.n<=3&&pr.mine,tag+' 最近の手番 '+JSON.stringify(pr));await p.evaluate(()=>{const b=document.querySelector('#bPClose');b&&b.click()})}else fail.push(tag+' 最近の手番を確かめる相手がいない');
  const tr=await p.evaluate(()=>{const tp=curTip().state,cs=curSeat(tp),old=tp.troll;dispState.troll=cs;tp.troll=cs;drawPawns(dispState);render();const pw=document.querySelector('#pw'+cs+' .pw-tr');const mk=document.querySelector(`#status .pl[data-seat="${cs}"] .trollmark`);
    const tt=document.querySelector('#turnText').textContent;dispState.troll=null;tp.troll=old;drawPawns(dispState);render();return{pw:!!pw,mk:mk&&mk.textContent,tt:/ラグ王が取りついています/.test(tt),gone:!document.querySelector('.pw-tr')}});
  ok(tr.pw&&tr.mk==='😈お邪魔'&&tr.tt&&tr.gone,tag+' 取りつき中の表示 '+JSON.stringify(tr));
  if(errs.length)fail.push(tag+' JSエラー '+errs.join(' / '));await c.close()}}finally{await b.close()}
  if(fail.length){console.error('FAIL 行動の見やすさ・荒らしラグ王\n'+fail.join('\n'));process.exitCode=1}else console.log('PASS 行動の見やすさ・荒らしラグ王（行動ログ・最近の手番・取りつき中の表示・いたずらのカード）')})();
