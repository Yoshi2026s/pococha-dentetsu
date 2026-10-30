// 自分の名前を覚える（2026-10-30）：前回の名前を端末に覚え、次の部屋で席に座ったときに自動で入れる。変更・消去もできる（jsdom・端末内モード）
const {JSDOM,VirtualConsole}=require('jsdom');const fs=require('fs'),assert=require('assert');
const errors=[],vc=new VirtualConsole();vc.on('jsdomError',e=>{if(!e.message.includes('Not implemented'))errors.push(e.message)});
const s=fs.readFileSync('index.html','utf8').replace(/<script[^>]+src=[^>]+><\/script>/g,'');
const dom=new JSDOM(s,{url:'https://example.test/',runScripts:'dangerously',pretendToBeVisual:true,virtualConsole:vc,beforeParse(w){w.matchMedia=()=>({matches:true,addEventListener(){},removeEventListener(){}});w.HTMLCanvasElement.prototype.getContext=()=>new Proxy({},{get:()=>()=>{}});w.SVGElement.prototype.getScreenCTM=()=>({a:1,b:0,c:0,d:1,e:0,f:0});w.SVGElement.prototype.getBBox=()=>({x:0,y:0,width:100,height:100});w.Element.prototype.animate=()=>({cancel(){},finished:Promise.resolve()});}});
const wait=ms=>new Promise(r=>setTimeout(r,ms));
setTimeout(async()=>{const w=dom.window,d=w.document,E=c=>w.eval(c);try{
  const LS=w.localStorage;
  // 1) 覚えた名前がない：自動では入らず、従来どおり「あなた」
  LS.removeItem('poco-myname');d.querySelector('#bCreate').click();await wait(300);
  assert.equal(E('seatName(mySeat())'),'あなた','覚えた名前がないのに名前が入った');assert.equal(d.querySelector('#iMyName').value,'','入力欄が空でない');
  // 2) 名前を変えると端末に覚える
  d.querySelector('#iMyName').value='よしゆき';d.querySelector('#bMyName').click();await wait(200);
  assert.equal(LS.getItem('poco-myname'),'よしゆき','名前を覚えていない');assert.equal(E('seatName(mySeat())'),'よしゆき');
  // 3) 次の部屋：席に座ると覚えた名前が自動で入り、入力欄にも入っている
  const c1=E('code');d.querySelector('#bLeaveRoom').click();await wait(300);{const ok=d.querySelector('#ov:not([hidden]) #cfOk');if(ok){ok.click();await wait(300)}}
  assert(!d.querySelector('#vLobby').hidden,'部屋から退出できない');d.querySelector('#bCreate').click();await wait(400);assert.notEqual(E('code'),c1,'新しい部屋になっていない');
  assert.equal(E('seatName(mySeat())'),'よしゆき','次の部屋で前回の名前が入っていない：'+E('seatName(mySeat())'));
  assert.equal(d.querySelector('#iMyName').value,'よしゆき','入力欄に前回の名前が入っていない');
  // 4) 変更すると覚えた名前も変わる
  d.querySelector('#iMyName').value='ポコ太郎';d.querySelector('#bMyName').click();await wait(200);
  assert.equal(LS.getItem('poco-myname'),'ポコ太郎','変更後の名前を覚えていない');assert.equal(E('seatName(mySeat())'),'ポコ太郎');
  // 5) 空にすると覚えた名前も消え、「あなた」に戻る（同じ部屋で自動で入れ直さない）
  d.querySelector('#iMyName').value='';d.querySelector('#bMyName').click();await wait(300);
  assert.equal(LS.getItem('poco-myname'),null,'空にしても覚えた名前が残っている');assert.equal(E('seatName(mySeat())'),'あなた','空にしたのに名前が戻った');
  // 6) 端末に保存された値に記号が混ざっていても、そのまま表示に使わない
  LS.setItem('poco-myname','<b>悪い名前</b>');assert.equal(E('savedName()'),'b悪い名前/b');
  if(errors.length)throw Error(errors.join('\n'));
  console.log('PASS 自分の名前を覚える（覚える・次の部屋で自動で入る・入力欄に入る・変更で更新・空で消える）');dom.window.close();
}catch(e){console.error(e);dom.window.close();process.exitCode=1;}},100);
