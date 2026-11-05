// ストーリー用の結果画像（2026.11.05.9）：1080×1920（9:16）のPNG。文字は上280px・下380pxに置かない。ほかの人の名前は入れない。ボタンは48px以上（Playwright・Chromium）
const {chromium,devices}=require('playwright');const path=require('path'),assert=require('assert');
(async()=>{const b=await chromium.launch();let code=0;try{const c=await b.newContext({...devices['iPhone SE']});const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
  await p.route(/firebase|gstatic|googleapis/,r=>r.abort());await p.goto('file://'+path.resolve('index.html'));await p.waitForFunction(()=>!document.querySelector('#bCreate').disabled);
  await p.click('#bCreate');await p.waitForTimeout(300);await p.click('#bStart');await p.waitForTimeout(1200);
  for(const heavy of [false,true]){
    const r=await p.evaluate(async heavy=>{let st=genesisState(meta.seed,1);while(!st.finished){st=applyTurn(st,await cpuDecide(st),meta.seed)}const me=mySeat();
      if(heavy){const i0=st.final.findIndex(f=>f.seat===me),t=st.final.splice(i0,1)[0];st.final.unshift(t);st.big={seat:me,g:123456,turn:10,t:'イベント「ファーストクラスに招待」ファーストクラスに招待'};['earned','mtot','gl','yt'].forEach(k=>st.players[me][k]=1e7);st.players[me].rank='S6';st.players[me].minusTot=0}
      showFinal(st);const L=[],o=CanvasRenderingContext2D.prototype.fillText;CanvasRenderingContext2D.prototype.fillText=function(t,x,y,...a){L.push([String(t),y,parseFloat(this.font.match(/(\d+)px/)[1])]);return o.call(this,t,x,y,...a)};
      const bl=await storyImage(st);CanvasRenderingContext2D.prototype.fillText=o;const bm=await createImageBitmap(bl);const btn=document.querySelector('#bStoryImg').getBoundingClientRect();
      return{w:bm.width,h:bm.height,type:bl.type,L,others:[0,1,2,3].filter(i=>i!==me).map(i=>seatName(i)),btn:[btn.width,btn.height],aw:awardList(st).filter(a=>a[1].includes(me)).map(a=>a[0])}},heavy);
    const tag=heavy?'文字の多い結果':'ふつうの結果';
    assert.deepEqual([r.w,r.h,r.type],[1080,1920,'image/png'],tag+' 画像の大きさ');
    for(const [t,y,sz] of r.L){assert(y-sz>=280&&y<=1920-380,`${tag} 余白に文字「${t}」（y=${y}）`)}
    assert(!r.L.some(([t])=>r.others.some(n=>t.includes(n))),tag+' ほかの人の名前が入った');assert(r.L.some(([t])=>t.includes('#ポコチャ電鉄')),tag+' ハッシュタグが無い');
    if(heavy){const all=r.L.map(x=>x[0]).join('');assert(r.aw.every(a=>all.includes(a)),tag+' 賞が切れた：'+r.aw.join(','));assert(all.includes('123,456G'),tag+' 名場面が無い')}
    assert(r.btn[0]>=48&&r.btn[1]>=48,'ボタンが小さい '+r.btn)}
  assert.deepEqual(errs,[],'エラー：'+errs.join(' / '));console.log('PASS ストーリー用の結果画像（9:16・上下の余白・名前・ボタン）')}catch(e){console.error('NG',e.message);code=1}finally{await b.close();process.exit(code)}})();
