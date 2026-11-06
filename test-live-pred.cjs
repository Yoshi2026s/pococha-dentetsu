// 通信対戦の途中経過：分かれ道の予想（2026.11.06.5）のテスト（Playwright・Chromium・iPhone SE 縦 375×667・iPhone 13 横 844×390・通信なし。通信の部分は差しかえ）
const {chromium}=require('playwright');const path=require('path');
const fail=[];let tag='';const ok=(c,m)=>{if(!c)fail.push(tag+m)};
(async()=>{const b=await chromium.launch();try{for(const vp of [{width:375,height:667},{width:844,height:390}]){tag=vp.width+'x'+vp.height+' ';
  const c=await b.newContext({viewport:vp,isMobile:true,hasTouch:true});const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
  await p.route(/firebase|gstatic|googleapis/,r=>r.abort());
  await p.goto('file://'+path.resolve(__dirname,'index.html'));await p.waitForFunction(()=>!document.querySelector('#bCreate').disabled);
  await p.click('#bCreate');await p.waitForTimeout(400);await p.evaluate(()=>{const o=document.querySelector('#ov');o.hidden=true;o.innerHTML=''});await p.click('#bStart');
  await p.waitForFunction(()=>typeof pending!=='undefined'&&pending&&pending.stage==='act'&&!animating(),null,{timeout:20000});await p.waitForTimeout(2500);
  const r=await p.evaluate(async()=>{const tip=curTip(),st=tip.state,seat=curSeat(st),out={};const forks=[];for(let i=0;i<NODES.length&&forks.length<2;i++)if((ADJ[i]||[]).length>=3)forks.push(i);const f=forks[0];
    db={...db,online:{setLive:async()=>{}}};meta={...meta,phase:'playing',paused:null};seats=seats.map((x,i)=>i===seat?{...(x||{}),uid:'OTHER'}:x&&x.uid===myId?{...x,uid:'ME_AWAY'}:x);floatNum=()=>{};const toasts=[];const ot=toast;toast=t=>{toasts.push(t)};
    const base={uid:'OTHER',turn:tip.turn,seat,d:4,ds:[],card:'',stage:'route'};liveRolled=tip.turn;
    onLive({...base,path:[f],opts:ADJ[f].slice()});liveBubble();
    const e=document.querySelector('#livePred'),R=x=>x.getBoundingClientRect(),bt=[...e.querySelectorAll('button')],mb=R(document.querySelector('#mapbox')),bb=R(document.querySelector('#liveBub')),dk=document.querySelector('.dicebox'),dr=dk?R(dk):null,er=R(e);
    const ov=(a,b)=>a&&b&&b.width>0&&!(a.right<=b.left+1||a.left>=b.right-1||a.bottom<=b.top+1||a.top>=b.bottom-1);
    out.row=[!e.hidden,bt.length,ADJ[f].length,Math.min(...bt.map(x=>Math.min(R(x).width,R(x).height))),er.left>=mb.left-1&&er.right<=mb.right+1&&er.bottom<=mb.bottom+1,!ov(er,bb),!ov(er,dr),bt[0].getAttribute('aria-label')];
    bt[1].click();await new Promise(r=>setTimeout(r,50));out.sel=[document.querySelector('#livePred button.sel')?.dataset.x,String(ADJ[f][1]),/予想した/.test(e.textContent)];
    onLive({...base,path:[f,ADJ[f][1]],opts:[]});liveBubble();out.hit=[toasts.filter(t=>/予想/.test(t)),predStat.hit,predStat.total,e.hidden,(liveLog?liveLog.items:[]).some(i=>i.text==='🔮 予想 B → 的中！')];
    /* 2つ目の分かれ道ではずれ */const g=forks[1];const base2={...base,turn:tip.turn,d:8};liveCur=null;liveLog=null;onLive({...base2,path:[g],opts:ADJ[g].slice()});liveBubble();document.querySelector('#livePred button').click();onLive({...base2,path:[g,ADJ[g][2]],opts:[]});
    out.miss=[toasts.filter(t=>/予想/.test(t)).pop(),predStat.hit,predStat.total,(liveLog?liveLog.items:[]).some(i=>i.text==='🔮 予想 A → はずれ（Cでした）')];
    /* 予想しなければ何も言わない */const n0=toasts.length;liveCur=null;onLive({...base2,d:6,path:[f],opts:ADJ[f].slice()});liveBubble();out.stat=document.querySelector('#livePred').textContent;onLive({...base2,d:6,path:[f,ADJ[f][0]],opts:[]});out.quiet=toasts.length===n0;
    /* 途中経過を見ない設定では出さない */liveCur=null;onLive({...base2,d:7,path:[f],opts:ADJ[f].slice()});SET.live=false;liveBubble();out.off=document.querySelector('#livePred').hidden;SET.live=true;toast=ot;return out});
  ok(r.row[0]&&r.row[1]===r.row[2]&&r.row[3]>=48&&r.row[4]&&r.row[5]&&r.row[6]&&/^A.*に進むと予想$/.test(r.row[7]),'予想の行（数・48px・地図の中・吹き出しやサイコロに重ならない・読み上げ） '+JSON.stringify(r.row));
  ok(r.sel[0]===r.sel[1]&&r.sel[2],'選んだ予想が光る '+JSON.stringify(r.sel));
  ok(r.hit[0].length===1&&/^⭕ 予想的中！（的中 1\/1）$/.test(r.hit[0][0])&&r.hit[1]===1&&r.hit[2]===1&&r.hit[3]&&r.hit[4],'的中 '+JSON.stringify(r.hit));
  ok(/^❌ 予想はずれ…（的中 1\/2）$/.test(r.miss[0])&&r.miss[1]===1&&r.miss[2]===2&&r.miss[3],'はずれ '+JSON.stringify(r.miss));
  ok(/的中 1\/2/.test(r.stat)&&r.quiet,'的中数の表示・予想しないときは知らせない '+JSON.stringify([r.stat,r.quiet]));
  ok(r.off,'途中経過を見ない設定で予想の行が出る');
  if(errs.length)fail.push(tag+'JSエラー '+errs.join(' / '));await c.close()}
  ok(await (async()=>{const c=await b.newContext();const p=await c.newPage();await p.route(/firebase|gstatic|googleapis/,r=>r.abort());await p.goto('file://'+path.resolve(__dirname,'index.html'));const v=await p.evaluate(()=>{const i=SYS.findIndex(x=>x[0].includes('途中経過'));return i>=0&&/分かれ道の予想/.test(SYS[i][2])});await c.close();return v})(),'システム説明');
  }finally{await b.close()}
  if(fail.length){console.error('FAIL 途中経過（分かれ道の予想）\n'+fail.join('\n'));process.exitCode=1}else console.log('PASS 途中経過（分かれ道の予想）')})();
