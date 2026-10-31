// 結果カードの置き場所（2026-10-31）：止まったマス（コマ）に結果カードが重ならないことを、スマホの縦持ち・小さい画面・横持ちで確かめる（Playwright・Chromium）
const {chromium,devices}=require('playwright');const path=require('path'),assert=require('assert');
const VIEWS=[['iPhone 13 縦',devices['iPhone 13']],['iPhone SE 縦',devices['iPhone SE']],['iPhone 13 横',devices['iPhone 13 landscape']]];
(async()=>{const b=await chromium.launch();let ng=0;try{for(const [name,dev] of VIEWS)for(const ty of ['event','plus','station']){
  const ctx=await b.newContext({...dev});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
  await p.route(/firebase|gstatic|googleapis/,r=>r.abort());await p.goto('file://'+path.resolve('index.html'));
  await p.waitForFunction(()=>!document.querySelector('#bCreate').disabled);await p.click('#bCreate');await p.waitForTimeout(200);await p.click('#bStart');await p.waitForTimeout(1000);
  for(const mode of ['other','me']){
    const res=await p.evaluate(([ty,mode])=>{document.querySelectorAll('.fx.respop,#myRes').forEach(e=>e.remove());const base=curTip().state;const k=NODES.findIndex((n,i)=>n.type===ty&&ADJ[i]&&ADJ[i].length);
      for(let tr=0;tr<200;tr++){const st=JSON.parse(JSON.stringify(base)),seat=curSeat(st);st.players[seat].pos=ADJ[k][0];st.rng=tr*7;
        try{const s2=applyTurn(st,{type:'roll',route:[k],buy:ty==='station'?[0]:false,reward:'coin',shopDone:true},meta.seed,{noForce:true});if(s2.players[seat].pos!==k)continue;
          const mv=(s2.ev||[]).find(e=>e.k==='move'),n=NODES[k];camAt(n,ZN+.3,300);const r=resultInfo(s2,st,seat,mv?mv.t:'',n);
          let e;if(mode==='me'){myResult(r,n,s2);e=document.querySelector('#myRes .mr-card')}else{e=fxEl('respop',resultHTML(r,''),null,null,60000);e.style.animation='none';resPlace(e,n)}
          window.__chk=()=>{const q=mapPt(n),M=document.querySelector('#mapbox').getBoundingClientRect(),R=e.getBoundingClientRect(),y=M.top+q.y,x=M.left+q.x;return{y:Math.round(y),top:Math.round(R.top),bot:Math.round(R.bottom),hit:x>R.left&&x<R.right&&y>R.top-14&&y<R.bottom+14,inMap:y>M.top&&y<M.bottom}};return true}catch(err){}}return false},[ty,mode]);
    assert(res,`${ty}に止まれない`);await p.waitForTimeout(500);const c=await p.evaluate(()=>window.__chk());
    if(!c.inMap||c.hit){ng++;console.error(`NG ${name} ${ty} ${mode}`,c)}}
  if(errs.length){ng++;console.error(name,errs)}await ctx.close()}}finally{await b.close()}
  if(ng)process.exitCode=1;else console.log('PASS 結果カードがコマに重ならない（縦・小画面・横 × イベント・プラス・駅 × 自分・ほかの人）')})();
