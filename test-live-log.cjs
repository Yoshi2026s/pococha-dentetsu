// 通信対戦の途中経過：この番の流れ（📜）・吹き出しの2行表示（2026.11.06.2）のテスト（Playwright・Chromium・iPhone SE 縦 375×667・iPhone 13 横 844×390・通信なし。通信の部分は差しかえ）
const {chromium}=require('playwright');const path=require('path');
const fail=[];let tag='';const ok=(c,m)=>{if(!c)fail.push(tag+m)};
(async()=>{const b=await chromium.launch();try{for(const vp of [{width:375,height:667},{width:844,height:390}]){tag=vp.width+'x'+vp.height+' ';
  const c=await b.newContext({viewport:vp,isMobile:true,hasTouch:true});const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
  await p.route(/firebase|gstatic|googleapis/,r=>r.abort());
  await p.goto('file://'+path.resolve(__dirname,'index.html'));await p.waitForFunction(()=>!document.querySelector('#bCreate').disabled);
  await p.click('#bCreate');await p.waitForTimeout(400);await p.evaluate(()=>{const o=document.querySelector('#ov');o.hidden=true;o.innerHTML=''});await p.click('#bStart');
  await p.waitForFunction(()=>typeof pending!=='undefined'&&pending&&pending.stage==='act'&&!animating(),null,{timeout:20000});await p.waitForTimeout(2500);
  /* ほかの人の番を見ている状態にする：自分は観戦（席なし）、番の人は OTHER */
  const r=await p.evaluate(async()=>{const tip=curTip(),st=tip.state,seat=curSeat(st);let f=-1;for(let i=0;i<NODES.length;i++)if((ADJ[i]||[]).length>=3){f=i;break}
    db={...db,online:{setLive:async()=>{}}};meta={...meta,phase:'playing',paused:null};seats=seats.slice();seats=seats.map((x,i)=>i===seat?{...(x||{}),uid:'OTHER'}:x&&x.uid===myId?{...x,uid:'ME_AWAY'}:x);floatNum=()=>{};
    const base={uid:'OTHER',turn:tip.turn,seat,d:0,ds:[],card:'',path:[],stage:'act',opts:[]};liveRolled=tip.turn;const out={};
    onLive(base);onLive({...base,stage:'card',info:'カードを選び中（手札2枚）'});onLive({...base,stage:'card',info:'カードを使うか確認中'});
    const x=ADJ[f][1],y=(ADJ[x]||[]).find(z=>z!==f);
    onLive({...base,stage:'route',d:3,ds:[1,2],path:[f],opts:ADJ[f].slice()});onLive({...base,stage:'route',d:3,ds:[1,2],path:[f,x],opts:[]});
    out.bub=(()=>{const e=document.querySelector('#liveBub');if(!e||e.hidden)return null;const t=e.querySelector('.lb-tx'),l=e.querySelector('.lb-log'),cs=getComputedStyle(t),rb=e.getBoundingClientRect(),dk=document.querySelector('.dicebox'),dr=dk?dk.getBoundingClientRect():null,mb=document.querySelector('#mapbox').getBoundingClientRect(),lr=l.getBoundingClientRect();return{clamp:cs.webkitLineClamp,ws:getComputedStyle(e.querySelector('.lb-t')).whiteSpace,h:rb.height,inMap:rb.left>=mb.left-1&&rb.right<=mb.right+1&&rb.bottom<=mb.bottom+1,log:[lr.width,lr.height],dice:!dr||dr.width===0||rb.right<=dr.left+1||rb.bottom<=dr.top+1||rb.top>=dr.bottom-1}})();
    onLive({...base,stage:'route',d:3,ds:[1,2],path:[f],opts:ADJ[f].slice()});/* 1マス戻した */
    if(y!=null){onLive({...base,stage:'route',d:2,path:[f,x,y],opts:[]})}
    out.items=(liveLog?liveLog.items:[]).map(i=>i.text);
    document.querySelector('#liveBub .lb-log').click();await new Promise(r=>setTimeout(r,200));const sh=document.querySelector('#ov .llsheet');out.sheet=sh?[sh.querySelectorAll('.ll-list li').length,sh.querySelector('.ll-sub').textContent,sh.querySelector('h3').textContent]:null;
    onLive({...base,stage:'buy',d:2,path:y!=null?[f,x,y]:[f,x],opts:[0],info:'柳川駅で物件を選び中（1件・1,000G）'});onLive({...base,stage:'buy',d:2,path:y!=null?[f,x,y]:[f,x],opts:[0,1],info:'柳川駅で物件を選び中（2件・3,000G）'});
    out.after=sh?[sh.querySelectorAll('.ll-list li').length,sh.querySelector('.ll-list li:last-child').textContent]:null;
    const ws=[...sh.querySelectorAll('button')].map(b=>b.offsetHeight);out.btn=Math.min(...ws);
    document.querySelector('#llClose').click();showPlayers();out.ps=!!document.querySelector('#psLog');document.querySelector('#psLog')&&document.querySelector('#psLog').click();out.ps2=!!document.querySelector('#ov .llsheet');document.querySelector('#llClose')&&document.querySelector('#llClose').click();
    return out});
  ok(r.bub&&r.bub.dice,'吹き出しが右下のサイコロに重なる '+JSON.stringify(r.bub));
  /* 確定：✅ 確定を書き足す・途中経過のない番（CPU）も記録から作る・最近8手番・前後の番へ移る */
  const f2=await p.evaluate(async()=>{const tip=curTip(),st=tip.state,seat=curSeat(st),out={};db={...db,online:{setLive:async()=>{}}};
    const mk=(s0)=>{const pv=preview(s0,{type:'roll'}),pos=s0.players[curSeat(s0)].pos,rt=smartRoute(s0,pos,pv.dice,new Set([pos])).route;return applyTurn(s0,{type:'roll',route:rt,buy:false,reward:'coin',shopDone:true},meta.seed,{noForce:true})};
    const s1=mk(st);liveLogFinal({state:s1,parent:tip.id,by:'s'+seat+':OTHER'},st);const g=liveLogs.find(x=>x.turn===tip.turn&&x.seat===seat);out.g=g?[g.done,g.items.map(i=>i.text)]:null;
    /* 次の番（CPUの席にして、途中経過なし） */const seat2=curSeat(s1);meta={...meta,cpu:[seat2]};const s2=mk(s1);liveLogFinal({state:s2,parent:'x',by:'cpu'+seat2+':H'},s1);const g2=liveLogs.find(x=>x.turn===s1.turn&&x.seat===seat2);out.g2=g2?[g2.fromRec,g2.items.map(i=>i.text)]:null;
    /* 確定のあとに同じ番の途中経過が来ても書き足さない */liveLogAdd({turn:s1.turn,seat:seat2},'late','遅れて届いた');out.late=g2.items.some(i=>i.text==='遅れて届いた');
    showLiveLog();await new Promise(r=>setTimeout(r,200));const q=()=>{const o=document.querySelector('#ov .llsheet');return o?[o.querySelector('h3').textContent,o.querySelector('.ll-sub').textContent,o.querySelector('#llPrev').disabled,o.querySelector('#llNext').disabled,o.querySelectorAll('.ll-done').length,o.querySelector('#llPrev').offsetHeight,document.querySelector('#llClose').getBoundingClientRect().bottom<=innerHeight+1||(innerHeight<500&&(v=>/auto|scroll/.test(getComputedStyle(v).overflowY)&&v.scrollHeight>v.clientHeight)(document.querySelector('#ov')))]:null};
    out.s1=q();document.querySelector('#llPrev').click();await new Promise(r=>setTimeout(r,200));out.s2=q();document.querySelector('#llClose').click();
    for(let k=0;k<12;k++)liveLogAdd({turn:1000+k,seat:1},'x','t'+k);out.cap=[liveLogs.length,liveLogs[0].turn];return out});
  ok(f2.g&&f2.g[0]&&/^✅ 確定/.test(f2.g[1][f2.g[1].length-1]),'確定の書き足し '+JSON.stringify(f2.g));
  ok(f2.g2&&f2.g2[0]&&f2.g2[1][0]==='🤖 CPUの番'&&f2.g2[1].some(t=>/^🎲 サイコロ \d/.test(t))&&/^✅ 確定/.test(f2.g2[1][f2.g2[1].length-1]),'CPUの番を記録から作る '+JSON.stringify(f2.g2));
  ok(!f2.late,'確定後の途中経過を書き足した');
  ok(f2.s1&&/CPUの番|番の流れ/.test(f2.s1[0])&&/記録から/.test(f2.s1[1])&&f2.s1[2]===false&&f2.s1[3]===true&&f2.s1[4]===1&&f2.s1[5]>=48&&f2.s1[6],'流れの画面（最新・前へ） '+JSON.stringify(f2.s1));
  ok(f2.s2&&f2.s2[3]===false&&/確定しました/.test(f2.s2[1]),'前の番へ移る '+JSON.stringify(f2.s2));
  ok(f2.cap[0]===8&&f2.cap[1]===1004,'最近8手番まで '+JSON.stringify(f2.cap));
  const it=r.items||[];
  ok(r.bub&&r.bub.clamp==='2'&&r.bub.ws==='normal'&&r.bub.inMap,'吹き出しが2行まで出ない・地図からはみ出す '+JSON.stringify(r.bub));
  ok(r.bub&&r.bub.log[0]>=48&&r.bub.log[1]>=48,'📜ボタンが48px未満 '+JSON.stringify(r.bub));
  ok(/^🤔 考え中/.test(it[0])&&it.some(t=>t==='🃏 カードを使うか確認中')&&!it.some(t=>t==='🃏 カードを選び中（手札2枚）'),'考え中・カード選び（同じ場面は書きかえ） '+JSON.stringify(it));
  ok(it.filter(t=>t==='🎲 サイコロ 3（1+2）').length===1,'サイコロは1回だけ '+JSON.stringify(it));
  ok(it.some(t=>/^🔀 分かれ道でB：.*へ（候補\d+つ）$/.test(t)),'分かれ道で選んだ道 '+JSON.stringify(it));
  ok(it.some(t=>t==='↩ 道を1マス戻した'),'戻した道 '+JSON.stringify(it));
  ok(r.sheet&&r.sheet[0]===it.length&&/リアルタイム/.test(r.sheet[1])&&/の番の流れ/.test(r.sheet[2]),'流れの画面 '+JSON.stringify(r.sheet));
  ok(r.after&&r.after[0]>=r.sheet[0]+1&&/2件・3,000G/.test(r.after[1]),'開いている間に増える・物件選びは書きかえ '+JSON.stringify(r.after));
  ok(r.btn>=48,'流れの画面のボタンが48px未満 '+r.btn);
  ok(r.ps&&r.ps2,'👥 状況から流れを開けない '+JSON.stringify([r.ps,r.ps2]));
  ok(await p.evaluate(()=>{const i=SYS.findIndex(x=>x[0].includes('途中経過'));return i>=0&&/この番の流れ/.test(SYS[i][2])}),'システム説明に流れ');
  if(errs.length)fail.push(tag+'JSエラー '+errs.join(' / '));await c.close();}
  }finally{await b.close()}
  if(fail.length){console.error('FAIL 途中経過（この番の流れ）\n'+fail.join('\n'));process.exitCode=1}else console.log('PASS 途中経過（この番の流れ・吹き出し2行）')})();
