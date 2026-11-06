// 通信対戦の途中経過：止まれるマスの予報・目的地に届く目・分かれ道で選んだ道・カードの確認中（2026.11.06.1）のテスト（Playwright・Chromium・iPhone SE 縦 375×667・通信なし）
const {chromium}=require('playwright');const path=require('path');
const fail=[];const ok=(c,m)=>{if(!c)fail.push(m)};
(async()=>{const b=await chromium.launch();try{
  const c=await b.newContext({viewport:{width:375,height:667},isMobile:true,hasTouch:true});const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
  await p.route(/firebase|gstatic|googleapis/,r=>r.abort());
  await p.goto('file://'+path.resolve(__dirname,'index.html'));await p.waitForFunction(()=>!document.querySelector('#bCreate').disabled);
  await p.click('#bCreate');await p.waitForTimeout(400);await p.evaluate(()=>{const o=document.querySelector('#ov');o.hidden=true;o.innerHTML=''});await p.click('#bStart');
  await p.waitForFunction(()=>typeof pending!=='undefined'&&pending&&pending.stage==='act',null,{timeout:20000});
  /* 1) 止まれるマス：おまかせの道の行き先は必ず含まれる・1マス進むと絞りこむ・候補ごとの🏁 */
  const r1=await p.evaluate(()=>{const out=[];const st=curTip().state;let bad=0,tried=0,fork=null;
    for(let s=0;s<NODES.length&&tried<120;s+=3){if(!ADJ[s]||!ADJ[s].length)continue;for(const d of [1,3,5,8]){tried++;const L={turn:st.turn,seat:1,stage:'route',d,path:[s],opts:[]};liveReachMemo={k:'',v:null};const R=liveReach(st,L,[s]);const sr=smartRoute(st,s,d,new Set([s])).route,end=sr.length?sr[sr.length-1]:s;if(!R||!R.ends.includes(end))bad++;
      if(!fork&&d===5&&ADJ[s].length>=3)fork={s,d,R}}}
    out.push(bad,tried);
    /* 1マス進むと、止まれるマスはその先だけになる（数は増えない・前の候補の中に入る） */const s=fork.s,x=ADJ[s][0],L2={turn:st.turn,seat:1,stage:'route',d:5,path:[s,x],opts:[]};const R2=liveReach(st,L2,[s,x]);out.push(R2.ends.every(e=>fork.R.ends.includes(e)),R2.n<=fork.R.n,R2.left===4);
    /* 目的地を止まれるマスの1つにすると届く・その道の候補だけに🏁 */const keep=st.goal;st.goal=fork.R.ends[0];liveReachMemo={k:'',v:null};const L3={turn:st.turn,seat:1,stage:'route',d:5,path:[s],opts:ADJ[s].slice()};const R3=liveReach(st,L3,[s]);out.push(R3.goal,R3.optGoal.some(Boolean));
    liveOptsDraw(L3);const g=document.querySelector('#liveopts');out.push(g.querySelectorAll('.lo-reach').length===Math.min(40,R3.n),g.querySelectorAll('.lo-hot').length===1,[...g.querySelectorAll('.lo-opt text')].filter(t=>t.textContent==='🏁').length===R3.optGoal.filter(Boolean).length);
    /* 進み終えたら（あと0マス）止まれるマスは出さない */liveOptsDraw({turn:st.turn,seat:1,stage:'route',d:1,path:[s,x],opts:[]});out.push(g.querySelectorAll('.lo-reach').length===0);liveOptsDraw(null);st.goal=keep;liveReachMemo={k:'',v:null};
    /* 文：届く目・止まれるマスの数（あと0マスなら付けない） */out.push(liveText({stage:'route',d:5,n:1,fork:true,reach:{n:4,goal:true}}),liveText({stage:'route',d:5,n:2,reach:{n:3,fever:true,more:true}}),liveText({stage:'route',d:5,n:2,reach:{n:1}}));return out});
  ok(r1[0]===0&&r1[1]>20,'おまかせの行き先が止まれるマスに入っていない '+JSON.stringify(r1.slice(0,2)));
  ok(r1[2]&&r1[3]&&r1[4],'1マス進んだあとの絞りこみ '+JSON.stringify(r1.slice(2,5)));
  ok(r1[5]&&r1[6],'目的地に届く目・候補ごとの🏁 '+JSON.stringify(r1.slice(5,7)));
  ok(r1[7]&&r1[8]&&r1[9],'地図の止まれるマス・🏁届く・候補の🏁 '+JSON.stringify(r1.slice(7,10)));
  ok(r1[10],'進み終えたら止まれるマスを消す');
  ok(r1[11]==='🎲5・分かれ道で選び中（あと4マス）・🏁目的地に届く！・止まれるマス4か所','文（届く目） '+r1[11]);
  ok(r1[12]==='🎲5・あと3マス・🔥フィーバー駅に届く・止まれるマス3以上か所','文（フィーバー） '+r1[12]);
  ok(r1[13]==='🎲5・あと3マス','文（1か所なら数を出さない） '+r1[13]);
  /* 2) 受け取り側：分かれ道で選んだ道を「A：○○方面へ」・届く目を1回だけ知らせる（通信の部分は差しかえ） */
  const r2=await p.evaluate(async()=>{const tip=curTip(),st=tip.state,seat=curSeat(st),s=st.players[seat].pos;let f=-1;for(let i=0;i<NODES.length;i++)if((ADJ[i]||[]).length>=3){f=i;break}
    const keep={db,meta,seats,SL:SET.live};const fl=[];const ofn=floatNum;floatNum=(n,t)=>fl.push(t);
    db={...db,online:{setLive:async()=>{}}};meta={...meta,phase:'playing',paused:null};seats=seats.slice();const other=seat;seats[other]={...(seats[other]||{}),uid:'OTHER'};
    const L={uid:'OTHER',turn:tip.turn,seat:other,d:5,ds:[],card:'',path:[f],stage:'route',opts:ADJ[f].slice()};const keepGoal=st.goal;liveReachMemo={k:'',v:null};st.goal=liveReach(st,{...L},[f]).ends[0];liveReachMemo={k:'',v:null};
    try{liveRolled=tip.turn;onLive(L);const a=fl.slice();onLive({...L,path:[f,ADJ[f][1]],opts:[]});const b2=fl.slice(a.length);onLive({...L,path:[f,ADJ[f][1]],opts:[]});const c3=fl.length-a.length-b2.length;return[a,b2,c3,liveBadge(other)]}
    finally{floatNum=ofn;st.goal=keepGoal;db=keep.db;meta=keep.meta;seats=keep.seats;liveCur=null;liveReachMemo={k:'',v:null};liveOptsDraw(null)}});
  ok(r2[0].some(t=>/が届く目！/.test(t)),'届く目の知らせ '+JSON.stringify(r2));
  ok(r2[1].some(t=>/^B：.*へ$/.test(t)),'分かれ道で選んだ道の知らせ '+JSON.stringify(r2));
  ok(r2[2]===0,'同じ途中経過で知らせをくり返さない '+JSON.stringify(r2));
  /* 3) カードの確認中も「カード選び」として送る（考え中に戻らない・カード名は送らない） */
  const r3=await p.evaluate(async()=>{const st=pending.st,me=curSeat(st);if(!(st.players[me].hand||[]).length)st.players[me].hand.push('linear');const sent=[];const keep={db,meta};db={...db,online:{setLive:async(c,q)=>{sent.push(q)}}};meta={...meta,phase:'playing',paused:null};const kc=code;liveKey='';
    try{document.querySelector('#bCard').click();await new Promise(r=>setTimeout(r,300));const btn=document.querySelector('#ov .cardsheet [data-k], #ov .cardsheet button.cardbtn, #ov .cardsheet .cbtn');const any=btn||[...document.querySelectorAll('#ov .cardsheet button')].find(b=>b.onclick&&!/とじる|閉じる/.test(b.textContent));any&&any.click();await new Promise(r=>setTimeout(r,400));
      const conf=!!document.querySelector('#ov .cardconf');const last=sent[sent.length-1]||{};return[conf,last.stage,last.info,JSON.stringify(last).includes(CARDN[st.players[me].hand[0]]||'@@')]}finally{db=keep.db;meta=keep.meta;const o=document.querySelector('#ov');o.hidden=true;o.innerHTML=''}});
  ok(r3[0]&&r3[1]==='card'&&r3[2]==='カードを使うか確認中'&&!r3[3],'カードの確認中の途中経過 '+JSON.stringify(r3));
  ok(await p.evaluate(()=>{const i=SYS.findIndex(x=>x[0].includes('途中経過'));return i>=0&&/止まれるマス/.test(SYS[i][2])&&/方面へ/.test(SYS[i][2])}),'システム説明に止まれるマス');
  if(errs.length)fail.push('JSエラー '+errs.join(' / '));await c.close();
  }finally{await b.close()}
  if(fail.length){console.error('FAIL 途中経過（止まれるマス）\n'+fail.join('\n'));process.exitCode=1}else console.log('PASS 途中経過（止まれるマス・届く目・選んだ道・カードの確認中）')})();
