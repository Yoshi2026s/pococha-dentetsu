// フィーバー駅の矢印（2026.11.05.11）：フィーバー駅が地図の外なら画面の端にオレンジの矢印。目的地の矢印・「全体を見る」に重ならない。地図の中なら出さない（Playwright・Chromium）
const {chromium,devices}=require('playwright');const path=require('path'),assert=require('assert');
(async()=>{const b=await chromium.launch();let code=0;try{for(const dev of [devices['iPhone SE'],devices['iPhone 13'],devices['iPhone 13 landscape']])for(let k=0;k<2;k++){
  const c=await b.newContext({...dev});const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));await p.route(/firebase|gstatic|googleapis/,r=>r.abort());
  await p.goto('file://'+path.resolve('index.html'));await p.waitForFunction(()=>!document.querySelector('#bCreate').disabled);await p.click('#bCreate');await p.waitForTimeout(300);await p.click('#bStart');await p.waitForTimeout(2000);
  const r=await p.evaluate(async()=>{const s=curTip().state,ov=(a,q)=>!(a.right<=q.left||q.right<=a.left||a.bottom<=q.top||q.bottom<=a.top);const W=async()=>{await new Promise(r=>setTimeout(r,500));qArrow();await new Promise(r=>setTimeout(r,300))};
    camTo(NODES[START],2.4,0);await W();const a=$('#feverArrow'),out={shown:!a.hidden,text:a.textContent};if(!a.hidden){const ra=a.getBoundingClientRect();out.hitGoal=!$('#goalArrow').hidden&&ov(ra,$('#goalArrow').getBoundingClientRect());out.hitView=ov(ra,$('#bView').getBoundingClientRect());const m=$('#mapbox').getBoundingClientRect();out.inBox=ra.top>=m.top&&ra.bottom<=m.bottom}
    camTo(NODES[s.fever],2.4,0);await W();out.hiddenInside=a.hidden;return out});
  if(r.shown){assert(/🔥.+あと\d+/.test(r.text),'矢印の文字 '+r.text);assert(!r.hitGoal,'目的地の矢印に重なった');assert(!r.hitView,'「全体を見る」に重なった');assert(r.inBox,'地図の外にはみ出した')}
  assert(r.hiddenInside,'フィーバー駅が地図の中なのに矢印が出た');assert.deepEqual(errs,[]);await c.close()}
  console.log('PASS フィーバー駅の矢印（縦・小画面・横）')}catch(e){console.error('NG',e.message);code=1}finally{await b.close();process.exit(code)}})();
