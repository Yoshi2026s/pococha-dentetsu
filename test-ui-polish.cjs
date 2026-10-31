// 画面まわりの改善（2026-10-31）の回帰テスト（Playwright・Chromium のスマホ表示エミュレーション）
// 1) 狭い画面（320・360px）で「ポコチャレ 0/3」がボタンからはみ出さない
// 2) 右上に×のあるカード（システム説明・ポコチャレ）で、見出しが×と重ならず1行に収まる
// 3) 道選びのあいだは「サイコロ・カード」の行を隠す
// 4) お知らせ（toast）は下のボタンのタップを邪魔しない
// 5) 横持ち（844×390）で順位の4人目まで見える
// 6) 名前欄の案内文が欄に収まる／ゲーム処理のエラーを英語のまま出さない／最終結果を閉じたあと見直せて、自分の行が目立つ
const {chromium}=require('playwright');const path=require('path');
const fail=[];const ok=(c,m)=>{if(!c)fail.push(m)};
async function open(b,W,H){const c=await b.newContext({viewport:{width:W,height:H},isMobile:true,hasTouch:true});const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
  await p.route(/firebase|gstatic|googleapis/,r=>r.abort());await p.goto('file://'+path.resolve('index.html'));await p.waitForFunction(()=>!document.querySelector('#bCreate').disabled);p.errs=errs;p.ctx=c;return p}
const start=async p=>{await p.click('#bCreate');await p.waitForTimeout(300);await p.click('#bStart');await p.waitForTimeout(1300)};
const closeOv=p=>p.evaluate(()=>{const o=document.querySelector('#ov');o.hidden=true;o.innerHTML=''});
const title=p=>p.evaluate(()=>{const h=document.querySelector('#ov h3'),x=document.querySelector('#ov .xclose'),t=document.createRange();t.selectNodeContents(h);const r=t.getBoundingClientRect(),q=x&&x.getBoundingClientRect();return{lines:Math.round(h.getBoundingClientRect().height/parseFloat(getComputedStyle(h).lineHeight||'30')),right:r.right,x:q?q.left:1e9,h:h.getBoundingClientRect().height,fs:parseFloat(getComputedStyle(h).fontSize)}});
(async()=>{const b=await chromium.launch();try{
  for(const W of [320,360]){const p=await open(b,W,640);
    ok(await p.evaluate(()=>{const i=document.querySelector('#iMyName'),cs=getComputedStyle(i),cv=document.createElement('canvas').getContext('2d');cv.font=cs.fontSize+' '+cs.fontFamily;return cv.measureText(i.placeholder).width<=i.clientWidth-parseFloat(cs.paddingLeft)-parseFloat(cs.paddingRight)||true}),'');
    await p.click('#bSys');await p.waitForTimeout(500);const t1=await title(p);ok(t1.right<=t1.x+1&&t1.h<t1.fs*2,`${W}px システム説明の見出しが×と重なる/2行になる `+JSON.stringify(t1));await closeOv(p);
    await p.click('#bCreate');await p.waitForTimeout(300);
    const ph=await p.evaluate(()=>{const i=document.querySelector('#iMyName'),cs=getComputedStyle(i),cv=document.createElement('canvas').getContext('2d');cv.font=cs.fontSize+' '+cs.fontFamily;return [cv.measureText(i.placeholder).width,i.clientWidth-parseFloat(cs.paddingLeft)-parseFloat(cs.paddingRight)]});ok(ph[0]<=ph[1],`${W}px 名前欄の案内文が切れる `+ph);
    await p.click('#bStart');await p.waitForTimeout(1300);
    const bars=await p.evaluate(()=>[...document.querySelectorAll('#bar button')].filter(e=>e.offsetParent&&e.scrollWidth>e.clientWidth+2).map(e=>e.id));ok(!bars.length,`${W}px ボタン文字はみ出し `+bars);
    await p.click('#bMis');await p.waitForTimeout(500);const t2=await title(p);ok(t2.right<=t2.x+1&&t2.h<t2.fs*2,`${W}px ポコチャレの見出し `+JSON.stringify(t2));await p.evaluate(()=>{document.querySelectorAll('#misSheet').forEach(e=>e.remove())});await closeOv(p);
    await p.click('#bRoll');await p.waitForFunction(()=>pending&&pending.stage==='route',null,{timeout:8000});await p.waitForTimeout(300);
    ok(await p.evaluate(()=>!document.querySelector('#bRoll').offsetParent&&!document.querySelector('#bCard').offsetParent),`${W}px 道選びでサイコロ・カードの行が出ている`);
    // お知らせを出して、その下のボタンを押せるか（elementFromPoint がボタンを返すか）
    const under=await p.evaluate(()=>{const b=[...document.querySelectorAll('#routeOpts .optbtn,#bAuto')].find(e=>e.offsetParent);toast('テスト用のお知らせです。長い文章でボタンに重なる場合があります');const t=document.querySelector('#toast'),r=b.getBoundingClientRect();t.style.top=Math.round(r.top)+'px';const q=document.elementFromPoint(r.left+r.width/2,r.top+8);return !!q&&(q===b||b.contains(q))});
    ok(under,`${W}px お知らせが下のボタンのタップをさえぎる`);
    ok(await p.evaluate(()=>/盤面/.test(errReason(new Error('bad route')))&&!/原因不明/.test(errReason(new Error('bad buy')))),'ゲーム処理のエラーが英語のまま');
    if(p.errs.length)fail.push(W+'px JSエラー '+p.errs.join(' / '));await p.ctx.close()}
  {const p=await open(b,844,390);await start(p);const r=await p.evaluate(()=>{const s=document.querySelector('#status'),R=s.getBoundingClientRect();return [...s.querySelectorAll('.pl')].map(e=>e.getBoundingClientRect().bottom<=R.bottom+1)});ok(r.length===4&&r.every(Boolean),'横持ちで4人目まで見えない '+r);
    if(p.errs.length)fail.push('横持ち JSエラー '+p.errs.join(' / '));await p.ctx.close()}
  {const p=await open(b,390,844);await start(p);
    // 最終結果：終わった盤面を作って表示→閉じる→「最終結果」ボタンで見直せる。自分の行に class="me"
    await p.evaluate(()=>{const st=curTip().state;st.finished=true;st.final=[0,1,2,3].map(i=>({seat:i,total:10000-i}));st.hist=[[1,1,1,1],[2,2,2,2]];/* 最新の盤面を終了にして手番が進まないようにする */if(pending&&pending.res){const r=pending.res;pending=null;r(null)}});await p.waitForTimeout(1000);await p.evaluate(()=>{pending=null});
    const ok1=await p.evaluate(async()=>{const st=curTip().state;st.finished=true;st.final=[0,1,2,3].map(i=>({seat:i,total:10000-i}));st.hist=[[1,1,1,1],[2,2,2,2]];dispState=st;pending=null;const pr=showFinal(st);await new Promise(r=>setTimeout(r,200));const me=!!document.querySelector('#ov tr.me');document.querySelector('#ovClose').click();await pr;await new Promise(r=>setTimeout(r,400));render();
      const btn=document.querySelector('#bRoll');return {me,txt:btn.textContent,dis:btn.disabled}});
    ok(ok1.me,'最終結果で自分の行が目立たない');ok(/最終結果/.test(ok1.txt)&&!ok1.dis,'閉じたあと「最終結果」ボタンがない '+JSON.stringify(ok1));
    await p.click('#bRoll');await p.waitForTimeout(400);ok(await p.evaluate(()=>/最終結果/.test(document.querySelector('#ov').textContent)&&!document.querySelector('#ov').hidden),'「最終結果」ボタンで見直せない');
    if(p.errs.length)fail.push('最終結果 JSエラー '+p.errs.join(' / '));await p.ctx.close()}
}finally{await b.close()}
  if(fail.length){console.error('FAIL 画面まわりの改善\n'+fail.join('\n'));process.exitCode=1}else console.log('PASS 画面まわりの改善（ポコチャレのはみ出し・×と見出し・道選びの行・お知らせのタップ・横持ちの順位・名前欄・エラー文・最終結果の見直し）')})();
