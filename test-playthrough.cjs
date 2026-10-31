// 通しプレイ自動テスト：端末内モードのCPU対戦を、iPhone幅のブラウザで最後（最終結果）まで自動操作する。※Playwright（Chromium）が必要。
// 道選択（A/B/C・おまかせ）、コアファン獲得、カード、ショップ、報酬、売却を乱数で選び、JSエラー・止まった場面・横はみ出しを記録する。
// 実行：node test-playthrough.cjs [幅...]（省略時 360 390 430）。1日・演出はやめ設定で1幅あたり約2分。
// 環境変数：DAYS=遊ぶ日数(1) FAST=0で通常速度 SEED=操作の乱数 PAUSE_AT=n（自分のn手目の前に中断→再読込→続きから→再開）
//           POST=rematch（最終結果で再招待→開始まで確認） OUT=画像の保存先（既定は一時フォルダ）
// 合格条件：全幅で最終結果まで到達し、JSエラー・停止・持続する横はみ出しが0件。実機のタッチ・音・通信対戦は対象外。
const {chromium}=require('playwright');const http=require('http'),fs=require('fs'),path=require('path'),os=require('os');
const ROOT=__dirname,WIDTHS=process.argv.slice(2).map(Number).filter(Boolean),DAYS=process.env.DAYS||'1',FAST=process.env.FAST!=='0',PAUSE_AT=+process.env.PAUSE_AT||0,POST=process.env.POST||'ok';
const OUT=process.env.OUT||fs.mkdtempSync(path.join(os.tmpdir(),'pd-play-'));
const srv=http.createServer((q,s)=>{let p=decodeURIComponent(q.url.split('?')[0]);if(p==='/')p='/index.html';
  if(p==='/firebase-config.js'){s.writeHead(200,{'content-type':'text/javascript'});return s.end('')}// 設定なし＝端末内モード
  fs.readFile(path.join(ROOT,path.normalize(p)),(e,b)=>{if(e){s.writeHead(404);return s.end()}s.writeHead(200,{'content-type':p.endsWith('.js')?'text/javascript':'text/html'});s.end(b)})});

async function play(br,port,W,seed){
  let rnd=seed;const R=()=>{rnd=(rnd*1103515245+12345)%2147483648;return rnd/2147483648};
  const ctx=await br.newContext({viewport:{width:W,height:W<400?780:932},deviceScaleFactor:2,isMobile:true,hasTouch:true});const page=await ctx.newPage();
  const issues=[],clicks={};let shots=0;const shot=n=>page.screenshot({path:path.join(OUT,`${W}-${n}-${++shots}.png`)}).catch(()=>{});
  const log=(k,m)=>{issues.push({k,m});console.log(`  [${W}px ${k}] ${m}`)};
  page.on('pageerror',e=>log('JSエラー',e.message));
  page.on('console',m=>{const t=m.text();if(m.type()==='error'&&!/ERR_FAILED|ERR_INTERNET|net::/.test(t))log('console',t.slice(0,200))});
  await page.route(/www\.gstatic\.com\/firebasejs/,r=>r.abort());
  await page.addInitScript(f=>{try{localStorage.setItem('poco-set',JSON.stringify({bgm:0,se:0,fast:f,vib:false}))}catch{}},FAST);
  await page.goto(`http://127.0.0.1:${port}/`);await page.waitForTimeout(800);
  await page.click('#bCreate');await page.waitForSelector('#vRoom:not([hidden])');await page.selectOption('#selDays',DAYS);
  await page.waitForTimeout(300);await page.click('#bStart');await page.waitForSelector('#vGame:not([hidden])',{timeout:15000});
  // 横はみ出し：演出中の一瞬（揺れ・登場アニメ）を除くため、0.8秒後にもう一度測って続いているものだけ記録
  const measure=()=>page.evaluate(()=>{const W=document.documentElement.clientWidth,out=[];if(document.documentElement.scrollWidth>W+1)out.push('ページ幅 '+document.documentElement.scrollWidth+'>'+W);
    document.querySelectorAll('#bar button,#ov .card,#ov button,.nextbox,#status').forEach(e=>{if(!e.offsetParent&&getComputedStyle(e).position!=='fixed')return;const r=e.getBoundingClientRect();if(r.width&&(r.right>W+1||r.left<-1))out.push((e.id||e.className.split(' ')[0]||e.tagName)+' 横位置'+Math.round(r.left)+'〜'+Math.round(r.right))});
    {const o=document.querySelector('#ov');if(o&&!o.hidden&&o.scrollLeft)out.push('注意:#ovが横にスクロールされている scrollLeft='+o.scrollLeft)}
    document.querySelectorAll('#bar button').forEach(e=>{if(e.offsetParent&&e.scrollWidth>e.clientWidth+2)out.push('ボタン文字はみ出し '+(e.id||e.textContent.slice(0,12)))});return out});
  const seen=new Set();const layout=async tag=>{const a=await measure();if(!a.length)return;await page.waitForTimeout(800);const b=await measure();
    const note=b.some(x=>x.startsWith('注意:'));/* 光線演出で#ovの中身が横に広く、自動操作のスクロールで#ovがずれた場合は注意として分ける */
    for(const x of a.filter(x=>b.includes(x))){const k=tag+x.replace(/\d+/g,'#');if(!seen.has(k)){seen.add(k);log(note?'注意':'表示崩れ',tag+' '+x);await shot('layout')}}};
  const click=async(sel,nth)=>{const loc=nth==null?page.locator(sel).first():page.locator(sel).nth(nth);clicks[sel]=(clicks[sel]||0)+1;
    try{await loc.click({timeout:4000})}catch(e){const L=e.message.split('\n');/* 押す前に自動で閉じた・消えた（時間で閉じるカードなど）ものは不具合ではないので記録しない */const gone=await loc.count().then(n=>n===0).catch(()=>true)||/^#ov /.test(sel)&&await page.evaluate(()=>document.querySelector('#ov').hidden).catch(()=>false);if(!gone&&!/detached|not attached/.test(e.message)){log('押せない',sel+' '+(L.filter(l=>/intercepts|outside|not visible|not enabled/.test(l)).pop()||L[0]).trim());await shot('click')}}};
  const state=()=>page.evaluate(()=>{const vis=e=>e&&!e.hidden&&!e.disabled&&e.offsetParent!==null&&e.getBoundingClientRect().width>0,q=s=>document.querySelector(s),n=s=>[...document.querySelectorAll(s)].filter(vis).length;
    const ov=q('#ov');if(ov&&!ov.hidden){if(/最終結果/.test(ov.textContent))return{final:true};for(const id of ['#acOk','#cfOk','#ovClose'])if(vis(ov.querySelector(id)))return{sel:'#ov '+id};return{wait:'ov'}}
    if(vis(q('#bNext')))return{next:true};
    return{fs:vis(q('#bFsSell')),acOk:vis(q('#acOk')),opt:n('#routeOpts .optbtn'),auto:vis(q('#bAuto')),rw:vis(q('#bRwCoin')),shop:vis(q('#bShopOk')),shopBtns:n('#shopList .shopbtn'),
      buyAll:vis(q('#bBuyAll')),skip:vis(q('#bSkip')),bases:n('#baseList .basebtn'),roll:vis(q('#bRoll')),card:vis(q('#bCard')),
      sig:(q('#turnText')||{}).textContent+'|'+(q('#log')||{}).textContent.length+'|'+(q('#routeLeft')||{}).textContent+'|'+(ov&&ov.hidden)}});
  const t0=Date.now();let last='',lastAt=Date.now(),mine=0,paused=false,finished=false,stalls=0;
  while(Date.now()-t0<(+process.env.TMAX||1200000)){await page.waitForTimeout(FAST?120:250);const s=await state();
    if(s.final){finished=true;break}
    if(s.sel){await layout('ov');await click(s.sel);continue}
    if(s.next){log('想定外','「次の対戦へ」が表示された');break}
    if(s.wait)continue;
    if(s.sig!==last){last=s.sig;lastAt=Date.now()}else if(Date.now()-lastAt>45000){log('停止','45秒間進まない '+s.sig.slice(0,80));await shot('stall');lastAt=Date.now();if(++stalls>=3)break}
    await layout('play');
    if(s.fs){await click('#bFsSell');continue}
    if(s.acOk){await click('#acOk');continue}
    if(s.opt){if(s.auto&&R()<0.25)await click('#bAuto');else await click('#routeOpts .optbtn',Math.floor(R()*s.opt));continue}
    if(s.rw){await click(R()<0.5?'#bRwCoin':'#bRwCard');continue}
    if(s.shop){if(s.shopBtns&&R()<0.5)await click('#shopList .shopbtn:not([disabled])');await page.waitForTimeout(100);await click('#bShopOk');continue}
    if(s.skip){const r=R();if(s.buyAll&&r<0.4)await click('#bBuyAll');else if(s.bases&&r<0.6){await click('#baseList .basebtn:not([disabled])');await page.waitForTimeout(80);await click(await page.locator('#bBuy').isEnabled()?'#bBuy':'#bSkip')}else await click('#bSkip');continue}
    if(s.roll){
      if(PAUSE_AT&&!paused&&mine>=PAUSE_AT){paused=true;await pauseResume(page,click,log);continue}
      mine++;if(s.card&&R()<0.2){await click('#bCard');await page.waitForTimeout(300);const k=await page.locator('#ov .cardbtn:not([disabled])').count();
        if(k){await click('#ov .cardbtn:not([disabled])',Math.floor(R()*k));await page.waitForTimeout(300);const j=await page.locator('#justPick:not([hidden]) .jbtn').count();if(j)await click('#justPick .jbtn',Math.floor(R()*j))}
        else await click('#ov #ovClose');continue}
      await click('#bRoll')}}
  if(!finished)log('未完了','制限時間内に最終結果まで進まなかった');
  else{await page.waitForTimeout(1500);await layout('最終結果');await shot('final');
    if(POST==='rematch'){await click('#bRematch');await page.waitForTimeout(2000);if(!await page.locator('#vRoom').isVisible())log('再招待','部屋画面が出ない');
      else{await click('#bStart');await page.waitForTimeout(2500);if(!await page.locator('#vGame').isVisible())log('再招待','開始できない');else if(/最終結果/.test(await page.locator('#bRoll').textContent()))log('再招待','新しい対戦でも「最終結果」ボタンのまま')}}
    else{await click('#ov #ovClose');await page.waitForTimeout(2000);const head=await page.locator('#status .st-head').textContent();if(!head.includes('ゲーム終了'))log('終了後','上部欄：'+head);
      /* 閉じたあとも「最終結果」ボタンで見直せる */if(!/最終結果/.test(await page.locator('#bRoll').textContent())||await page.locator('#bRoll').isDisabled())log('終了後','最終結果を見直すボタンがない');else{await click('#bRoll');await page.waitForTimeout(800);if(!/最終結果/.test(await page.locator('#ov').textContent()))log('終了後','最終結果を見直せない')}}}
  await ctx.close();return{W,seed,finished,sec:Math.round((Date.now()-t0)/1000),myTurns:mine,clicks,issues}}

async function pauseResume(page,click,log){await click('#bMenu');await page.waitForTimeout(300);await click('#mnPause');await page.waitForTimeout(300);await click('#pzYes');await page.waitForTimeout(1500);
  if(!await page.locator('#vLobby').isVisible())return log('中断','タイトルへ戻らない');
  await page.reload();await page.waitForTimeout(1500);if(!await page.locator('#resumeList .resumebtn').count())return log('中断','再読込後に「続きから」が出ない');
  await click('#resumeList .resumebtn');await page.waitForTimeout(1500);if(!await page.locator('#bResume').isVisible())return log('中断','再開ボタンが見えない');
  await click('#bResume');await page.waitForTimeout(1500)}

(async()=>{await new Promise(r=>srv.listen(0,'127.0.0.1',r));const br=await chromium.launch();const res=[];
  for(const W of WIDTHS.length?WIDTHS:[360,390,430]){console.log(`${W}px：${DAYS}日・${FAST?'演出はやめ':'通常速度'}${PAUSE_AT?'・中断/再開あり':''}${POST==='rematch'?'・再招待あり':''}`);
    const r=await play(br,srv.address().port,W,+process.env.SEED||W);res.push(r);console.log(`  ${r.finished?'最終結果まで到達':'未完了'}（${r.sec}秒・自分の手番${r.myTurns}回・記録${r.issues.length}件）`)}
  await br.close();srv.close();console.log('画像：'+OUT);
  const bad=res.filter(r=>!r.finished||r.issues.some(i=>i.k!=='注意'));if(bad.length){console.error('FAIL',bad.map(r=>r.W+'px').join(','));process.exitCode=1}
  else console.log(`PASS 通しプレイ ${res.map(r=>r.W+'px').join('・')}（${DAYS}日・最終結果まで・JSエラー/停止/横はみ出し0件）`)})().catch(e=>{console.error(e);process.exit(2)});
