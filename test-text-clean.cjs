// 表記・説明の見直し（2026-11-03）のテスト（Playwright・Chromium・iPhone幅375px）
// 間違い・古い説明・重複が残っていないか、直した説明が出ているかを確かめる
const {chromium}=require('playwright');const path=require('path');
const fail=[];const ok=(c,m)=>{if(!c)fail.push(m)};
(async()=>{const b=await chromium.launch();try{const c=await b.newContext({viewport:{width:375,height:667},isMobile:true,hasTouch:true});const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
  await p.route(/firebase|gstatic|googleapis/,r=>r.abort());await p.addInitScript(()=>{try{localStorage.setItem('poco-set',JSON.stringify({bgm:0,se:0,fast:true}))}catch{}});
  await p.goto('file://'+path.resolve(__dirname,'index.html'));await p.waitForFunction(()=>!document.querySelector('#bCreate').disabled);
  const cl=()=>p.evaluate(()=>{const o=document.querySelector('#ov');o.hidden=true;o.innerHTML=''});
  const lobby=await p.evaluate(()=>document.querySelector('#vLobby').innerText);
  await p.click('#bHow');let how='';for(let i=0;i<8;i++){await p.waitForTimeout(120);how+=await p.evaluate(()=>document.querySelector('#ov').innerText);const n=await p.$('#hNext');if(!n)break;await n.click()}await cl();
  await p.click('#bSys');let sys='';for(let i=0;i<16;i++){await p.waitForTimeout(120);sys+=await p.evaluate(()=>document.querySelector('#ov').innerText);const n=await p.$('#sysNext:not([disabled])');if(!n)break;await n.click()}await cl();
  const data=await p.evaluate(()=>({gc:CARDD?CARDD.goalchange:'',ev:Object.keys(EVD).map(k=>EVD[k]).join('\n')})).catch(()=>({gc:'',ev:''}));
  // 間違い・古い説明が残っていない
  for(const [t,src,m] of [[/「おまかせ」は最短の道/,how,'遊び方：おまかせは最短ではない'],[/プレイヤーの場所とは関係なし/,how,'遊び方：不要な補足'],[/「⏸ 中断する」/,how,'遊び方：メニューのボタン名と違う'],
    [/取りつくことがあります|誰かに取りつきます/,sys,'システム説明：取りつく相手があいまい'],[/サイコロが増えるカードを使うと/,sys,'システム説明：不要な説明'],[/ピンチでもありチャンス/,sys,'システム説明：表と重複'],
    [/たたんでいる間も最新/,sys,'システム説明：行動ログの説明が長い'],[/この地域限定」としてまとめ/,sys,'システム説明：ショップの説明が長い'],[/九州・沖縄から全国/,sys,'システム説明：出発地があいまい'],
    [/コアファンはリセット/,data.gc,'目的地チェンジ：今はコアファンが戻らない'],[/マスの人数のコアファン|最低でも1人は増える/,data.ev,'コアファンイベントの説明が分かりにくい'],[/続きの部屋に入ります/,lobby,'タイトル：参加ボタンの説明があいまい']])ok(!t.test(src),m);
  // 重複していた説明は1回だけ
  ok((sys.match(/その日に増えた量」?で数えます/g)||[]).length===1,'システム説明：「その日に増えた量で数えます」が重複');
  // 直した説明が出ている
  ok(/ぴったり止まって1番乗り/.test(how)&&/いちばん得な道/.test(how)&&/A・B・C/.test(how),'遊び方：1番乗り・おまかせの説明');
  ok(/目的地からいちばん遠い人/.test(how)&&/目的地からいちばん遠い人/.test(sys),'取りつく相手の説明');
  ok(/通信対戦では持ち時間/.test(sys),'システム説明：持ち時間は通信対戦だけ');
  await p.click('#bCreate');await p.waitForTimeout(300);await p.click('#bStart');await p.waitForTimeout(1800);
  ok(/全\d+手番・/.test(await p.evaluate(()=>document.querySelector('#turnText').textContent)),'手番の表示が「全◯手番」になっていない');
  if(errs.length)fail.push('JSエラー '+errs.join(' / '));await c.close()}finally{await b.close()}
  if(fail.length){console.error('FAIL 表記・説明の見直し\n'+fail.join('\n'));process.exitCode=1}else console.log('PASS 表記・説明の見直し（間違い・重複・分かりにくい説明を修正）')})();
