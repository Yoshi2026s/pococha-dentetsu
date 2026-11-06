// 名前を決めていない人の名前が通知で「2Pさんさん」にならない（2026.11.06.9）のテスト（Playwright・Chromium・通信なし）
const {chromium}=require('playwright');const path=require('path');
const fail=[];const ok=(c,m)=>{if(!c)fail.push(m)};
(async()=>{const b=await chromium.launch();try{const c=await b.newContext({viewport:{width:375,height:667}});const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
  await p.route(/firebase|gstatic|googleapis/,r=>r.abort());await p.goto('file://'+path.resolve(__dirname,'index.html'));await p.waitForFunction(()=>!document.querySelector('#bCreate').disabled);
  const r=await p.evaluate(()=>{const keep=[seats,meta,myId];myId='ME';meta={phase:'playing',host:'H',uname:{},pname:{},cpu:[]};seats=[{uid:'H'},{uid:'B'},{uid:'C'},{uid:'ME'}];
    const out=[seatName(1),nameize(`${seatName(1)}が中断しました`),nameize('2Pに100Gが入った'),nameize(`▶ ${seatName(2)}の第3手番の動き`),nameize('1Pと2P'),nameize('4Pの番')];
    toast(`👑 ${seatName(1)}が1位に浮上！（${seatName(2)}を逆転）`);out.push(document.querySelector('#toast').textContent);[seats,meta,myId]=keep;return out});
  ok(r[0]==='2Pさん','名前を決めていない人の名前 '+r[0]);
  ok(r[1]==='2Pさんが中断しました','通知で「さん」が重なる '+r[1]);
  ok(r[2]==='2Pさんに100Gが入った','記録の文「2P」は名前に置きかえる '+r[2]);
  ok(r[3]==='▶ 3Pさんの第3手番の動き','再生の通知 '+r[3]);
  ok(r[4]==='ホストと2Pさん'&&r[5]==='あなたの番','ホスト・自分の置きかえ '+JSON.stringify(r.slice(4,6)));
  ok(r[6]==='👑 2Pさんが1位に浮上！（3Pさんを逆転）','画面の通知 '+r[6]);
  if(errs.length)fail.push('JSエラー '+errs.join(' / '));await c.close()}finally{await b.close()}
  if(fail.length){console.error('FAIL 名前の「さん」の重なり\n'+fail.join('\n'));process.exitCode=1}else console.log('PASS 名前を決めていない人の通知（「2Pさんさん」にならない）')})();
