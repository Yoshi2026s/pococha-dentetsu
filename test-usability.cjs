// 遊びやすさ点検（2026-10-29）の回帰テスト（jsdom・端末内モード）
// 1) 端末内モードの自分の番は時間切れの代行がないので「残り◯秒」を出さない（以前は60秒のまま止まって見えた）
// 2) 増減の吹き出し（chipdelta）は演出カード（#ov）より下に表示する
// 3) メニューボタンは高さ44px以上の指定
// 4) 物件の選択ボタン：「1日＋◯G」を独立した行に。買えない物件は「ゴールド不足」で薄く（狭い画面でも1行に収まる短い言葉）
const {JSDOM,VirtualConsole}=require('jsdom');const fs=require('fs'),assert=require('assert');
const errors=[],vc=new VirtualConsole();vc.on('jsdomError',e=>{if(!e.message.includes('Not implemented'))errors.push(e.message)});
const html=fs.readFileSync('index.html','utf8'),s=html.replace(/<script[^>]+src=[^>]+><\/script>/g,'');
const dom=new JSDOM(s,{url:'https://example.test/',runScripts:'dangerously',pretendToBeVisual:true,virtualConsole:vc,beforeParse(w){w.matchMedia=()=>({matches:true,addEventListener(){},removeEventListener(){}});w.HTMLCanvasElement.prototype.getContext=()=>new Proxy({},{get:()=>()=>{}});w.SVGElement.prototype.getScreenCTM=()=>({a:1,b:0,c:0,d:1,e:0,f:0});w.SVGElement.prototype.getBBox=()=>({x:0,y:0,width:100,height:100});w.Element.prototype.animate=()=>({cancel(){},finished:Promise.resolve()});}});
const wait=ms=>new Promise(r=>setTimeout(r,ms));
setTimeout(async()=>{const w=dom.window,d=w.document,E=c=>w.eval(c);try{
  d.querySelector('#bCreate').click();await wait(150);d.querySelector('#bStart').click();await wait(400);
  // 1) 自分の番にして描画
  E(`(()=>{const t=curTip();t.state.order=[mySeat(),...[0,1,2,3].filter(i=>i!==mySeat())];t.state.oi=0;dispState=t.state;render()})()`);
  const tt=d.querySelector('#turnText').textContent;assert(tt.includes('あなたの番'),'自分の番の表示：'+tt);assert(!/残.*秒/.test(tt.replace(/⁠/g,'')),'端末内モードの自分の番に残り秒数が出ている：'+tt);
  // 2)・3) CSSの指定
  const z=html.match(/\.chipdelta\{position:fixed;z-index:(\d+)/),zo=html.match(/\.overlay\{position:fixed;inset:0;z-index:(\d+)/);assert(+z[1]<+zo[1],'増減の吹き出しが演出カードより上');
  assert(/\.menubtn\{min-height:44px!important/.test(html),'メニューボタンの高さ');
  // 4) 物件獲得の画面（ゴールドを少なくして、買えない物件を作る）
  const ok=E(`(()=>{const st=JSON.parse(JSON.stringify(curTip().state)),seat=curSeat(st),k=NODES.findIndex((n,i)=>n.type==='station'&&n.bases&&n.bases.length>=3&&ADJ[i]&&ADJ[i].length);
    st.players[seat].pos=ADJ[k][0];st.players[seat].coin=Math.min(...NODES[k].bases.map(b=>b.price))+10;
    const coin=Math.min(...NODES[k].bases.map(b=>b.price))+10;pending={st,res:()=>{},stage:'buy',base:{type:'roll'},sel:new Set(),pv:{pos:k,nd:NODES[k],own:NODES[k].bases.map(()=>null),coin,seat,hand:[]}};drawBaseList();return true})()`);
  assert(ok,'駅に止まる手番を作れない');
  const btns=[...d.querySelectorAll('#baseList .fanbtn')];assert(btns.length>=3);
  assert(btns.every(b=>/^1日＋[\d,]+G$/.test(b.querySelector('.fb-d').textContent)),'「1日＋◯」が独立していない');
  assert(btns.some(b=>b.classList.contains('short')&&b.textContent.includes('ゴールド不足')),'買えないファンが分からない');
  assert(!btns.some(b=>b.textContent.includes('タップで選ぶ')),'各ボタンに「タップで選ぶ」が残っている');
  btns.find(b=>!b.classList.contains('short')).click();await wait(50);assert(d.querySelector('#baseList .fanbtn.on .fb-s').textContent.includes('獲得する'),'選んだファンの表示');
  if(errors.length)throw Error(errors.join('\n'));
  console.log('PASS 遊びやすさ点検4項目（端末内の残り秒数・吹き出しの重なり・メニューの大きさ・ファン選択の表示）');dom.window.close();
}catch(e){console.error(e);dom.window.close();process.exitCode=1;}},100);
