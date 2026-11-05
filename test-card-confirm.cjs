// カードを使う前の確認（2026.11.05.20・押し間違え防止）（Playwright・Chromium・iPhone SE 縦／iPhone 13 横）
// 1) カードを押すと確認（名前・効果・「使う」「やめる」）が出て、まだ使われない  2) 「やめる」で一覧に戻り、手札はそのまま
// 3) 「使う」で使われる  6) 一覧と確認に目的地（とフィーバー駅）までの残りマス
//   4) ジャストカードは、マス数を選ぶ手順がそのまま確認になる（確認は出さない）  5) ボタンは48px以上・はみ出さない
const {chromium,devices}=require('playwright');const path=require('path'),assert=require('assert');
(async()=>{const b=await chromium.launch();let code=0;try{for(const name of ['iPhone SE','iPhone 13 landscape']){const c=await b.newContext({...devices[name]});const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
  await p.route(/firebase|gstatic|googleapis/,r=>r.abort());await p.addInitScript(()=>{try{localStorage.setItem('poco-set',JSON.stringify({bgm:0,se:0,fast:true}))}catch{}});
  await p.goto('file://'+path.resolve('index.html'));await p.waitForFunction(()=>!document.querySelector('#bCreate').disabled);await p.click('#bCreate');await p.waitForTimeout(300);await p.click('#bStart');
  await p.waitForFunction(()=>pending&&pending.stage==='act',null,{timeout:20000});
  await p.evaluate(()=>{const s=pending.st;s.players[curSeat(s)].hand=['smallyell','express','just'];render()});
  const hand=()=>p.evaluate(()=>pending&&pending.st.players[curSeat(pending.st)].hand.join(','));
  await p.click('#bCard');await p.waitForTimeout(300);assert(await p.evaluate(()=>document.querySelector('#ov .cs-hint').textContent.includes('使う前に確かめます')),name+' 一覧の案内が古い');
  /* 残りマス（2026.11.05.20）：一覧と確認の両方に、目的地（とフィーバー駅）まであと何マス */const want=await p.evaluate(()=>{const s=pending.st,pos=s.players[curSeat(s)].pos;return{g:NODES[s.goal].name+'まで あと'+D(s.goal)[pos]+'マス',f:s.fv?NODES[s.fever].name+'まで あと'+D(s.fever)[pos]+'マス':''}});
  const gl=await p.evaluate(()=>(document.querySelector('#ov .cardsheet .cs-goal')||{}).textContent||'');assert(gl.includes(want.g)&&gl.includes(want.f),name+' 一覧に残りマスが無い：'+gl+' / '+JSON.stringify(want));
  await p.click('#ov .cardbtn[data-k="smallyell"]');await p.waitForTimeout(300);
  const cf=await p.evaluate(()=>{const o=document.querySelector('#ov .cardconf');if(!o)return null;const bs=[...o.querySelectorAll('.cc-row button')].map(e=>{const r=e.getBoundingClientRect();return[r.width,r.height,e.textContent]});const r=o.getBoundingClientRect(),cr=o.querySelector('.cc-card').getBoundingClientRect(),inCard=cr.left>=r.left&&cr.right<=r.right+0.5;
    return{t:o.textContent,bs,fit:r.right<=innerWidth&&r.left>=0&&document.documentElement.scrollWidth<=innerWidth&&inCard,stage:pending&&pending.stage}});
  assert(cf,name+' 確認が出ない');assert(cf.t.includes(want.g),name+' 確認に残りマスが無い');assert(cf.t.includes(await p.evaluate(()=>CARDN.smallyell))&&cf.t.includes(await p.evaluate(()=>CARDD.smallyell)),name+' 確認に名前・効果が無い');
  assert(cf.bs.length===2&&cf.bs.every(([w,h])=>w>=48&&h>=48),name+' ボタンが小さい '+JSON.stringify(cf.bs));assert(cf.fit,name+' はみ出した');assert.equal(cf.stage,'act',name+' 確認だけで使われた');
  assert.equal(await hand(),'smallyell,express,just',name+' 確認の時点で手札が減った');
  await p.click('#ccNo');await p.waitForTimeout(300);assert(await p.evaluate(()=>!!document.querySelector('#ov .cardsheet')&&!document.querySelector('#ov .cardconf')),name+' やめるで一覧に戻らない');assert.equal(await hand(),'smallyell,express,just');
  /* ジャストカード：押すとマス数を選ぶ（確認は出さない） */await p.click('#ov .cardbtn[data-k="just"]');await p.waitForTimeout(300);assert(await p.evaluate(()=>!document.querySelector('#ov .cardconf')&&!document.querySelector('#justPick').hidden),name+' ジャストカードの手順が変わった');
  await p.click('#ov .cardbtn[data-k="express"]');await p.waitForTimeout(300);await p.click('#ccOk');await p.waitForTimeout(800);
  assert(await p.evaluate(()=>!pending||pending.stage!=='act'||!pending.st.players[curSeat(pending.st)].hand.includes('express')),name+' 使うで使われない');
  assert.deepEqual(errs,[],name+' エラー：'+errs.join(' / '));await c.close()}
  console.log('PASS カードを使う前の確認')}catch(e){console.error('NG',e.message);code=1}finally{await b.close();process.exit(code)}})();
