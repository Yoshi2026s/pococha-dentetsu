// カードまわりの総点検（2026-11-02・jsdom・端末内モード）
// 1) 全カード：いろいろな場面で使っても落ちない・「使った」記録が残る（使えない場面は理由が出る）
// 2) 廃止したカード（帰宅・ターボ・お祓い・嵐を呼ぶ・手札シャッフル）：山札・ショップに出ない。手札に残った分は使える
// 3) 値段：全カードに値段がある・500〜15,000G・カードパックは引いたカードを売るより高い
// 4) 強化した効果：空港・拠点・ラッキーワープの行き先、クーポン2枚、ゴールド回復、晴れ乞い、評価ダウン
// 5) ショップ：買えるカードだけ出る・地域限定が先頭にまとまり印が付く・買ったカードの枚数が残る
// 6) カード一覧：レア度の枠・ジャンルのマーク・レア度の高い順
// 7) CPU同士で何十試合か回して、カードの使用でエラーが出ない・どのカードも使われる
const {JSDOM,VirtualConsole}=require('jsdom');const fs=require('fs'),assert=require('assert');
const errors=[],vc=new VirtualConsole();vc.on('jsdomError',e=>{if(!e.message.includes('Not implemented'))errors.push(e.message)});
const html=fs.readFileSync('index.html','utf8'),s=html.replace(/<script[^>]+src=[^>]+><\/script>/g,'');
const dom=new JSDOM(s,{url:'https://example.test/',runScripts:'dangerously',pretendToBeVisual:true,virtualConsole:vc,beforeParse(w){w.matchMedia=()=>({matches:true,addEventListener(){},removeEventListener(){}});w.HTMLCanvasElement.prototype.getContext=()=>new Proxy({},{get:()=>()=>{}});w.SVGElement.prototype.getScreenCTM=()=>({a:1,b:0,c:0,d:1,e:0,f:0});w.SVGElement.prototype.getBBox=()=>({x:0,y:0,width:100,height:100});w.Element.prototype.animate=()=>({cancel(){},finished:Promise.resolve()});}});
const wait=ms=>new Promise(r=>setTimeout(r,ms));let fails=0;const ok=(c,m)=>{if(!c){fails++;console.log('NG',m)}};
setTimeout(async()=>{const w=dom.window,d=w.document,E=x=>w.eval(x);try{
  const REMOVED=['home','turbo','antitroll','storm','shuffle'];
  // 2) 廃止したカード
  const keys=E('CARDDEF.map(x=>x[0])');
  REMOVED.forEach(k=>{ok(!keys.includes(k),'廃止カードが残っている '+k);ok(E(`!!LEGACY.${k}&&!!CARDN.${k}`),'旧カードの名前がない '+k);ok(!E('CARDW').some(x=>x[0]===k),'山札に廃止カード '+k)});
  ok(E(`NODES.map((n,i)=>i).filter(i=>NODES[i].type==='shop').every(i=>shopCards(i).every(k=>!LEGACY[k]))`),'ショップに旧カード');
  ok(E(`CARDG.home==='移動'&&CARDG.antitroll==='防御'&&CARDG.storm==='策略'&&CARDG.turbo==='進行'`),'旧カードのジャンル');
  // 3) 値段
  const P=E('JSON.stringify(SHOPP)');const SP=JSON.parse(P);
  keys.forEach(k=>{ok(E(`CARDP.${k}`)>0,'値段表にない '+k);ok(SP[k]>=500&&SP[k]<=15000,'値段の範囲 '+k+' '+SP[k])});
  ok(Object.keys(E('JSON.parse(JSON.stringify(CARDP))')).every(k=>keys.includes(k)),'値段表に存在しないカード');
  const exp=E(`(()=>{const f=L=>{const t=L.reduce((a,x)=>a+x[1],0);return L.reduce((a,[k,w])=>a+w*SELLP(k),0)/t};return{all:f(CARDW),prog:f(CARDW.filter(([k])=>CARDG[k]==='進行')),rare:f(CARDW.filter(([k])=>['SR','SSR','UR'].includes(CARDR[k])))}})()`);
  ok(SP.draw1>exp.all&&SP.draw2>exp.all*2&&SP.draw3>exp.all*3&&SP.progpack>exp.prog*2&&SP.raredraw>exp.rare,'カードパックを買って売ると得になる '+JSON.stringify(exp));
  ok(Object.values(SP).filter(v=>v<1000).length>=5,'1,000G未満のカードが少ない');
  // 1) 全カードを、いろいろな場面で使う
  const r1=E(`(()=>{const out={err:[],used:{},blocked:{}};const ALL=[...CARDDEF.map(x=>x[0]),...${JSON.stringify(REMOVED)}];
    for(let g=0;g<24;g++){const seed='CARD'+g;let st=genesisState(seed,3);const R=n=>rand(seed+'x',n);
      st.goal=st.goal==null?SIDX[ST[5][0]]:st.goal;
      st.players.forEach((p,i)=>{p.pos=Math.floor(R(i)*ST.length);p.coin=[30000,-2000,800,5000][(g+i)%4];p.hand=[];p.shield=g%3===0?1:0;p.slow=g%5===0?1:0});
      st.troll=g%2?st.order[0]:null;st.weather=g%4;
      for(let i=0;i<ST.length;i+=7){st.owner[i]=NODES[i].bases.map((_,j)=>(i+j+g)%3===0?st.order[0]:null)}
      for(const k of ALL){if(k==='block')continue;const s0=JSON.parse(JSON.stringify(st)),seat=s0.order[s0.oi],p=s0.players[seat];p.hand=[k,'local','block'];if(g%2)s0.players[(seat+1)%4].hand=['express','guard','sunny'];
        const why=cardBlocked(s0,seat,k);if(why){out.blocked[k]=(out.blocked[k]||0)+1;continue}
        const a=cardAct(k,1+g%6);let s1;try{s1=applyTurn(s0,a,seed+k,{noForce:true})}catch(e){out.err.push(k+':'+e.message);continue}
        const ce=(s1.ev||[]).find(e=>e.k==='card');if(!ce||ce.v!==k){out.err.push(k+':記録なし');continue}
        if(!Number.isFinite(s1.players[seat].coin)||s1.players.some(q=>!Number.isFinite(q.coin)||q.hand.length>HANDMAX))out.err.push(k+':値がおかしい');
        out.used[k]=(out.used[k]||0)+1}}
    return out})()`);
  ok(!r1.err.length,'カードを使うとエラー：'+r1.err.slice(0,8).join(' / '));
  const never=[...keys,...REMOVED].filter(k=>k!=='block'&&!r1.used[k]);ok(!never.length,'一度も使えなかったカード：'+never.join(','));
  // 使えない場面の理由
  ok(E(`(()=>{const st=genesisState('B',3);st.weather=0;return cardBlocked(st,0,'sunny')})()`)==='もう晴れています','晴れのときの晴れ乞い');
  ok(E(`(()=>{const st=genesisState('B',3);st.players.forEach(p=>p.pos=3);st.goal=SIDX[ST[9][0]];return cardBlocked(st,0,'swap')})()`)==='同じ場所にいます','同じ場所のいれかえ');
  // 4) 強化した効果
  const r4=E(`(()=>{const o={};const st=genesisState('W',3);st.goal=SIDX[ST[40][0]];const seat=st.order[st.oi],p=st.players[seat];const dg=D(st.goal);
    const air=[...AIRPORTS].map(id=>SIDX[id]).filter(i=>i!==p.pos&&i!==st.goal).sort((a,b)=>dg[a]-dg[b]||a-b).slice(0,2);
    p.hand=['airwarp'];o.air=air.includes(applyTurn(st,{type:'airwarp'},'W1').players[seat].pos);
    const plus=NODES.map((n,i)=>n.type==='plus'&&i!==p.pos?i:-1).filter(i=>i>=0).sort((a,b)=>dg[a]-dg[b]||a-b).slice(0,8);
    p.hand=['luckywarp'];o.lucky=plus.includes(applyTurn(st,{type:'luckywarp'},'W2').players[seat].pos);
    const s2=JSON.parse(JSON.stringify(st));const mine=[5,60,120].filter(i=>i!==s2.goal&&i!==p.pos);mine.forEach(i=>s2.owner[i]=NODES[i].bases.map((_,j)=>j?null:seat));s2.players[seat].hand=['ownwarp'];
    const best=mine.slice().sort((a,b)=>dg[a]-dg[b]||a-b)[0];o.own=applyTurn(s2,{type:'ownwarp'},'W3').players[seat].pos===best;
    p.hand=['coupon'];o.coupon=applyTurn(st,{type:'roll',card:'coupon'},'W4').players[seat].coupon===2;
    const B=BASEPT[p.rank];p.hand=['recover'];p.coin=-3000;o.rec1=applyTurn(st,{type:'roll',card:'recover'},'W5').players[seat].coin>=B;
    p.coin=1000;const c2=applyTurn(st,{type:'roll',card:'recover'},'W6').players[seat].coin;o.rec2=c2>=1000+B*2;
    p.hand=['sunny'];st.weather=3;const s3=applyTurn(st,{type:'roll',card:'sunny'},'W7');o.sunny=s3.weather===0&&s3.players[seat].ye>p.ye;
    st.players.forEach((q,i)=>{q.pt=100;q.hand=[]});p.hand=['rankdown'];st.players[(seat+1)%4].coin=999999;const s4=applyTurn(st,{type:'roll',card:'rankdown'},'W8');o.rd=(s4.ev||[]).some(e=>/−25pt/.test(e.t));
    return o})()`);
  Object.entries(r4).forEach(([k,v])=>ok(v,'強化した効果 '+k));
  // 5) ショップ
  d.querySelector('#bCreate').click();await wait(150);d.querySelector('#bStart').click();await wait(500);
  if(d.querySelector('#vGame').hidden)throw Error('ゲーム開始失敗');
  for(let t=0;t<40&&!E('!!pending');t++)await wait(100);
  const shop=coin=>E(`(()=>{const seat=curSeat(pending.st);const ks=NODES.map((n,i)=>n.type==='shop'?i:-1).filter(i=>i>=0);const k=ks.find(i=>shopCards(i).some(c=>!SHOP_ALL(c)))??ks[0];
    pending.stage='shop';pending.pv={pos:k,nd:NODES[k],coin:${coin},hand:['express'],coupon:0,seat,canShop:true};pending.base={type:'roll'};pending.shopOps=[];drawShop();
    const L=document.querySelector('#shopList'),bs=[...L.querySelectorAll('.shopbtn')];
    return{n:bs.length,avail:shopCards(k).length,afford:shopCards(k).filter(c=>SHOPP[c]<=${coin}).length,dis:bs.filter(b=>b.disabled).length,first:(L.querySelector('.cg-h.lim-h')||{}).textContent||'',
      firstBtnLocal:!!(L.querySelector('.cg-h.lim-h+.shopbtn.local')),locBadge:bs.filter(b=>b.classList.contains('local')).every(b=>b.querySelector('.lim')),locCount:bs.filter(b=>b.classList.contains('local')).length,
      locAvail:shopCards(k).filter(c=>!SHOP_ALL(c)&&SHOPP[c]<=${coin}).length,rr:bs.every(b=>/rr-(N|R|SR|SSR|UR)/.test(b.className)),none:(L.querySelector('.shop-none')||{}).textContent||''}})()`);
  const s1=shop(100000);ok(s1.n===s1.avail&&s1.dis===0,'お金が十分なら全部出る '+JSON.stringify(s1));ok(s1.locCount>0&&s1.firstBtnLocal&&/地域限定/.test(s1.first)&&s1.locBadge,'地域限定が先頭・印 '+JSON.stringify(s1));ok(s1.rr,'ショップのレア度の枠');
  const s2=shop(2500);ok(s2.n===s2.afford&&s2.dis===0&&s2.n<s2.avail,'買えるカードだけ出る '+JSON.stringify(s2));ok(/表示していません/.test(s2.none),'隠した数の案内');
  const s3=shop(100);ok(s3.n===0&&/買えるカードはありません/.test(s3.none),'買えるカードがないときの案内 '+JSON.stringify(s3));
  // 買ったあとゴールドが足りなくなっても、買ったカードは枚数つきで残る
  const s4=E(`(()=>{pending.pv.coin=600;pending.shopOps=[];drawShop();const b=[...document.querySelectorAll('#shopList .shopbtn')].find(x=>SHOPP[x.dataset.k]<=600);if(!b)return'none';b.click();const k=b.dataset.k;const nb=document.querySelector('#shopList .shopbtn[data-k="'+k+'"]');return nb&&nb.classList.contains('on')&&/買った×1/.test(nb.textContent)?'ok':'lost'})()`);
  ok(s4==='ok','買ったカードが一覧から消える '+s4);
  E(`pending.stage=null;pending.shopOps=null`);
  // 6) カード一覧
  const cs=E(`(()=>{pending.st.players[curSeat(pending.st)].hand=['local','linear','express','goalnear','warp','home','sunny'];document.querySelector('#bCard').click();
    const bs=[...document.querySelectorAll('#ov .cardbtn')];const r={n:bs.length,rr:bs.every(b=>/rr-/.test(b.className)&&b.querySelector('.cg-ic')),prog:bs.filter(b=>b.classList.contains('cg-進行')).map(b=>b.dataset.k),old:(bs.find(b=>b.dataset.k==='home')||{}).className||''};
    const o=document.querySelector('#ov');o.hidden=true;o.innerHTML='';return r})()`);
  ok(cs.n===7&&cs.rr,'カード一覧の枠とマーク '+JSON.stringify(cs));ok(cs.prog.join()==='linear,express,local','レア度の高い順 '+cs.prog);ok(/cg-移動/.test(cs.old)&&/rr-N/.test(cs.old),'旧カードのジャンル表示 '+cs.old);
  ok(E(`CG_SE.length===GENRES.length&&CG_SE.every(k=>typeof SE[k]==='function')`),'ジャンルの効果音');
  // 7) CPU同士の対戦
  const r7=await E(`(async()=>{const use={},errs=[];for(let g=0;g<30;g++){const seed='CPU'+g;meta.seed=seed;meta.cpu=[0,1,2,3];meta.cpuLv=['normal','strong','weak'][g%3];let st=genesisState(seed,3);
      for(let t=0;t<400&&!st.finished;t++){const a=await cpuDecide(st);let s1;try{s1=applyTurn(st,a,seed)}catch(e){errs.push((a.card||a.type)+':'+e.message);break}const ce=(s1.ev||[]).find(e=>e.k==='card');if(ce)use[ce.v]=(use[ce.v]||0)+1;st=s1}}
    return{use,errs}})()`);
  ok(!r7.errs.length,'CPUのカード使用でエラー：'+r7.errs.slice(0,5).join(' / '));
  const unused=keys.filter(k=>k!=='block'&&!r7.use[k]);ok(unused.length<=3,'CPUが使わないカード：'+unused.join(','));
  ok(!errors.length,'ページのエラー：'+errors.slice(0,3).join(' / '));
}catch(e){fails++;console.log('NG 例外',e.stack)}
console.log(fails?`カード総点検：${fails}件NG`:'カード総点検：すべてOK');process.exit(fails?1:0)},1500);
