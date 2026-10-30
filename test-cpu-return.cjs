// 時間切れでCPUが代わりに進めたあと、次の自分の手番で自分の操作に戻れるかを確かめる（端末内モード・Playwright）
// 実行：node test-cpu-return.cjs
const {chromium}=require('playwright');const path=require('path');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:390,height:844}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
  await p.route(/gstatic\.com|firebase-config|fonts\.(googleapis|gstatic)/,r=>r.abort());
  await p.goto('file://'+path.resolve('index.html'));await p.waitForTimeout(800);
  await p.evaluate(()=>{SET.fast=true});await p.click('#bCreate');await p.waitForTimeout(400);await p.click('#bStart');
  const waitFor=async(fn,ms,label,arg)=>{const t0=Date.now();while(Date.now()-t0<ms){if(await p.evaluate(fn,arg))return true;await p.waitForTimeout(200)}throw Error('待ち時間切れ：'+label)};
  let fail=[];
  try{
    // 1) 自分の番になり、操作待ち（pending）になる
    await waitFor(()=>!!(pending&&pending.stage==='act'),30000,'最初の自分の番');
    const t1=await p.evaluate(()=>curTip().state.turn);
    // 2) 操作しないうちに、ホスト端末のCPU代行の結果が届いた状態を作る（オンラインでホストが時間切れで代行したときと同じ。記録の受信処理 onRecords を通す）
    await p.evaluate(async()=>{const t=curTip(),seat=curSeat(t.state),act=await cpuDecide(t.state),st=applyTurn(t.state,act,meta.seed);const rec={id:st.turn+'-1',turn:st.turn,grant:1,parent:t.id,by:'cpu'+seat+':host',action:act,state:st,rulesVersion:RULES_VERSION};records.set(rec.id,rec);onRecords()});
    await waitFor(t1=>curTip().state.turn>t1,10000,'CPUの代行の反映',t1).catch(e=>fail.push(e.message));
    const by=await p.evaluate(t1=>{const r=[...records.values()].find(r=>r.turn===t1+1);return r?String(r.by):''},t1);
    if(!by.startsWith('cpu'))fail.push('代行の記録がCPUになっていない：'+by);
    // 3) ほかの人が進んで、次に自分の番が来たら、また自分で操作できる（操作待ちに戻る）
    await waitFor(t1=>{const t=curTip();return t&&t.state.turn>t1+1&&curSeat(t.state)===mySeat()&&!!(pending&&pending.stage==='act'&&pending.st.turn===t.state.turn)},90000,'次の自分の番で操作に戻る',t1).catch(e=>fail.push(e.message));
    if(!(await p.evaluate(()=>!$('#bRoll').disabled)))fail.push('サイコロボタンが押せない');
  }catch(e){fail.push(e.message)}
  if(errs.length)fail.push(...errs);await b.close();
  if(fail.length){console.error('FAIL\n'+fail.join('\n'));process.exitCode=1}else console.log('PASS 時間切れでCPUが代行したあと、次の自分の手番で自分の操作に戻れる')})();
