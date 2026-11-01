// 対戦開始までの待ち時間（2026-11-01）のテスト（Playwright・Chromium）
// 1) 部屋で待っている間に地図を先に組み立てる  2) 高さ・手番の色の変数は使う要素だけに置き、地図へ受け継がない
// 3) 下の操作欄の高さに合わせた余白がこれまでどおり効く（上の欄にも高さを渡す）  4) 開始後に地図・コマ・手番の輪が出る
const {chromium}=require('playwright');const path=require('path');
const fail=[];const ok=(c,m)=>{if(!c)fail.push(m)};
(async()=>{const b=await chromium.launch();try{for(const [W,H] of [[390,844],[320,568]]){const tag=W+'×'+H;
  const c=await b.newContext({viewport:{width:W,height:H},isMobile:true,hasTouch:true});const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
  await p.route(/firebase|gstatic|googleapis/,r=>r.abort());await p.addInitScript(()=>{try{localStorage.setItem('poco-set',JSON.stringify({bgm:0,se:0}))}catch{}});
  await p.goto('file://'+path.resolve('index.html'));await p.waitForFunction(()=>!document.querySelector('#bCreate').disabled);
  ok(await p.evaluate(()=>!built),tag+' タイトル画面ではまだ地図を作らない');
  await p.click('#bCreate');await p.waitForFunction(()=>built,null,{timeout:5000}).catch(()=>{});
  const pre=await p.evaluate(()=>({built,inRoom:!document.querySelector('#vRoom').hidden,n:document.querySelectorAll('#map *').length,fx:!!document.querySelector('#mapfx #pawns')}));
  ok(pre.built&&pre.inRoom&&pre.n>1000&&pre.fx,tag+' 部屋で待つ間に地図を先に作る '+JSON.stringify(pre));
  await p.click('#bStart');await p.waitForTimeout(2500);
  const g=await p.evaluate(()=>{const bar=document.querySelector('#bar'),wrap=document.querySelector('.wrap'),st=document.querySelector('#status'),m=document.querySelector('#map'),mb=document.querySelector('#mapbox');
    const cs=e=>getComputedStyle(e);return{pb:parseFloat(cs(wrap).paddingBottom),bh:bar.offsetHeight,stBarh:st.style.getPropertyValue('--barh'),mapBarh:cs(m).getPropertyValue('--barh').trim(),mapTurnc:cs(m).getPropertyValue('--turnc').trim(),mbBorder:cs(mb).borderTopColor,
      pawns:document.querySelectorAll('#mapfx #pawns > g').length,ring:!!document.querySelector('#mapfx #turnRing circle'),frame:typeof fxBusyOn!=='undefined'}});
  ok(Math.abs(g.pb-g.bh)<=2,tag+' 下の操作欄の高さに合わせた余白 '+JSON.stringify(g));
  ok(parseFloat(g.stBarh)===g.bh,tag+' 上の欄にも下の操作欄の高さ '+g.stBarh);
  ok(g.mapBarh===''&&g.mapTurnc==='',tag+' 地図へ変数を受け継がない '+JSON.stringify([g.mapBarh,g.mapTurnc]));
  ok(g.pawns===4&&g.ring,tag+' 開始後に地図・コマ・手番の輪 '+JSON.stringify(g));
  const tc=await p.evaluate(()=>{const mb=document.querySelector('#mapbox');mb.style.transition='none';mb.style.setProperty('--turnc','rgb(1, 2, 3)');const v=getComputedStyle(mb).borderTopColor;mb.style.transition='';return v});
  ok(tc==='rgb(1, 2, 3)',tag+' 手番の色の枠 '+tc);
  if(errs.length)fail.push(tag+' JSエラー '+errs.join(' / '));await c.close()}}finally{await b.close()}
  if(fail.length){console.error('FAIL 対戦開始までの待ち時間\n'+fail.join('\n'));process.exitCode=1}else console.log('PASS 対戦開始までの待ち時間（地図の先作り・変数を地図へ受け継がない・余白と枠の色）')})();
