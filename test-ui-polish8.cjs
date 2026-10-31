// 見直し 第8弾（2026-10-31）の回帰テスト（Playwright・Chromium のスマホ表示エミュレーション）
// 1) イベントの帯の小見出しが「雨）」「＋10pt」のように切れない（イベント名より後ろの結果を出す）
// 2) 320・360pxでも順位の行にコアファン（💖）が出る。札の説明が新しいルール  3) ポコチャレの画面にコアファンと次のボーナス
// 4) お題が1文字だけ次の行に落ちない  5) 最終結果の上の文が「◯日間の対戦が終わりました」  6) コアファン倍増・3倍カードの説明にコアファンも
const {chromium}=require('playwright');const path=require('path'),fs=require('fs');
const fail=[];const ok=(c,m)=>{if(!c)fail.push(m)};
(async()=>{const src=fs.readFileSync('index.html','utf8');ok(/の対戦が終わりました<\/p><h3>最終結果/.test(src),'最終結果の上の文');ok(/ゴールドとコアファンが2倍/.test(src)&&/ゴールドとコアファンが3倍/.test(src),'倍増カードの説明');
  const b=await chromium.launch();try{for(const W of [320,360]){
  const c=await b.newContext({viewport:{width:W,height:740},isMobile:true,hasTouch:true});const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
  await p.route(/firebase|gstatic|googleapis/,r=>r.abort());await p.goto('file://'+path.resolve('index.html'));await p.waitForFunction(()=>!document.querySelector('#bCreate').disabled);
  await p.click('#bCreate');await p.waitForTimeout(300);await p.click('#bStart');await p.waitForTimeout(1500);
  const sub=await p.evaluate(()=>{const bad=[];let n=0;const base=curTip().state;for(const ty of ['yell','event','airport','port']){const ks=NODES.map((n,i)=>i).filter(i=>NODES[i].type===ty&&ADJ[i]&&ADJ[i].length);for(const k of ks.slice(0,6))for(let tr=0;tr<20;tr++){const st=JSON.parse(JSON.stringify(base)),seat=curSeat(st);st.players[seat].pos=ADJ[k][0];st.rng=tr*13+k;try{const s2=applyTurn(st,{type:'roll',route:[k],buy:false,reward:'coin',shopDone:true},meta.seed,{noForce:true});const mv=(s2.ev||[]).find(e=>e.k==='move'),e=(s2.ev||[]).find(e=>e.k==='event');if(!e)continue;n++;const x=evSub(nameize(mv.t),e.v);if(!x||/^[^（]*）|^[・…]/.test(x))bad.push(EVN[e.v]+'→'+x)}catch(e){}}}return {n,bad}});
  ok(sub.n>=10&&!sub.bad.length,W+'px 帯の小見出しが切れる '+JSON.stringify(sub).slice(0,200));
  const ye=await p.evaluate(()=>[...document.querySelectorAll('#status .pl-ye')].map(e=>getComputedStyle(e).display!=='none'&&/0:00の決算で0人に戻る/.test(e.title)));ok(ye.length===4&&ye.every(Boolean),W+'px 順位の行のコアファン '+ye);
  const wr=await p.evaluate(()=>[...document.querySelectorAll('#status .pl-l2')].every(l=>l.scrollWidth<=l.clientWidth+1));ok(wr,W+'px 順位の行がはみ出す');const one=await p.evaluate(()=>[...document.querySelectorAll('#status .pl-l2')].every(l=>new Set([...l.children].filter(e=>e.offsetParent).map(e=>Math.round(e.getBoundingClientRect().top))).size===1));ok(one,W+'px 順位の2行目が折り返す');
  await p.click('#bMis');await p.waitForTimeout(700);const mf=await p.evaluate(()=>{const f=document.querySelector('#ov .ms-fan');const t=[...document.querySelectorAll('#ov .ms-t>b')].map(bb=>{const r=document.createRange();r.selectNodeContents(bb);const L=[...r.getClientRects()].map(x=>x.width);return L.length<2||Math.min(...L)>=24});return {f:f&&f.textContent,t}});
  ok(/あと\d+人で\d+人ボーナス/.test(mf.f||''),W+'px ポコチャレの画面にコアファンがない');ok(mf.t.every(Boolean),W+'px お題が1文字だけ次の行に落ちる');
  if(errs.length)fail.push(W+'px JSエラー '+errs.join(' / '));await c.close()}
}finally{await b.close()}
  if(fail.length){console.error('FAIL 見直し 第8弾\n'+fail.join('\n'));process.exitCode=1}else console.log('PASS 見直し 第8弾（帯の小見出し・順位のコアファン・ポコチャレのコアファン・お題の折り返し・最終結果の文・倍増カードの説明）')})();
