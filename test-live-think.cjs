// 通信対戦の途中経過：駒の上の吹き出し・止まれるマスの良し悪し（2026.11.06.4）のテスト（Playwright・Chromium・iPhone SE 縦 375×667・通信なし）
const {chromium}=require('playwright');const path=require('path');
const fail=[];const ok=(c,m)=>{if(!c)fail.push(m)};
(async()=>{const b=await chromium.launch();try{
  const c=await b.newContext({viewport:{width:375,height:667},isMobile:true,hasTouch:true});const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
  await p.route(/firebase|gstatic|googleapis/,r=>r.abort());
  await p.goto('file://'+path.resolve(__dirname,'index.html'));await p.waitForFunction(()=>!document.querySelector('#bCreate').disabled);
  await p.click('#bCreate');await p.waitForTimeout(400);await p.evaluate(()=>{const o=document.querySelector('#ov');o.hidden=true;o.innerHTML=''});await p.click('#bStart');
  await p.waitForFunction(()=>typeof pending!=='undefined'&&pending&&pending.stage==='act',null,{timeout:20000});
  const r=await p.evaluate(()=>{const tip=curTip(),st=tip.state,seat=1,pos=st.players[seat].pos,g=document.querySelector('#liveopts'),out={};let f=-1;for(let i=0;i<NODES.length;i++)if((ADJ[i]||[]).length>=3){f=i;break}
    const th=L=>{liveReachMemo={k:'',v:null};liveOptsDraw({turn:tip.turn,seat,...L});const e=g.querySelector('.lo-think');return e?[e.querySelector('text').textContent,e.getAttribute('transform')]:null};
    out.act=th({stage:'act',d:0,path:[],opts:[]});out.walk=th({stage:'route',d:5,path:[f],opts:[]});out.fork=th({stage:'route',d:5,path:[f],opts:ADJ[f].slice()});out.arr=th({stage:'route',d:1,path:[f,ADJ[f][0]],opts:[]});
    const k=NODES.findIndex(n=>n.type==='station'&&n.bases&&n.bases.length);out.buy=th({stage:'buy',d:1,path:[ADJ[k][0],k],opts:[0]});out.buyY=+(NODES[k].y-58).toFixed(1);out.actPos=[+NODES[pos].x.toFixed(1),+(NODES[pos].y-30).toFixed(1)];
    /* 良し悪し：止まれるマスの数と輪の色が合う */liveReachMemo={k:'',v:null};const L={turn:tip.turn,seat,stage:'route',d:6,path:[f],opts:[]};const R=liveReach(st,L,[f]);liveOptsDraw(L);
    const want=R.ends.slice(0,40),gd=want.filter(x=>liveSqKind(x)>0&&x!==st.goal&&!(R.fever&&x===st.fever)).length,bd=want.filter(x=>liveSqKind(x)<0&&x!==st.goal&&!(R.fever&&x===st.fever)).length;
    out.kind=[R.good+R.bad>0,g.querySelectorAll('.lo-good').length===gd,g.querySelectorAll('.lo-bad').length===bd,R.good===R.ends.filter(x=>liveSqKind(x)>0).length];
    out.k2=[liveSqKind(NODES.findIndex(n=>n.type==='plus')),liveSqKind(NODES.findIndex(n=>n.type==='minus')),liveSqKind(NODES.findIndex(n=>n.type==='event'))];
    out.txt=liveText({stage:'route',d:5,n:1,reach:{n:5,good:3,bad:1}});liveOptsDraw(null);out.clear=g.children.length;return out});
  ok(r.act&&r.act[0]==='🤔 考え中'&&r.act[1]===`translate(${r.actPos[0].toFixed(1)} ${r.actPos[1].toFixed(1)})`,'考え中の吹き出しが駒の上にない '+JSON.stringify([r.act,r.actPos]));
  ok(r.walk&&r.walk[0]==='🎲5 あと5','進んでいる途中 '+JSON.stringify(r.walk));
  ok(r.fork&&r.fork[0]==='🔀 選び中 あと5','分かれ道 '+JSON.stringify(r.fork));
  ok(r.arr&&r.arr[0]==='🎲1 📍到着','到着 '+JSON.stringify(r.arr));
  ok(r.buy&&r.buy[0]==='🏠 物件選び'&&r.buy[1].endsWith(' '+r.buyY.toFixed(1)+')'),'物件選びは絵札の上に '+JSON.stringify([r.buy,r.buyY]));
  ok(r.kind.every(Boolean),'止まれるマスの良し悪しの色 '+JSON.stringify(r.kind));
  ok(JSON.stringify(r.k2)==='[1,-1,0]','マスの良し悪しの分け方 '+JSON.stringify(r.k2));
  ok(r.txt==='🎲5・あと4マス・止まれるマス5か所（＋3・−1）','吹き出しの文 '+r.txt);
  ok(r.clear===0,'片づけ');
  ok(await p.evaluate(()=>{const i=SYS.findIndex(x=>x[0].includes('途中経過'));return i>=0&&/駒の上の吹き出し/.test(SYS[i][2])}),'システム説明');
  if(errs.length)fail.push('JSエラー '+errs.join(' / '));await c.close();
  }finally{await b.close()}
  if(fail.length){console.error('FAIL 途中経過（駒の上の吹き出し）\n'+fail.join('\n'));process.exitCode=1}else console.log('PASS 途中経過（駒の上の吹き出し・止まれるマスの良し悪し）')})();
