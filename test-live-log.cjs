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
    out.bub=(()=>{const e=document.querySelector('#liveBub');if(!e||e.hidden)return null;const t=e.querySelector('.lb-tx'),l=e.querySelector('.lb-log'),cs=getComputedStyle(t),rb=e.getBoundingClientRect(),mb=document.querySelector('#mapbox').getBoundingClientRect(),lr=l.getBoundingClientRect();return{clamp:cs.webkitLineClamp,ws:getComputedStyle(e.querySelector('.lb-t')).whiteSpace,h:rb.height,inMap:rb.left>=mb.left-1&&rb.right<=mb.right+1&&rb.bottom<=mb.bottom+1,log:[lr.width,lr.height]}})();
    onLive({...base,stage:'route',d:3,ds:[1,2],path:[f],opts:ADJ[f].slice()});/* 1マス戻した */
    if(y!=null){onLive({...base,stage:'route',d:2,path:[f,x,y],opts:[]})}
    out.items=(liveLog?liveLog.items:[]).map(i=>i.text);
    document.querySelector('#liveBub .lb-log').click();await new Promise(r=>setTimeout(r,200));const sh=document.querySelector('#ov .llsheet');out.sheet=sh?[sh.querySelectorAll('.ll-list li').length,sh.querySelector('.ll-sub').textContent,sh.querySelector('h3').textContent]:null;
    onLive({...base,stage:'buy',d:2,path:y!=null?[f,x,y]:[f,x],opts:[0],info:'柳川駅で物件を選び中（1件・1,000G）'});onLive({...base,stage:'buy',d:2,path:y!=null?[f,x,y]:[f,x],opts:[0,1],info:'柳川駅で物件を選び中（2件・3,000G）'});
    out.after=sh?[sh.querySelectorAll('.ll-list li').length,sh.querySelector('.ll-list li:last-child').textContent]:null;
    const ws=[...sh.querySelectorAll('button')].map(b=>b.offsetHeight);out.btn=Math.min(...ws);
    document.querySelector('#llClose').click();showPlayers();out.ps=!!document.querySelector('#psLog');document.querySelector('#psLog')&&document.querySelector('#psLog').click();out.ps2=!!document.querySelector('#ov .llsheet');document.querySelector('#llClose')&&document.querySelector('#llClose').click();
    return out});
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
