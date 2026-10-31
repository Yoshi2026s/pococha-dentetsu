// 地図を広くする画面の調整（2026-10-31）のテスト（Playwright・Chromium のスマホ表示エミュレーション）
// 1) 下の操作欄は「カード」が左・「サイコロ」が右  2) 上の順位欄と下の操作欄を小さくして、地図を広く（390×844で地図450px以上）
// 3) 行動ログはふだん閉じていて、タップすると履歴が開く  4) 持ち時間が残り15秒以下で警告（赤い点滅）、10秒からは毎秒の警告音
// 5) 地図の上のお知らせ（結果カード・コメント・吹き出し・数字・帯）の表示時間を少し長く
const {chromium}=require('playwright');const path=require('path'),fs=require('fs');
const fail=[];const ok=(c,m)=>{if(!c)fail.push(m)};
(async()=>{const src=fs.readFileSync('index.html','utf8');
  ok(/null,null,7000\)/.test(src)&&/rpop 5\.4s/.test(src)&&/c\.remove\(\),6200\)/.test(src)&&/cmtout \.7s ease-in 5\.5s/.test(src)&&/SET\.fast\?2300:3800/.test(src)&&/fnum 2s/.test(src)&&/bnin 2\.3s/.test(src),'地図の上のお知らせの表示時間');
  const b=await chromium.launch();try{for(const [W,H,minMap] of [[390,844,450],[375,667,280],[320,568,180]]){
  const c=await b.newContext({viewport:{width:W,height:H},isMobile:true,hasTouch:true});const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
  await p.addInitScript(()=>{try{localStorage.setItem('poco-set',JSON.stringify({bgm:0,se:0,fast:true}))}catch{}});
  await p.route(/firebase|gstatic|googleapis/,r=>r.abort());await p.goto('file://'+path.resolve('index.html'));await p.waitForFunction(()=>!document.querySelector('#bCreate').disabled);
  await p.click('#bCreate');await p.waitForTimeout(300);await p.click('#bStart');await p.waitForTimeout(2000);const tag=W+'×'+H;
  const L=await p.evaluate(()=>{const r=s=>document.querySelector(s).getBoundingClientRect();const c=r('#bCard'),d=r('#bRoll'),m=r('#mapbox'),t=r('#turnText'),b=r('#bar');return {cardLeft:c.right<=d.left+1&&Math.abs(c.top-d.top)<1,map:m.height,mb:m.bottom,tt:t.top,tb:t.bottom,bt:b.top,bar:b.height,logOpen:getComputedStyle(document.querySelector('#log')).display!=='none'}});
  ok(L.cardLeft,tag+' カードが左・サイコロが右になっていない');ok(L.map>=minMap,tag+' 地図が狭い '+Math.round(L.map));ok(L.mb<=L.tt+1&&L.tb<=L.bt+1,tag+' 地図・手番・操作欄が重なる');ok(L.bar<=170,tag+' 下の操作欄が大きい '+Math.round(L.bar));ok(!L.logOpen,tag+' 行動ログが最初から開いている');
  if(W===390){await p.click('#bRoll');for(let i=0;i<80;i++){await p.waitForTimeout(400);const st=await p.evaluate(()=>[pending&&pending.stage,document.querySelectorAll('#log li').length]);if(st[1]>=2)break;if(st[0]==='route')await p.click('#bAuto').catch(()=>{});else if(st[0]==='buy')await p.click('#bSkip').catch(()=>{});else if(st[0]==='shop')await p.click('#bShopOk').catch(()=>{});else if(st[0]==='reward')await p.click('#bRwCoin').catch(()=>{});else if(st[0]==='act')await p.click('#bRoll').catch(()=>{});const o=await p.$('#ov:not([hidden]) #ovClose');if(o)await o.click().catch(()=>{});const ac=await p.$('#acOk');if(ac&&await ac.isVisible())await ac.click().catch(()=>{})}
    await p.evaluate(()=>{const o=document.querySelector('#ov');o.hidden=true;o.innerHTML=''});
    await p.tap('#logPanel');await p.waitForTimeout(200);const lo=await p.evaluate(()=>({d:getComputedStyle(document.querySelector('#log')).display,h:document.querySelector('#log').offsetHeight,n:document.querySelectorAll('#log li').length}));ok(lo.d!=='none'&&lo.h>20&&lo.n>=2,'タップで行動ログの履歴が開かない '+JSON.stringify(lo));
    // 持ち時間の警告（オンライン対戦の自分の番を、通信なしでまねる）
    await p.evaluate(()=>{const o=document.querySelector('#ov');o.hidden=true;o.innerHTML=''});await p.waitForFunction(()=>pending&&pending.stage==='act',null,{timeout:30000}).catch(()=>{});
    const w=await p.evaluate(()=>{const keep=db.online,kt=window.tick,ks=sfx,snd=[];window.tick=()=>{};sfx=k=>snd.push(k);const out=[];try{db.online={};for(const sec of [30,14,9]){meta.turnAt={toMillis:()=>Date.now()-((meta.cpuTimeoutSec||90)-sec)*1000};render();out.push(document.body.classList.contains('timewarn'))}}finally{db.online=keep;sfx=ks;window.tick=kt;meta.turnAt=null;render()}return {out,snd,after:document.body.classList.contains('timewarn')}});
    ok(w.out.join()==='false,true,true'&&w.snd.includes('roulTick')&&!w.after,'持ち時間の警告 '+JSON.stringify(w))}
  if(errs.length)fail.push(tag+' JSエラー '+errs.join(' / '));await c.close()}
}finally{await b.close()}
  if(fail.length){console.error('FAIL 地図を広くする画面の調整\n'+fail.join('\n'));process.exitCode=1}else console.log('PASS 地図を広くする画面の調整（カードとサイコロの位置・順位欄と操作欄の縮小・行動ログの開閉・持ち時間の警告・お知らせの表示時間）')})();
