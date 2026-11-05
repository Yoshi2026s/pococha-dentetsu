// 道を選んでいる間のポコチャレ（2026.11.05.17）：サイコロのあとの分かれ道でも「🏅 ○/3」から内容を見られる。閉じたら道選びに戻る。ボタンは48px以上・1行（Playwright・Chromium）
const {chromium,devices}=require('playwright');const path=require('path'),assert=require('assert');
(async()=>{const b=await chromium.launch();let code=0;try{for(const name of ['iPhone SE','iPhone 13','iPhone 13 landscape']){
  const c=await b.newContext({...devices[name]});const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));await p.route(/firebase|gstatic|googleapis/,r=>r.abort());
  await p.addInitScript(()=>{try{localStorage.setItem('poco-set',JSON.stringify({bgm:0,se:0,fast:true}))}catch{}});await p.goto('file://'+path.resolve('index.html'));await p.waitForFunction(()=>!document.querySelector('#bCreate').disabled);
  await p.click('#bCreate');await p.waitForTimeout(300);await p.click('#bStart');await p.waitForTimeout(1500);
  /* 分かれ道で止まる手番を作る：自分の番で、分かれ道のあるマスから振る */
  let ok=false;for(let i=0;i<150&&!ok;i++){await p.waitForTimeout(250);const st=await p.evaluate(()=>pending&&pending.stage);if(st==='route'){ok=true;break}
    const click=async s=>{const e=await p.$(s);if(e&&await e.isVisible().catch(()=>false))await e.click({timeout:1500}).catch(()=>{})};if(st==='act')await click('#bRoll');else if(st==='buy')await click('#bSkip');else if(st==='shop')await click('#bShopOk');else if(st==='reward')await click('#bRwCoin');await click('#cfOk');await click('#acOk');await click('#ovClose')}
  assert(ok,name+' 分かれ道の画面にならない');await p.waitForTimeout(400);
  const r=await p.evaluate(()=>{const e=document.querySelector('#bMisR'),q=e.getBoundingClientRect(),top=document.elementFromPoint(q.left+q.width/2,q.top+q.height/2);
    const one=[...document.querySelectorAll('.routectl button')].filter(x=>x.offsetParent).every(x=>{const lh=parseFloat(getComputedStyle(x).lineHeight)||16;return x.scrollHeight<=x.clientHeight+1});return{vis:e.offsetParent!==null&&q.width>0,w:q.width,h:q.height,cover:!!top&&e.contains(top),txt:e.textContent,mis:document.querySelector('#misCnt').textContent,sw:document.documentElement.scrollWidth<=innerWidth}});
  assert(r.vis&&r.cover,name+' 道選びでポコチャレのボタンが見えない・押せない '+JSON.stringify(r));assert(r.w>=48&&r.h>=48,name+' ボタンが小さい');assert.equal(r.txt,'🏅'+r.mis,name+' 達成数が下のボタンと違う');assert(r.sw,name+' 横にはみ出した');
  await p.click('#bMisR');await p.waitForTimeout(300);assert(await p.evaluate(()=>!!document.querySelector('#misSheet')),name+' ポコチャレが開かない');
  await p.click('#msClose');await p.waitForTimeout(300);const back=await p.evaluate(()=>({stage:pending&&pending.stage,opts:document.querySelectorAll('#routeOpts .optbtn').length,ov:document.querySelector('#ov').hidden}));
  assert(back.stage==='route'&&back.opts>=2&&back.ov,name+' 閉じたあと道選びに戻らない '+JSON.stringify(back));
  await p.click('#bAuto');await p.waitForTimeout(600);{const a=await p.$('#acOk');if(a&&await a.isVisible().catch(()=>false))await a.click()}await p.waitForTimeout(1500);assert.notEqual(await p.evaluate(()=>pending&&pending.stage),'route',name+' 道を選べない');
  assert.deepEqual(errs,[],name+' エラー：'+errs.join(' / '));await c.close()}
  console.log('PASS 道を選んでいる間のポコチャレ（縦・小画面・横）')}catch(e){console.error('NG',e.message);code=1}finally{await b.close();process.exit(code)}})();
