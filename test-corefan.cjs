// コアファンの新ルール（2026-10-31）のテスト（Playwright・Chromium）
// 1) 新しい対戦（盤面に fy:1）：目的地に着いても・目的地が変わってもコアファンは0人に戻らず、0:00の決算のあとで全員0人に戻る
// 2) コアファンマスでは12種類のコアファンイベントが起き、必ず1人以上増える。イベントマスでは「ファン交流」の追加イベントが起きる
// 3) 結果カード・プレイヤー欄に「あと◯人で◯人ボーナス」、決算のカードに今日のコアファンと0人に戻る案内
// 4) 以前に始めた対戦（fy なし）は、前の版とまったく同じ計算になる（保存中の対戦・検算を守る）
//    比べる相手の前の版は、環境変数 OLD に index.html のパスを渡す（なければ git の1つ前の版を使う）
const {chromium}=require('playwright');const path=require('path'),fs=require('fs'),os=require('os'),cp=require('child_process');
const fail=[];const ok=(c,m)=>{if(!c)fail.push(m)};
let OLD=process.env.OLD;if(!OLD){OLD=path.join(os.tmpdir(),'pd-old-index.html');try{fs.writeFileSync(OLD,cp.execSync('git show origin/main:index.html',{maxBuffer:64<<20}))}catch{OLD=null}}
async function open(b,file){const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
  await p.route(/firebase|gstatic|googleapis/,r=>r.abort());await p.goto('file://'+path.resolve(file));await p.waitForFunction(()=>!document.querySelector('#bCreate').disabled);
  await p.click('#bCreate');await p.waitForTimeout(300);await p.click('#bStart');await p.waitForTimeout(1500);p.errs=errs;p.ctx=c;return p}
(async()=>{const b=await chromium.launch();try{
  const p=await open(b,'index.html');
  const r=await p.evaluate(()=>{const out={};const base=JSON.parse(JSON.stringify(curTip().state));out.fy=base.fy;
    // 目的地に着く手番：コアファンが残る
    const g=base.goal;let goalKept=null;for(let tr=0;tr<80&&goalKept==null;tr++){const st=JSON.parse(JSON.stringify(base)),seat=curSeat(st);st.players.forEach(q=>{q.ye=7;q.yb=0});st.players[seat].pos=ADJ[g][tr%ADJ[g].length];st.rng=tr*7;
      try{const s2=applyTurn(st,{type:'roll',route:[g],buy:false,reward:'coin',shopDone:true},meta.seed,{noForce:true});if(s2.players[seat].pos!==g)continue;goalKept={others:s2.players.filter((q,i)=>i!==seat).map(q=>q.ye),reset:(s2.ev||[]).some(e=>e.k==='yellreset')}}catch(e){}}
    out.goal=goalKept;
    // 0:00の決算：全員0人に戻る
    {const st=JSON.parse(JSON.stringify(base));st.players.forEach(q=>{q.ye=12;q.yb=10});st.since=6;let n=0;dayEnd(st,()=>rand('x',n++));out.day={ye:st.players.map(q=>q.ye),yb:st.players.map(q=>q.yb),rep:st.report.map(x=>x.ye),ev:st.ev.some(e=>e.k==='yellreset')}}
    // コアファンマスのイベント
    const yk=NODES.map((n,i)=>i).filter(i=>NODES[i].type==='yell'&&ADJ[i]&&ADJ[i].length),seen=new Set(),gains=[];
    for(const k of yk.slice(0,12))for(let tr=0;tr<25;tr++){const st=JSON.parse(JSON.stringify(base)),seat=curSeat(st);st.players[seat].pos=ADJ[k][0];st.rng=tr*31+k;
      try{const s2=applyTurn(st,{type:'roll',route:[k],buy:false,reward:'coin',shopDone:true},meta.seed,{noForce:true});if(s2.players[seat].pos!==k)continue;const e=(s2.ev||[]).find(e=>e.k==='event');if(e)seen.add(e.v);gains.push((s2.players[seat].ye||0)-(st.players[seat].ye||0))}catch(e){}}
    out.yell={kinds:[...seen],min:Math.min(...gains),n:gains.length};
    // イベントマスの追加イベント
    const ek=NODES.map((n,i)=>i).filter(i=>NODES[i].type==='event'&&ADJ[i]&&ADJ[i].length),fe=new Set();
    for(const k of ek.slice(0,12))for(let tr=0;tr<30;tr++){const st=JSON.parse(JSON.stringify(base)),seat=curSeat(st);st.players[seat].pos=ADJ[k][0];st.rng=tr*29+k;
      try{const s2=applyTurn(st,{type:'roll',route:[k],buy:false,reward:'coin',shopDone:true},meta.seed,{noForce:true});const e=(s2.ev||[]).find(e=>e.k==='event');if(e&&/^f_/.test(e.v))fe.add(e.v)}catch(e){}}
    out.fanEv=[...fe];
    // 表示：結果カードの補足・プレイヤー欄
    {const k=yk[0];let note='';for(let tr=0;tr<25&&!note;tr++){const st=JSON.parse(JSON.stringify(base)),seat=curSeat(st);st.players[seat].pos=ADJ[k][0];st.rng=tr*31+k;try{const s2=applyTurn(st,{type:'roll',route:[k],buy:false,reward:'coin',shopDone:true},meta.seed,{noForce:true});if(s2.players[seat].pos!==k)continue;const mv=(s2.ev||[]).find(e=>e.k==='move');note=resultInfo(s2,st,seat,mv?mv.t:'',NODES[k]).note}catch(e){}}out.note=note}
    showPlayer(dispState,0);out.sheet=document.querySelector('#ov').innerText;const o=document.querySelector('#ov');o.hidden=true;o.innerHTML='';
    out.help=SYS.map(x=>x[2]).join('')+HOW.map(x=>x[1].join('')).join('');
    return out});
  ok(r.fy===1,'新しい対戦に fy:1 がない');
  ok(r.goal&&!r.goal.reset&&r.goal.others.every(v=>v===7),'目的地に着いたらコアファンが0人に戻った '+JSON.stringify(r.goal));
  ok(r.day.ye.every(v=>v===0)&&r.day.yb.every(v=>v===0)&&r.day.rep.every(v=>v===12)&&r.day.ev,'0:00の決算でコアファンが0人に戻らない '+JSON.stringify(r.day));
  ok(r.yell.n>=20&&r.yell.min>=1&&r.yell.kinds.length>=6&&r.yell.kinds.every(k=>/^y_/.test(k)),'コアファンマスのイベント '+JSON.stringify(r.yell));
  ok(r.fanEv.length>=3,'イベントマスのファン交流イベント '+r.fanEv);
  ok(/あと\d+人で\d+人ボーナス/.test(r.note)&&/0:00の決算で0人に戻る/.test(r.note),'結果カードの補足 '+r.note);
  ok(/あと\d+人で\d+人ボーナス/.test(r.sheet),'プレイヤー欄にコアファンの次のボーナスがない');
  ok(/0:00の決算のあと/.test(r.help)&&!/目的地が変わるたびに、全員のコアファン|目的地が変わると、全員のコアファンは0/.test(r.help),'説明が新しいルールでない');
  if(p.errs.length)fail.push('JSエラー '+p.errs.join(' / '));
  // 以前の対戦（fy なし）は前の版と同じ計算
  if(OLD){const q=await open(b,OLD);
    const inputs=await p.evaluate(()=>{const base=JSON.parse(JSON.stringify(curTip().state));delete base.fy;const L=[];for(const ty of ['yell','event','plus','station','airport','port']){const ks=NODES.map((n,i)=>i).filter(i=>NODES[i].type===ty&&ADJ[i]&&ADJ[i].length);for(const k of ks.slice(0,4))for(let tr=0;tr<6;tr++){const st=JSON.parse(JSON.stringify(base)),seat=curSeat(st);st.players[seat].pos=ADJ[k][0];st.rng=tr*13+k;L.push({st,k})}}
      {const g=base.goal;for(let tr=0;tr<8;tr++){const st=JSON.parse(JSON.stringify(base)),seat=curSeat(st);st.players.forEach(x=>x.ye=7);st.players[seat].pos=ADJ[g][tr%ADJ[g].length];st.rng=tr*7;L.push({st,k:g})}}return {L,seed:meta.seed}});
    const run=pg=>pg.evaluate(({L,seed})=>L.map(({st,k})=>{try{return JSON.stringify(applyTurn(st,{type:'roll',route:[k],buy:false,reward:'coin',shopDone:true},seed,{noForce:true}))}catch(e){return 'ERR '+e.message}}),inputs);
    const a=await run(p),c2=await run(q);let diff=0,same=0;a.forEach((x,i)=>{if(x===c2[i])same++;else diff++});
    const de=await p.evaluate(()=>{const st=JSON.parse(JSON.stringify(curTip().state));delete st.fy;st.players.forEach(q=>{q.ye=12;q.yb=10});st.since=6;let n=0;dayEnd(st,()=>rand('x',n++));return JSON.stringify(st)});
    const de2=await q.evaluate(()=>{const st=JSON.parse(JSON.stringify(curTip().state));st.players.forEach(q=>{q.ye=12;q.yb=10});st.since=6;let n=0;dayEnd(st,()=>rand('x',n++));return JSON.stringify(st)});
    ok(diff===0&&same>=50,`以前の対戦の計算が前の版と違う（同じ${same}・違う${diff}）`);
    // 0:00の決算は盤面が違う（goal など）ので、コアファンが残ることだけ確かめる
    ok(JSON.parse(de).players.every(x=>x.ye===12),'以前の対戦で0:00にコアファンが0人に戻った');
    await q.ctx.close()}else fail.push('前の版が見つからない（OLD を指定してください）');
  await p.ctx.close()
}finally{await b.close()}
  if(fail.length){console.error('FAIL コアファンの新ルール\n'+fail.join('\n'));process.exitCode=1}else console.log('PASS コアファンの新ルール（0:00で0人・目的地では戻らない・コアファンイベント12種・ファン交流の追加・ボーナスまでの表示・以前の対戦は前の版と同じ計算）')})();
