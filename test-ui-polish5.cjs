// 見やすさ・表記の見直し 第5弾（2026-10-31）の回帰テスト（Playwright・Chromium のスマホ表示エミュレーション）
// 1) 遊び方は箇条書き・道の選び方は「A・B・C」・最後のボタンは「とじる」  2) 題名の下に「試験版」を重ねない
// 3) ポコチャレの報酬の説明  4) カードショップ：見出しは1行まるごと、カードは2列で同じ幅、中身がはみ出さない、所持金の表示
// 5) カード一覧：枚数は2枚以上のときだけ名前の横、すぐ使う案内  6) 天気の画面：変化と決算が同じ時刻なら1つにまとめる
// 7) 空港・港のイベントは「空港イベント」「港イベント」と表示
const {chromium}=require('playwright');const path=require('path');
const fail=[];const ok=(c,m)=>{if(!c)fail.push(m)};
(async()=>{const b=await chromium.launch();try{for(const W of [320,360]){
  const c=await b.newContext({viewport:{width:W,height:740},isMobile:true,hasTouch:true});const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
  await p.route(/firebase|gstatic|googleapis/,r=>r.abort());await p.goto('file://'+path.resolve('index.html'));await p.waitForFunction(()=>!document.querySelector('#bCreate').disabled);
  ok(!/試験版/.test(await p.locator('#ttl').textContent()),'題名に試験版が残る');
  await p.click('#bHow');await p.waitForTimeout(400);const h=await p.evaluate(()=>[document.querySelectorAll('#ov .howlist li').length,document.querySelector('#ov').innerText]);ok(h[0]>=3&&/A・B・C/.test(h[1])&&!/光る矢印をタップ/.test(h[1]),'遊び方の1ページ目');
  for(let i=0;i<4;i++){await p.click('#hNext');await p.waitForTimeout(150)}ok((await p.locator('#hNext').textContent())==='とじる','遊び方の最後のボタン');await p.click('#hNext');
  await p.click('#bCreate');await p.waitForTimeout(300);await p.click('#bStart');await p.waitForTimeout(2000);
  await p.click('#bMis');await p.waitForTimeout(500);ok(/を選べて/.test(await p.locator('#ov .ms-rw').textContent()),'ポコチャレの報酬の説明');await p.evaluate(()=>{document.querySelectorAll('#misSheet').forEach(e=>e.remove());const o=document.querySelector('#ov');o.hidden=true;o.innerHTML=''});
  await p.click('#skyLabel');await p.waitForTimeout(500);const wx=await p.evaluate(()=>({h:dispState.hour,t:document.querySelector('#ov').innerText}));if(wx.h>=18)ok(/次の天気の変化と決算は/.test(wx.t),'天気の画面の時刻のまとめ');await p.evaluate(()=>{const o=document.querySelector('#ov');o.hidden=true;o.innerHTML=''});
  await p.evaluate(()=>{pending.st.players[curSeat(pending.st)].hand=['turbo','warp','warp'];render()});await p.click('#bCard');await p.waitForTimeout(500);
  const cs=await p.evaluate(()=>[!!document.querySelector('#ov .cs-hint'),[...document.querySelectorAll('#ov .cardbtn')].map(b=>b.textContent)]);ok(cs[0]&&cs[1].some(t=>/×2/.test(t))&&!cs[1].some(t=>/×1/.test(t)),'カード一覧の枚数 '+cs[1]);
  await p.evaluate(()=>{const o=document.querySelector('#ov');o.hidden=true;o.innerHTML=''});
  const sh=await p.evaluate(()=>{const seat=curSeat(pending.st);const k=NODES.findIndex(n=>n.type==='shop');pending.stage='shop';pending.pv={pos:k,nd:NODES[k],coin:30000,hand:['turbo','double'],coupon:0,seat,canShop:true};pending.base={type:'roll'};pending.shopOps=[];drawShop();render();
    const L=document.querySelector('#shopList'),R=L.getBoundingClientRect(),hs=[...L.querySelectorAll('.cg-h')],bs=[...L.querySelectorAll('.basebtn')];
    return {head:document.querySelector('#shopHead').innerText,hFull:hs.every(x=>x.getBoundingClientRect().width>=R.width-20),w:[...new Set(bs.map(x=>Math.round(x.getBoundingClientRect().width)))],over:bs.filter(x=>x.scrollHeight>x.clientHeight+2).length,sellHint:L.querySelectorAll('.sellbtn small').length}});
  ok(/所持 30,000G/.test(sh.head)&&!/→/.test(sh.head),'ショップの所持金の表示 '+sh.head);ok(sh.hFull,'ショップの見出しが1行まるごとでない');ok(sh.w.length===1,'ショップのカードの幅がそろわない '+sh.w);ok(sh.over===0,'ショップのカードの中身がはみ出す '+sh.over);ok(sh.sellHint===0,'売るカードごとに同じ案内が出ている');
  const kd=await p.evaluate(()=>{const out=[];const base=curTip().state;for(const ty of ['airport','port']){const ks=NODES.map((n,i)=>i).filter(i=>NODES[i].type===ty&&ADJ[i]&&ADJ[i].length);for(const k of ks)for(let tr=0;tr<10;tr++){const st=JSON.parse(JSON.stringify(base)),seat=curSeat(st);st.players[seat].pos=ADJ[k][0];st.rng=tr*13+k;try{const s2=applyTurn(st,{type:'roll',route:[k],buy:false,reward:'coin',shopDone:true},meta.seed,{noForce:true});if(s2.players[seat].pos!==k)continue;const mv=(s2.ev||[]).find(e=>e.k==='move');const r=resultInfo(s2,st,seat,mv?mv.t:'',NODES[k]);if(r.icon==='🎉'){out.push(ty+':'+r.kind);break}}catch(e){}}}return [...new Set(out)]});
  ok(kd.some(x=>x==='airport:✈ 空港イベント')||kd.some(x=>x==='port:⚓ 港イベント'),'空港・港のイベントの表示 '+kd);ok(!kd.some(x=>/:イベント$/.test(x)),'空港・港のイベントが「イベント」のまま '+kd);
  if(errs.length)fail.push(W+'px JSエラー '+errs.join(' / '));await c.close()}
}finally{await b.close()}
  if(fail.length){console.error('FAIL 見やすさ・表記の見直し 第5弾\n'+fail.join('\n'));process.exitCode=1}else console.log('PASS 見やすさ・表記の見直し 第5弾（遊び方・題名・ポコチャレ・カードショップ・カード一覧・天気・空港と港のイベント）')})();
