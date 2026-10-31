// 下のボタン1段・コメントの位置・CPUのひとことの位置・お祝いの音・なめらかさ（2026-10-31）のテスト（Playwright・Chromium）
// 1) リスナーコメントは下の操作欄の右側に3件まで  2) CPUのひとことは下の操作欄の左側（どちらもボタンの下・地図には出さない）
// 3) ポコチャレ達成・コアファンの節目・締めの条件クリアで豪華なお祝いの音（celebrate）  4) 演出中は地図の飾りのアニメを止める（fxbusy）
// 5) コマが1マスずつ進む間のカメラは一定の速さ（最後だけゆっくり止まる）  6) 空の小窓は20コマ/秒まで
const {chromium}=require('playwright');const path=require('path'),fs=require('fs');
const fail=[];const ok=(c,m)=>{if(!c)fail.push(m)};
(async()=>{const src=fs.readFileSync('index.html','utf8');
  ok(/celebrate:t=>/.test(src)&&/sfx\('celebrate'\);banner\('ポコチャレ達成！'/.test(src)&&/yellbonus'\);yb\.forEach\(\(e,i\)=>setTimeout\(\(\)=>\{sfx\('celebrate'\)/.test(src)&&/x\.gain>0\)\)setTimeout\(\(\)=>sfx\('celebrate'\)/.test(src),'お祝いの音のつなぎ');
  ok(/camAt\(NODES\[path\[i\]\],ZM,sw,false,i<path\.length-1\?'lin':'out'\)/.test(src)&&/ez==='lin'\?k/.test(src),'カメラの一定の速さ');ok(/fxBusyOn\?10:20/.test(src),'空の小窓のコマ数');
  const b=await chromium.launch();try{for(const [W,H] of [[390,844],[320,568]]){
  const c=await b.newContext({viewport:{width:W,height:H},isMobile:true,hasTouch:true});const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
  await p.route(/firebase|gstatic|googleapis/,r=>r.abort());await p.goto('file://'+path.resolve('index.html'));await p.waitForFunction(()=>!document.querySelector('#bCreate').disabled);
  await p.click('#bCreate');await p.waitForTimeout(300);await p.click('#bStart');await p.waitForTimeout(2000);const tag=W+'×'+H;
  await p.evaluate(()=>comments('good',2));await p.waitForTimeout(500);
  await p.evaluate(()=>comments('good',3));await p.waitForTimeout(1800);
  const cm=await p.evaluate(()=>{const b=document.querySelector('#cmts'),r=b.getBoundingClientRect(),bar=document.querySelector('#bar').getBoundingClientRect(),btn=document.querySelector('#bRoll').getBoundingClientRect();return {inBar:b.parentNode.id==='bar',n:b.children.length,right:r.left>bar.left+bar.width*.45&&r.right<=bar.right,below:r.top>=btn.bottom-1&&r.bottom<=bar.bottom+1}});
  ok(cm.inBar&&cm.n>=2&&cm.n<=3&&cm.right&&cm.below,tag+' コメントの位置（下の操作欄の右・ボタンの下） '+JSON.stringify(cm));
  const sp=await p.evaluate(()=>{const s=[0,1,2,3].find(i=>i!==mySeat());say(s,'turn');return new Promise(r=>setTimeout(()=>{const e=document.querySelector('.fx.speech');if(!e)return r(null);const a=e.getBoundingClientRect(),bar=document.querySelector('#bar').getBoundingClientRect();const btn=document.querySelector('#bRoll').getBoundingClientRect(),cm=document.querySelector('#cmts').getBoundingClientRect();r({inBar:!!e.closest('#bar'),inMap:!!e.closest('#mapbox'),within:a.top>=btn.bottom-1&&a.bottom<=bar.bottom+1,leftOfCmts:a.right<=cm.left+1})},300))});
  ok(sp&&sp.inBar&&!sp.inMap&&sp.within&&sp.leftOfCmts,tag+' CPUのひとことの位置 '+JSON.stringify(sp));
  const fb=await p.evaluate(()=>new Promise(r=>{animN++;setTimeout(()=>{const on=document.body.classList.contains('fxbusy');animN--;setTimeout(()=>r([on,document.body.classList.contains('fxbusy')]),400)},400)}));ok(fb[0]&&!fb[1],tag+' 演出中の飾りの停止 '+fb);
  if(errs.length)fail.push(tag+' JSエラー '+errs.join(' / '));await c.close()}
}finally{await b.close()}
  if(fail.length){console.error('FAIL 下のボタン1段・コメント・ひとこと・お祝いの音・なめらかさ\n'+fail.join('\n'));process.exitCode=1}else console.log('PASS 下のボタン1段・コメント・ひとこと・お祝いの音・なめらかさ（コメントは操作欄の右・ひとことは操作欄の左・お祝いの音・演出中の停止・カメラ・空の小窓）')})();
