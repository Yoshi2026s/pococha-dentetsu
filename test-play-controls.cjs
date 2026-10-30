// 操作まわりの修正（2026-10-30）を確かめる（端末内モード・Playwright・iPhone SE幅 375×667）
// 1) 目的地に着いて賞金をもらったら、獲得・ショップの画面を待たずに上の状態一覧へ反映される
// 2) 物件の多い駅でも「買えるだけ買う」「獲得する」「獲得しない」が画面内にあり押せる。確認画面の全件と「この内容で獲得する」も画面内
// 3) 離席（画面を閉じる）から戻ったとき、自分の番の待ち時間が数え直され、CPU代行に回らない
// 実行：node test-play-controls.cjs
const {chromium}=require('playwright');const path=require('path');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:375,height:667},isMobile:true,hasTouch:true});const errs=[];p.on('pageerror',e=>errs.push(e.message));
  await p.route(/gstatic\.com|firebase-config|fonts\.(googleapis|gstatic)/,r=>r.abort());
  await p.goto('file://'+path.resolve('index.html'));await p.waitForTimeout(800);
  await p.evaluate(()=>{SET.fast=true});await p.click('#bCreate');await p.waitForTimeout(400);await p.click('#bStart');
  const waitFor=async(fn,ms,label)=>{const t0=Date.now();while(Date.now()-t0<ms){if(await p.evaluate(fn))return true;await p.waitForTimeout(200)}throw Error('待ち時間切れ：'+label)};
  const fail=[];const ok=(c,m)=>{if(!c)fail.push(m)};
  try{
    await waitFor(()=>!!(pending&&pending.stage==='act'),30000,'最初の自分の番');
    for(let i=0;i<5;i++){const c=await p.$('#ov:not([hidden]) button');if(!c)break;await c.click().catch(()=>{});await p.waitForTimeout(300)}
    // 1) 目的地の1マス手前から目的地へ進む手番を作り、演出中の状態一覧の所持金を見る
    const r1=await p.evaluate(async()=>{const base=JSON.parse(JSON.stringify(pending.st)),seat=curSeat(base),g=base.goal;
      for(let tr=0;tr<60;tr++){const st=JSON.parse(JSON.stringify(base));st.players[seat].pos=ADJ[g][tr%ADJ[g].length];st.rng=tr*7;
        let pv;try{pv=preview(st,{type:'roll',route:[g]})}catch(e){continue}if(!pv.goal)continue;
        pending.st=st;const before=st.players[seat].coin;finishChoice({type:'roll',route:[g]});await new Promise(r=>setTimeout(r,300));
        return {before,view:pending&&pending.view?pending.view.players[seat].coin:null,shown:lastCoins[seat],prize:pv.goal.v,stage:pending&&pending.stage}}return null});
    ok(r1,'目的地に着く手番を作れない');
    if(r1){ok(r1.view!=null&&r1.view>=r1.before+r1.prize,'表示用の盤面に賞金が入っていない '+JSON.stringify(r1));ok(r1.shown===r1.view,'状態一覧の所持金に賞金が反映されていない '+JSON.stringify(r1))}
    // 演出と、そのあとの獲得・ショップ画面を片づけて次の自分の番を待つ
    for(let i=0;i<40;i++){const st=await p.evaluate(()=>pending?pending.stage:'');if(st==='act')break;
      if(st==='buy')await p.click('#bSkip').catch(()=>{});else if(st==='shop')await p.click('#bShopSkip').catch(()=>p.click('#bShopOk').catch(()=>{}));else if(st==='reward')await p.click('#bRwCoin').catch(()=>{});
      const c=await p.$('#ov:not([hidden]) button');if(c)await c.click().catch(()=>{});await p.waitForTimeout(500)}
    await waitFor(()=>!!(pending&&pending.stage==='act'),60000,'次の自分の番');
    // 2) 物件のいちばん多い駅で、獲得の画面を開く
    const n=await p.evaluate(()=>{let k=0;NODES.forEach((n,i)=>{if(n.bases&&n.bases.length>(NODES[k].bases||[]).length)k=i});const seat=curSeat(pending.st);
      pending.stage='buy';pending.base={type:'roll'};pending.pv={pos:k,nd:NODES[k],own:NODES[k].bases.map(()=>null),coin:5e6,seat};pending.sel=new Set();drawBaseList();render();return NODES[k].bases.length});
    await p.waitForTimeout(400);
    const vis=sel=>p.evaluate(s=>{const e=document.querySelector(s);if(!e)return false;const r=e.getBoundingClientRect();if(r.top<0||r.bottom>innerHeight+1||!r.height)return false;const t=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);return !!t&&(t===e||e.contains(t))},sel);
    for(const s of ['#bBuyAll','#bBuy','#bSkip'])ok(await vis(s),s+' が画面外か隠れていて押せない');
    ok(await p.evaluate(()=>getComputedStyle(document.querySelector('.bar .toprow')).display==='none'),'獲得の画面でメニュー欄が出たまま');
    await p.click('#bBuyAll');await p.waitForTimeout(300);
    ok(await vis('#cfOk'),'確認画面の「この内容で獲得する」が画面外');
    ok(await p.evaluate(n=>document.querySelectorAll('#ov .conf-row').length===n,n),'確認画面に全件が並んでいない');
    ok(await p.evaluate(()=>{const l=document.querySelector('#ov .conf-list');return l.scrollHeight<=l.clientHeight+2}),'確認画面の物件一覧が見切れている（375×667）');
    await p.click('#cfNo');await p.evaluate(()=>{pending.stage='act';pending.pv=null;render()});await p.waitForTimeout(200);
    // 3) 自分の番で待ち時間が過ぎた状態から、画面を開き直す
    const r3=await p.evaluate(()=>{const t=curTip();tipSeenAt.set(t.id,Date.now()-80000);awayTurn=t.turn;backFromAway();return Date.now()-tipSeenAt.get(t.id)});
    ok(r3<2000,'戻ったときに待ち時間が数え直されていない '+r3);
  }catch(e){fail.push(e.message)}
  if(errs.length)fail.push('JSエラー：'+errs.join(' / '));
  await b.close();
  if(fail.length){console.log('FAIL 操作まわり\n'+fail.join('\n'));process.exit(1)}
  console.log('PASS 操作まわり3項目（賞金の即時反映・物件の多い駅の獲得画面・離席から戻ったときの操作）')})();
