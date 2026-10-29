// 止まったマスの結果カード（2026-10-29 見やすさ改善）：実際のゲーム計算の結果を表示して、内容と見た目の決まりを確かめる（jsdom）
const {JSDOM,VirtualConsole}=require('jsdom');const fs=require('fs'),assert=require('assert');
const errors=[],vc=new VirtualConsole();vc.on('jsdomError',e=>{if(!e.message.includes('Not implemented'))errors.push(e.message)});
const s=fs.readFileSync('index.html','utf8').replace(/<script[^>]+src=[^>]+><\/script>/g,'');
const dom=new JSDOM(s,{url:'https://example.test/',runScripts:'dangerously',pretendToBeVisual:true,virtualConsole:vc,beforeParse(w){w.matchMedia=()=>({matches:true,addEventListener(){},removeEventListener(){}});w.HTMLCanvasElement.prototype.getContext=()=>new Proxy({},{get:()=>()=>{}});w.SVGElement.prototype.getScreenCTM=()=>({a:1,b:0,c:0,d:1,e:0,f:0});w.SVGElement.prototype.getBBox=()=>({x:0,y:0,width:100,height:100});w.Element.prototype.animate=()=>({cancel(){},finished:Promise.resolve()});}});
const wait=ms=>new Promise(r=>setTimeout(r,ms));
setTimeout(async()=>{const w=dom.window,d=w.document;try{
  d.querySelector('#bCreate').click();await wait(150);d.querySelector('#bStart').click();await wait(400);
  // 種類ごとにマスへ1歩で止まる手番を作り、結果カードの情報を返す
  w.eval(`window.land=(ty,buy,hour,weather)=>{const base=curTip().state;const k=NODES.findIndex((n,i)=>n.type===ty&&ADJ[i]&&ADJ[i].length);for(let tr=0;tr<20;tr++){const st=JSON.parse(JSON.stringify(base)),seat=curSeat(st);st.players[seat].pos=ADJ[k][0];st.rng=tr*7;st.hour=hour;st.weather=weather;
    try{const s2=applyTurn(st,{type:'roll',route:[k],buy,reward:'coin',shopDone:true},meta.seed,{noForce:true});if(s2.players[seat].pos!==k)continue;const mv=(s2.ev||[]).find(e=>e.k==='move');const r=resultInfo(s2,st,seat,mv?mv.t:'',NODES[k]);return {r,html:resultHTML(r)}}catch(e){}}return null}`);
  // プラスマス：増減を大きく1つ・倍率の行（ゴールデン×晴れ）・文章に倍率の（）を残さない
  const plus=w.eval("land('plus',false,20,0)");assert(plus,'プラスマスに止まれない');
  assert.equal(plus.r.main[0],'応援');assert(plus.r.mult&&plus.r.mult.tz==='ゴールデン'&&plus.r.mult.a===w.eval('PLUSM.tz[2]')&&plus.r.mult.b===w.eval('PLUSM.wx[0]'),'倍率の行');
  assert(!/ゴールデン／/.test(plus.html)&&plus.html.includes('rc-mult')&&plus.html.includes('has-main'),'倍率の（）が文章に残っている');
  // エールマス：主な結果はエール
  const yell=w.eval("land('yell',false,2,3)");assert.equal(yell.r.main[0],'エール');assert.equal(yell.r.mult.tz,'深夜');
  // 駅でコアファン獲得：減りは「支払い」・獲得の行は1行にまとまる・駅の状況は補足に
  const st=w.eval("land('station',[0],18,0)");assert(st,'駅で獲得できない');
  assert(st.r.pills.some(p=>p[0]==='支払い'&&p[2]==='pay'),'獲得の支払いが「応援−」（損）に見える');assert(!st.r.pills.some(p=>p[0]==='応援'),'支払いと応援が両方出ている');
  assert(st.r.lines.some(x=>x.startsWith('コアファン獲得：')),'獲得の行がまとまっていない：'+st.r.lines);assert(st.r.note.includes('この駅'),'駅の状況の補足');
  // カードマス：カードの枚数の丸
  const card=w.eval("land('card',false,12,1)");assert(card.r.pills.some(p=>p[0]==='カード'),'カードの丸');
  // ランクの丸は class "rk"（右上に固定される別スタイル）を使わない
  const html=[plus,yell,st,card].map(x=>x.html).join('');assert(!/rc-pill rk[" ]/.test(html),'ランクの丸がrkクラス');
  const rkCase=w.eval(`(()=>{const r={title:'テスト',kind:'イベント',lines:[],pills:[['ランク','＋5pt','rkp']],c:'red',icon:'x'};return resultHTML(r)})()`);assert(rkCase.includes('rc-pill rkp'));
  if(errors.length)throw Error(errors.join('\n'));
  console.log('PASS 結果カード（増減の大きな表示・倍率の行・支払い表示・獲得の1行・カードの丸・ランクの丸の位置）');dom.window.close();
}catch(e){console.error(e);dom.window.close();process.exitCode=1;}},100);
