// 説明文の数とゲームの中身が合っているかのテスト（2026-11-03・Playwright・Chromium）
// 遊び方の「カードは◯ジャンル◯種類」＝廃止カードを除いたカードの数、システム説明の「◯種類のコアファンイベント」＝コアファンイベントの数
const {chromium}=require('playwright');const path=require('path');
const fail=[];const ok=(c,m)=>{if(!c)fail.push(m)};
(async()=>{const b=await chromium.launch();try{const p=await b.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));await p.route(/firebase|gstatic|googleapis/,r=>r.abort());
  await p.goto('file://'+path.resolve(__dirname,'index.html'));await p.waitForFunction(()=>!document.querySelector('#bCreate').disabled);
  const n=await p.evaluate(()=>({g:GENRES.length,c:Object.keys(CARDN).filter(k=>!(k in LEGACY)).length,y:YELLDEF.length,legacy:Object.keys(LEGACY).length,all:Object.keys(CARDN).length}));
  ok(n.c===n.all-n.legacy&&n.c>0,'カードの数 '+JSON.stringify(n));
  await p.click('#bHow');await p.waitForTimeout(300);const how=await p.evaluate(()=>document.querySelector('#ov').innerText);
  ok(how.includes(`カードは${n.g}ジャンル${n.c}種類`),'遊び方のカードの数 '+(how.match(/カードは.{0,12}/)||[''])[0]+' 正しくは'+n.g+'ジャンル'+n.c+'種類');
  await p.evaluate(()=>{const o=document.querySelector('#ov');o.hidden=true;o.innerHTML=''});await p.click('#bSys');await p.waitForTimeout(300);
  let sys='';for(let i=0;i<15;i++){sys+=await p.evaluate(()=>document.querySelector('#ov').innerText);const x=await p.$('#sysNext:not([disabled])');if(!x)break;await x.click();await p.waitForTimeout(120)}
  const m=sys.match(/(\d+)種類のコアファンイベント/);ok(m&&+m[1]===n.y,'システム説明のコアファンイベントの数 '+(m&&m[0])+' 正しくは'+n.y);
  ok(!/62種類/.test(how+sys),'古いカードの数（62種類）が残っている');
  if(errs.length)fail.push('JSエラー '+errs.join(' / '))}finally{await b.close()}
  if(fail.length){console.error('FAIL 説明文の数\n'+fail.join('\n'));process.exitCode=1}else console.log('PASS 説明文の数（カードの種類・コアファンイベントの数がゲームの中身と一致）')})();
