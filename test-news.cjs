// 新しい要素の案内（2026.11.05.13）：前に遊んだ人が新しい版を開いたとき、タイトルに1回だけ「✨ 新しい要素が増えました」。はじめての人・案内ずみの人には出さない（Playwright・Chromium）
const {chromium,devices}=require('playwright');const path=require('path'),assert=require('assert');
(async()=>{const b=await chromium.launch();let code=0;try{
  const open=async(init)=>{const c=await b.newContext({...devices['iPhone SE']});const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));await p.route(/firebase|gstatic|googleapis/,r=>r.abort());
    if(init)await p.addInitScript(init);await p.goto('file://'+path.resolve('index.html'));await p.waitForFunction(()=>!document.querySelector('#bCreate').disabled);await p.waitForTimeout(800);return{c,p,errs}};
  const shown=p=>p.evaluate(()=>!document.querySelector('#newsBox').hidden);
  // はじめての人：出さない（案内ずみにする）
  let {c,p,errs}=await open();assert.equal(await shown(p),false,'はじめての人に案内が出た');assert.equal(await p.evaluate(()=>localStorage.getItem('poco-news')),await p.evaluate(()=>NEWS_VER));await c.close();
  // 前に遊んだ人（名前あり・案内なし）：出る→見るでシステム説明の新要素→開き直すと出ない
  ({c,p,errs}=await open(()=>{if(!sessionStorage.getItem('x')){localStorage.setItem('poco-myname','よし');sessionStorage.setItem('x','1')}}));
  assert.equal(await shown(p),true,'前に遊んだ人に案内が出ない');
  const sz=await p.evaluate(()=>[...document.querySelectorAll('#newsBox button')].map(e=>{const r=e.getBoundingClientRect();return[r.width,r.height]}));assert(sz.every(([w,h])=>w>=48&&h>=48),'ボタンが小さい '+JSON.stringify(sz));
  assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'横にはみ出した');
  await p.click('#bNewsSee');await p.waitForTimeout(400);assert(await p.evaluate(()=>!document.querySelector('#ov').hidden&&document.querySelector('#ov').textContent.includes('新しい要素（')),'見るで新要素のページが開かない');assert.equal(await shown(p),false,'見たあとも案内が残った');
  await p.reload();await p.waitForFunction(()=>!document.querySelector('#bCreate').disabled);await p.waitForTimeout(800);assert.equal(await shown(p),false,'2回目にも案内が出た');assert.deepEqual(errs,[]);await c.close();
  // 前の版の案内を見た人：出る／とじるで消える
  ({c,p,errs}=await open(()=>{if(!sessionStorage.getItem('x')){localStorage.setItem('poco-rooms','[]');localStorage.setItem('poco-news','2026.10.01');sessionStorage.setItem('x','1')}}));
  assert.equal(await shown(p),true,'前の版の案内を見た人に出ない');await p.click('#bNewsClose');assert.equal(await shown(p),false,'とじるで消えない');await c.close();
  // 部屋に入ったら隠す
  ({c,p,errs}=await open(()=>{if(!sessionStorage.getItem('x')){localStorage.setItem('poco-myname','よし');sessionStorage.setItem('x','1')}}));await p.click('#bCreate');await p.waitForTimeout(500);assert.equal(await shown(p),false,'部屋に入っても案内が残った');await c.close();
  console.log('PASS 新しい要素の案内')}catch(e){console.error('NG',e.message);code=1}finally{await b.close();process.exit(code)}})();
