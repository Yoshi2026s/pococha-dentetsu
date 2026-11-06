// 通信対戦の途中経過：分かれ道でカメラを引く・「途中経過をくわしく」の切りかえ（2026.11.06.7）のテスト（Playwright・Chromium・iPhone SE 縦 375×667・通信なし。通信の部分は差しかえ）
const {chromium}=require('playwright');const path=require('path');
const fail=[];const ok=(c,m)=>{if(!c)fail.push(m)};
(async()=>{const b=await chromium.launch();try{
  const c=await b.newContext({viewport:{width:375,height:667},isMobile:true,hasTouch:true});const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
  await p.route(/firebase|gstatic|googleapis/,r=>r.abort());
  await p.goto('file://'+path.resolve(__dirname,'index.html'));await p.waitForFunction(()=>!document.querySelector('#bCreate').disabled);
  await p.click('#bCreate');await p.waitForTimeout(400);await p.evaluate(()=>{const o=document.querySelector('#ov');o.hidden=true;o.innerHTML=''});await p.click('#bStart');
  await p.waitForFunction(()=>typeof pending!=='undefined'&&pending&&pending.stage==='act'&&!animating(),null,{timeout:20000});await p.waitForTimeout(2500);
  const r=await p.evaluate(async()=>{const tip=curTip(),st=tip.state,seat=curSeat(st),out={};const forks=[];for(let i=0;i<NODES.length&&forks.length<3;i++)if((ADJ[i]||[]).length>=3)forks.push(i);
    db={...db,online:{setLive:async()=>{}}};meta={...meta,phase:'playing',paused:null};seats=seats.map((v,i)=>i===seat?{...(v||{}),uid:'OTHER'}:v&&v.uid===myId?{...v,uid:'ME_AWAY'}:v);floatNum=()=>{};
    const fits=[];const of=camFit;camFit=(ids,ms)=>fits.push(ids.slice());const base={uid:'OTHER',turn:tip.turn,seat,d:6,ds:[],card:'',stage:'route'};liveRolled=tip.turn;
    /* 1) 分かれ道で1回だけ引く：駒・候補・止まれるマスが入る */const f=forks[0];onLive({...base,path:[f],opts:ADJ[f].slice()});onLive({...base,path:[f],opts:ADJ[f].slice()});
    liveReachMemo={k:'',v:null};const R=liveReach(st,{...base,path:[f],opts:ADJ[f].slice()},[f]);out.fit1=[fits.length,fits[0]&&fits[0][0]===f,fits[0]&&ADJ[f].every(x=>fits[0].includes(x)),fits[0]&&R.ends.slice(0,40).every(x=>fits[0].includes(x))];
    /* 2) 移動の途中で分かれ道に着いたら、最後の1マスのあとで引く */const g=forks[1],a=ADJ[g][0],b0=ADJ[a].find(x=>x!==g);liveCur=null;liveWalk=null;const n0=fits.length;onLive({...base,turn:tip.turn,d:7,path:[b0],opts:[]});onLive({...base,d:7,path:[b0,a,g],opts:ADJ[g].filter(x=>x!==a)});const mid=fits.length-n0;await new Promise(r=>setTimeout(r,600));out.fit2=[mid,fits.length-n0];
    /* 3) カメラで追いかけない設定では引かない */SET.liveCam=false;const h=forks[2];liveCur=null;const n1=fits.length;onLive({...base,d:5,path:[h],opts:ADJ[h].slice()});out.fit3=fits.length-n1;SET.liveCam=true;
    /* 4) くわしく表示を切ると、止まれるマス・駒の上の吹き出し・予想・吹き出しの数を出さない */SET.liveMore=false;liveReachMemo={k:'',v:null};liveCur=null;onLive({...base,d:5,path:[h],opts:ADJ[h].slice()});liveBubble();const G=document.querySelector('#liveopts');
    out.simple=[G.querySelectorAll('.lo-reach').length,G.querySelectorAll('.lo-think').length,G.querySelectorAll('.lo-opt').length>0,(document.querySelector('#livePred')||{hidden:true}).hidden,/止まれるマス/.test(liveText(liveCur))];
    SET.liveMore=true;liveReachMemo={k:'',v:null};liveOptsDraw(liveLast);liveBubble();out.full=[G.querySelectorAll('.lo-reach').length>0,G.querySelectorAll('.lo-think').length,!document.querySelector('#livePred').hidden,/止まれるマス/.test(liveText(liveCur))];camFit=of;liveOptsDraw(null);return out});
  ok(r.fit1[0]===1&&r.fit1.slice(1).every(Boolean),'分かれ道で1回だけカメラを引く（駒・候補・止まれるマス） '+JSON.stringify(r.fit1));
  ok(r.fit2[0]===0&&r.fit2[1]===1,'移動の途中は待ち、最後の1マスのあとで引く '+JSON.stringify(r.fit2));
  ok(r.fit3===0,'カメラで追いかけない設定で引いた');
  ok(JSON.stringify(r.simple)==='[0,0,true,true,false]','くわしく表示を切ったとき '+JSON.stringify(r.simple));
  ok(JSON.stringify(r.full)==='[true,1,true,true]','くわしく表示に戻したとき '+JSON.stringify(r.full));
  /* 音と設定の切りかえが保存される */
  await p.evaluate(()=>{const o=document.querySelector('#ov');o.hidden=true;o.innerHTML=''});await p.click('#bMenu');await p.waitForTimeout(300);await p.click('#mnSet');await p.waitForTimeout(300);
  const sv=await p.evaluate(()=>{const a=document.querySelector('#sLiveMore');if(!a)return null;const r=[a.checked,a.closest('label').getBoundingClientRect().height];a.click();return r.concat([JSON.parse(localStorage.getItem('poco-set')||'{}').liveMore,SET.liveMore])});
  ok(sv&&sv[0]&&sv[1]>=48&&sv[2]===false&&sv[3]===false,'音と設定「途中経過をくわしく」 '+JSON.stringify(sv));
  ok(await p.evaluate(()=>{const i=SYS.findIndex(x=>x[0].includes('途中経過'));return i>=0&&/途中経過をくわしく/.test(SYS[i][2])&&/カメラを1回だけ引きます/.test(SYS[i][2])}),'システム説明');
  if(errs.length)fail.push('JSエラー '+errs.join(' / '));await c.close();
  }finally{await b.close()}
  if(fail.length){console.error('FAIL 途中経過（カメラ・表示の量）\n'+fail.join('\n'));process.exitCode=1}else console.log('PASS 途中経過（分かれ道でカメラを引く・くわしく表示の切りかえ）')})();
