// オンライン対戦の通しテスト：本物の画面2つ（ホスト390px・参加者360px）をFirestore/Authエミュレーターにつなぎ、CPU2人入りで最終結果まで自動操作する。※Playwright（Chromium）が必要。
// 実行：npx firebase emulators:exec --config firebase.e2e.json --only firestore,auth --project demo-pococha-dentetsu "node test-online-e2e.cjs"
// 環境変数：DELAY=通信1回ごとに足す遅延ms（回線の遅さの再現） IDLE=n（参加者がn回目の手番を放置→ホストのCPU代行を確認、待ち時間60秒）
//           PAUSE=n（ホストがn回目の手番で中断→タイトル→続きから→再開） DAYS=日数(1)
// 出力のNETは「手番の操作を送ってから参加者の画面にサーバー確定の結果が届くまで」のms、OWNは「参加者が自分の操作の結果を見始めるまで」のms（先読み）。
// 同じ手番の重複（演出の2回再生・自分の番が2回・同じ手番の2回送信）があれば失敗にする。本番のFirebaseには接続しない。
const {chromium}=require('playwright');const http=require('http'),fs=require('fs'),path=require('path'),cp=require('child_process');
const ROOT=process.env.ROOT||__dirname,DAYS=process.env.DAYS||'1',DELAY=+(process.env.DELAY||0);
const srv=http.createServer((q,s)=>{let p=decodeURIComponent(q.url.split('?')[0]);if(p==='/')p='/index.html';
  if(p==='/firebase-config.js'){s.writeHead(200,{'content-type':'text/javascript'});return s.end("window.FIREBASE_CONFIG={apiKey:'fake-key',authDomain:'localhost',projectId:'demo-pococha-dentetsu',appId:'1:1:web:1'};")}
  fs.readFile(path.join(ROOT,path.normalize(p)),(e,b)=>{if(e){s.writeHead(404);return s.end()}let body=b;
    if(p==='/index.html'){let t=b.toString('utf8');
      // エミュレーター用：プロジェクト名の確認をデモ用に、通信ライブラリ読込み直後にエミュレーターへ向ける
      t=t.replace("cfg.projectId!=='pococha-dentetsu'","cfg.projectId!=='demo-pococha-dentetsu'");
      t=t.replace('<script src="https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore-compat.js"></script>','<script src="https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore-compat.js"></script><script>(()=>{const F=firebase.firestore.bind(firebase),A=firebase.auth.bind(firebase);let f,a;firebase.firestore=Object.assign(()=>{if(!f){f=F();f.useEmulator("127.0.0.1",8080)}return f},firebase.firestore);firebase.auth=Object.assign(()=>{if(!a){a=A();a.useEmulator("http://127.0.0.1:9099",{disableWarnings:true})}return a},firebase.auth);})()</script>');
      body=t}
    s.writeHead(200,{'content-type':p.endsWith('.js')?'text/javascript':'text/html'});s.end(body)})});
async function cdn(r){const u=r.request().url();/* CDNと同じ版（10.12.2）をnode_modulesから配る */await r.fulfill({body:fs.readFileSync(path.join(ROOT,'node_modules/firebase',u.split('/').pop())),contentType:'text/javascript'})}
function bot(page,name,W,log,seed,idleAt,pauseAt){let rolls=0,idled=false,paused=false;let rnd=seed;const R=()=>{rnd=(rnd*1103515245+12345)%2147483648;return rnd/2147483648};const clicks={};
  const click=async(sel,nth)=>{const loc=nth==null?page.locator(sel).first():page.locator(sel).nth(nth);clicks[sel]=(clicks[sel]||0)+1;try{await loc.click({timeout:4000})}catch(e){if(!/detached|not attached/.test(e.message))log(name,'押せない',sel+' '+e.message.split('\n')[0])}};
  const state=()=>page.evaluate(()=>{const vis=e=>e&&!e.hidden&&!e.disabled&&e.offsetParent!==null&&e.getBoundingClientRect().width>0,q=s=>document.querySelector(s),n=s=>[...document.querySelectorAll(s)].filter(vis).length;
    const ov=q('#ov');if(ov&&!ov.hidden){if(/最終結果/.test(ov.textContent))return{final:true};for(const id of ['#acOk','#cfOk','#ovClose'])if(vis(ov.querySelector(id)))return{sel:'#ov '+id};return{wait:1}}
    return{fs:vis(q('#bFsSell')),acOk:vis(q('#acOk')),opt:n('#routeOpts .optbtn'),auto:vis(q('#bAuto')),rw:vis(q('#bRwCoin')),shop:vis(q('#bShopOk')),buyAll:vis(q('#bBuyAll')),skip:vis(q('#bSkip')),bases:n('#baseList .basebtn'),roll:vis(q('#bRoll')),
      sig:(q('#turnText')||{}).textContent+'|'+(q('#log')||{}).textContent.length}});
  return {clicks,async run(deadline){let last='',lastAt=Date.now();while(Date.now()<deadline){await page.waitForTimeout(150);const s=await state();
    if(s.final)return true;if(s.sel){await click(s.sel);continue}if(s.wait)continue;
    if(s.sig!==last){last=s.sig;lastAt=Date.now()}else if(Date.now()-lastAt>60000){log(name,'停止','60秒進まない '+s.sig.slice(0,90));await page.screenshot({path:path.join(require('os').tmpdir(),`pd-e2e-stall-${name}.png`)});lastAt=Date.now()}
    if(s.fs){await click('#bFsSell');continue}if(s.acOk){await click('#acOk');continue}
    if(s.opt){if(s.auto&&R()<.3)await click('#bAuto');else await click('#routeOpts .optbtn',Math.floor(R()*s.opt));continue}
    if(s.rw){await click(R()<.5?'#bRwCoin':'#bRwCard');continue}if(s.shop){await click('#bShopOk');continue}
    if(s.skip){if(s.buyAll&&R()<.5)await click('#bBuyAll');else await click('#bSkip');continue}
    if(s.roll&&pauseAt&&!paused&&rolls+1===pauseAt){paused=true;/* 中断→タイトル→続きから→再開 */await click('#bMenu');await page.waitForTimeout(300);await click('#mnPause');await page.waitForTimeout(300);await click('#pzYes');await page.waitForTimeout(2500);
      if(!await page.locator('#vLobby').isVisible())log(name,'中断','タイトルへ戻らない');await page.waitForTimeout(3000);await click('#resumeList .resumebtn');await page.waitForTimeout(2500);await click('#bResume');await page.waitForTimeout(1500);log(name,'info','中断・再開を実行');continue}
    if(s.roll){if(idleAt&&rolls+1===idleAt&&!idled){if(!bot.idleT)bot.idleT=Date.now();if(Date.now()-bot.idleT<120000)continue;log(name,'代行されない','120秒放置してもCPU代行されない');idled=true}rolls++;bot.idleT=0;await click('#bRoll')}}return false}}}
(async()=>{await new Promise(r=>srv.listen(0,'127.0.0.1',r));const port=srv.address().port;const br=await chromium.launch();const issues=[];const log=(who,k,m)=>{issues.push({who,k,m});console.log(`[${who} ${k}] ${m}`)};
  const open=async(name,W)=>{const ctx=await br.newContext({viewport:{width:W,height:W<400?780:932},isMobile:true,hasTouch:true,deviceScaleFactor:1});const page=await ctx.newPage();
    page.on('pageerror',e=>log(name,'JSエラー',e.message));page.on('console',m=>{const t=m.text();if(m.type()==='error'&&!/ERR_|net::|favicon|fonts/.test(t))log(name,'console',t.slice(0,200))});
    await page.route(/www\.gstatic\.com\/firebasejs/,cdn);await page.route(/fonts\.(googleapis|gstatic)/,r=>r.abort());
    if(DELAY)await page.route(/127\.0\.0\.1:(8080|9099)/,async r=>{await new Promise(z=>setTimeout(z,DELAY));r.continue()});
    await page.addInitScript(()=>{window.__start={};window.__arr={};window.__predAt={};const iv=setInterval(()=>{try{if(typeof db==='undefined'||!db||!db.online)return;const o=db.online;if(o.__w)return;o.__w=1;
      for(const k of ['submit','commit']){const f=o[k];if(!f)continue;o[k]=function(c,tip,...r){if(tip){if(!(tip.turn in window.__start))window.__start[tip.turn]=Date.now();const key=k+':'+tip.turn+':'+r[0];window.__sent[key]=(window.__sent[key]||0)+1}return f.call(this,c,tip,...r)}}}catch{}},20);
      window.__sent={};window.__played={};window.__decided={};const w=setInterval(()=>{try{if(typeof playOne!=='function'||window.__wrapped)return;window.__wrapped=1;
        const P=playOne;playOne=function(r){window.__played[r.id]=(window.__played[r.id]||0)+1;return P.apply(this,arguments)};
        const M=myDecide;myDecide=function(st){window.__decided[st.turn]=(window.__decided[st.turn]||0)+1;return M.apply(this,arguments)};clearInterval(w)}catch{}},20);
      // 盤面の記録が届いた時刻：onRecordsの呼び出し時に記録（演出で画面が重くても正確に測る）
      const stampRec=()=>{try{const now=Date.now();for(const r of records.values()){if(r.pred){if(!(r.turn in window.__predAt))window.__predAt[r.turn]=now;continue}if(!(r.turn in window.__arr))window.__arr[r.turn]=now}}catch{}};
      const w2=setInterval(()=>{try{if(typeof onRecords!=='function'||window.__wr2)return;window.__wr2=1;const O=onRecords;onRecords=function(){stampRec();return O.apply(this,arguments)};clearInterval(w2)}catch{}},20)});
    await page.addInitScript(()=>{try{localStorage.setItem('poco-set',JSON.stringify({bgm:0,se:0,fast:true,vib:false}))}catch{}});
    await page.goto(`http://127.0.0.1:${port}/`);await page.waitForFunction(()=>!document.querySelector('#bCreate').disabled,null,{timeout:30000});return page};
  const host=await open('host',390),guest=await open('guest',360);
  const note=await host.locator('#permNote').textContent();if(/端末内/.test(note))throw Error('オンラインにつながっていない：'+note);
  await host.click('#bCreate');await host.waitForSelector('#vRoom:not([hidden])',{timeout:30000}).catch(async e=>{throw Error('部屋を作れない：'+await host.locator('#toast').textContent()+' / '+await host.locator('#permNote').textContent())});const code=(await host.locator('#tCode').textContent()).trim();console.log('部屋',code);
  await host.selectOption('#selDays',DAYS);if(process.env.IDLE)await host.selectOption('#selCpuTimeout','60');await guest.fill('#iCode',code);await guest.click('#bJoin');await guest.waitForSelector('#vRoom:not([hidden])',{timeout:20000});
  await host.waitForFunction(()=>!document.querySelector('#bStart').disabled,null,{timeout:20000});const t0=Date.now();await host.click('#bStart');
  await Promise.all([host.waitForSelector('#vGame:not([hidden])',{timeout:20000}),guest.waitForSelector('#vGame:not([hidden])',{timeout:20000})]);
  // 1手ごとの「ホストが確定→参加者の画面に届く」差を、行動ログの手番番号で測る
  const seen={host:new Map(),guest:new Map()};const watch=async(page,name)=>{while(!done){const n=await page.evaluate(()=>{const s=document.querySelector('#turnText');return s?s.textContent:''}).catch(()=>'');const m=n.match(/第(\d+)手番/);if(m&&!seen[name].has(+m[1]))seen[name].set(+m[1],Date.now());await new Promise(r=>setTimeout(r,50))}};
  let done=false;const w1=watch(host,'host'),w2=watch(guest,'guest');
  const dl=Date.now()+(+process.env.TMAX||900000);const hb=bot(host,'host',390,log,7,0,+process.env.PAUSE||0),gb=bot(guest,'guest',360,log,11,+process.env.IDLE||0);
  const [hr,gr]=await Promise.all([hb.run(dl),gb.run(dl)]);done=true;await Promise.all([w1,w2]);
  for(const [name,p] of [['host',host],['guest',guest]]){const d=await p.evaluate(()=>({played:window.__played,decided:window.__decided,sent:window.__sent}));
    console.log('COUNT',name,Object.keys(d.played||{}).length,Object.keys(d.decided||{}).length,Object.keys(d.sent||{}).length);
    for(const [k,o] of Object.entries(d))for(const [id,n] of Object.entries(o||{}))if(n>1&&!(process.env.PAUSE&&name==='host'&&k==='decided'))/* 中断で手番の途中に抜けた分は、再開後にもう一度操作するのが正しい */log(name,'重複',`${k} ${id} が${n}回`)}
  const st={...await host.evaluate(()=>window.__start),...await guest.evaluate(()=>window.__start)},arr=await guest.evaluate(()=>window.__arr);
  const net=Object.keys(st).map(Number).filter(t=>arr[t+1]).map(t=>arr[t+1]-st[t]).sort((a,b)=>a-b);console.log('NET',JSON.stringify({n:net.length,median:net[net.length>>1],p90:net[Math.floor(net.length*.9)],max:net[net.length-1]}));
  {const pa=await guest.evaluate(()=>window.__predAt),own=Object.keys(pa).map(Number).filter(t=>st[t-1]).map(t=>pa[t]-st[t-1]).sort((a,b)=>a-b);console.log('OWN',JSON.stringify({n:own.length,median:own[own.length>>1],max:own[own.length-1]}))}
    const toasts=[];for(const p of [host,guest])toasts.push(await p.evaluate(()=>document.querySelector('#toast').textContent));
  console.log(JSON.stringify({host:hr,guest:gr,sec:Math.round((Date.now()-t0)/1000),turnsSeen:{host:seen.host.size,guest:seen.guest.size},clicks:{host:hb.clicks,guest:gb.clicks},issues:issues.length,lastToast:toasts}));
  await br.close();srv.close();process.exit(hr&&gr&&!issues.filter(i=>i.k!=='info').length?0:1)})().catch(e=>{console.error('FATAL',e);process.exit(2)});
