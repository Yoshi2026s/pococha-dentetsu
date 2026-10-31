// 小さい画面・押しやすさの見直し 第7弾（2026-10-31）の回帰テスト（Playwright・Chromium のスマホ表示エミュレーション）
// 1) 320×568（iPhone SE 初代）で、地図・手番の表示・下の操作欄が重ならない  2) 道の候補の「📍マス名」が1行
// 3) 音と設定のつまみ・チェックの行が48px  4) ジャストカードの目が3×2・48px  5) 物件の一括獲得の確認の文
// 6) ランクアップ・ランクダウンが複数人のときは1枚にまとめる（コード）  7) 待ち時間の設定・ホスト切断の文がわかりやすい
const {chromium}=require('playwright');const path=require('path'),fs=require('fs');
const fail=[];const ok=(c,m)=>{if(!c)fail.push(m)};
(async()=>{const src=fs.readFileSync('index.html','utf8');
  ok(/table class="rkups"/.test(src)&&/ups\.length>1/.test(src)&&/dns\.length===1\?/.test(src),'ランクの変化のまとめ表示');
  ok(src.includes('操作がないときCPUが代わるまで')&&!src.includes('切断判定は最後の通信確認から'),'待ち時間の設定の文');
  ok(src.includes('ホストの通信が切れています')&&!src.includes('ホストとの接続を確認中です'),'ホスト切断の文');
  ok(src.includes('決算で増える額')&&!src.includes('毎日のゴールドが増える量'),'一括獲得の確認の文');
  const b=await chromium.launch();try{
  const c=await b.newContext({viewport:{width:320,height:568},isMobile:true,hasTouch:true});const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
  await p.route(/firebase|gstatic|googleapis/,r=>r.abort());await p.goto('file://'+path.resolve('index.html'));await p.waitForFunction(()=>!document.querySelector('#bCreate').disabled);
  await p.click('#bCreate');await p.waitForTimeout(300);await p.click('#bStart');await p.waitForTimeout(2500);
  const L=await p.evaluate(()=>{const r=s=>document.querySelector(s).getBoundingClientRect();const m=r('#mapbox'),t=r('#turnText'),b=r('#bar');return {mb:m.bottom,tt:t.top,tb:t.bottom,bt:b.top,mh:m.height}});
  ok(L.mb<=L.tt+1&&L.tb<=L.bt+1&&L.mh>=130,'320×568で地図・手番・操作欄が重なる '+JSON.stringify(L));
  await p.click('#bMenu');await p.waitForTimeout(300);await p.click('#mnSet');await p.waitForTimeout(700);
  const hs=await p.evaluate(()=>[...document.querySelectorAll('#ov .sheet label')].filter(l=>l.querySelector('input[type=range],input[type=checkbox]')).map(l=>Math.round(l.getBoundingClientRect().height)));ok(hs.length>=6&&hs.every(h=>h>=48),'設定の行が48px未満 '+hs);
  await p.evaluate(()=>{const o=document.querySelector('#ov');o.hidden=true;o.innerHTML=''});
  await p.evaluate(()=>{pending.st.players[curSeat(pending.st)].hand=['just'];render()});await p.click('#bCard');await p.waitForTimeout(400);await p.click('#ov .cardbtn');await p.waitForTimeout(400);
  const jb=await p.evaluate(()=>{const r=[...document.querySelectorAll('#justPick .jbtn')].map(b=>b.getBoundingClientRect());return {h:r.map(x=>Math.round(x.height)),rows:new Set(r.map(x=>Math.round(x.top))).size}});ok(jb.h.length===6&&jb.h.every(h=>h>=48)&&jb.rows===2,'ジャストカードの目 '+JSON.stringify(jb));
  await p.evaluate(()=>{const o=document.querySelector('#ov');o.hidden=true;o.innerHTML=''});
  await p.click('#bRoll');await p.waitForFunction(()=>pending&&pending.stage==='route',null,{timeout:8000});await p.waitForTimeout(400);
  const rk=await p.evaluate(()=>[...document.querySelectorAll('#routeOpts .ob-k')].map(k=>new Set([...k.getClientRects()].map(x=>Math.round(x.top))).size));ok(rk.every(n=>n===1),'📍マス名が2行に分かれる '+rk);/* 候補に止まるマスがない（この先も分かれ道）回は数0で合格 */
  if(errs.length)fail.push('JSエラー '+errs.join(' / '));await c.close()
}finally{await b.close()}
  if(fail.length){console.error('FAIL 小さい画面・押しやすさの見直し 第7弾\n'+fail.join('\n'));process.exitCode=1}else console.log('PASS 小さい画面・押しやすさの見直し 第7弾（320×568の配置・📍マス名・設定の行・ジャストカード・確認の文・ランクのまとめ・待ち時間の文）')})();
