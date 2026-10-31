// 実時間の音響テスト（第34版）：本物のAudioContextで端末内モードの対戦を自動操作し、
// 例外・同時発音数・発音ノードの解放（リーク）・曲の切替・効果音の呼出しを確認する。※Playwright（Chromium）が必要。
// 実行：node test-audio-live.cjs [秒数]　結果は audio-live-results.json。実機スピーカーでの聞こえ方は対象外。
const {chromium}=require('playwright');const fs=require('fs'),path=require('path');const SEC=+(process.argv[2]||90);
(async()=>{const b=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});const pg=await b.newPage({viewport:{width:390,height:844}});const errs=[];
  pg.on('pageerror',e=>errs.push(String(e)));
  const html=fs.readFileSync('index.html','utf8').replace(/<script[^>]+src=[^>]+><\/script>/g,'');// 通信ライブラリなし＝端末内モード
  await pg.route('http://local.test/',r=>r.fulfill({contentType:'text/html',body:html}));await pg.route(/^https?:\/\/(?!local\.test)/,r=>r.abort());
  await pg.goto('http://local.test/');await pg.waitForTimeout(400);
  await pg.evaluate(()=>{window.__se={};window.__songs={};window.__err=[];for(const k of Object.keys(SE)){const f=SE[k];SE[k]=(...a)=>{__se[k]=(__se[k]||0)+1;try{return f(...a)}catch(e){__err.push(k+': '+e.message);throw e}}}
    const om=music;music=k=>{if(k)__songs[k]=(__songs[k]||0)+1;return om(k)};window.__max=0;setInterval(()=>{const l=liveNow();if(l>__max)__max=l},50)});
  await pg.click('#bCreate');await pg.waitForTimeout(400);await pg.click('#bStart');await pg.waitForTimeout(600);
  const t0=Date.now();const ids=['#acOk','#bRoll','#bAuto','#bNext','#bSkip','#bShopSkip','#bShopOk','#bRwCoin','#bResume','#ov button'];
  while(Date.now()-t0<SEC*1000){for(const id of ids){const el=await pg.$(id);if(el&&await el.isVisible()&&await el.isEnabled()){await el.click({timeout:500}).catch(()=>{});break}}await pg.waitForTimeout(350)}
  await pg.screenshot({path:'/tmp/claude-0/-home-claude/d91ebb90-70fe-5f0d-8a0b-06398c602665/scratchpad/live.png'}).catch(()=>{});
  // 全効果音と全曲を実時間で次々に鳴らす（切替が重なっても例外・ノード残りが出ないこと）
  await pg.evaluate(async()=>{const ks=Object.keys(SONGS),se=Object.keys(SE).filter(k=>!/^goal/.test(k));for(let i=0;i<se.length;i++){music(ks[i%ks.length]);sfx(se[i],i);await new Promise(r=>setTimeout(r,450))}});
  const mid=await pg.evaluate(()=>({state:AU.ac&&AU.ac.state,max:__max,live:liveNow(),se:__se,songs:__songs,err:__err}));
  await pg.evaluate(()=>{SET.bgm=0;music(null);SET.se=0});await pg.waitForTimeout(4000);const after=await pg.evaluate(()=>liveNow());
  // 演出の量「控えめ」でも動くこと
  await pg.evaluate(()=>{SET.se=70;SET.bgm=40;SET.fxq='lite';sfx('goalBig');music('pop')});await pg.waitForTimeout(3000);const lite=await pg.evaluate(()=>({live:liveNow(),max:__max}));
  await b.close();const res={seconds:SEC,audioState:mid.state,maxLiveNodes:mid.max,liveAfterStop:after,liteLive:lite.live,seCalls:mid.se,songs:mid.songs,seErrors:mid.err,pageErrors:errs};
  fs.writeFileSync('audio-live-results.json',JSON.stringify(res,null,1));console.log(JSON.stringify(res,null,1));
  const fail=[];if(mid.state!=='running')fail.push('AudioContextが動作していない');if(errs.length||mid.err.length)fail.push('例外あり');if(after>12)fail.push('停止後も発音ノードが残る '+after);if(!Object.keys(mid.se).length)fail.push('効果音が呼ばれていない');
  if(fail.length){console.error('FAIL '+fail.join(' / '));process.exitCode=1}else console.log(`PASS 実時間音響 ${SEC}秒（例外0・最大同時ノード${mid.max}・停止後${after}）`)})();
