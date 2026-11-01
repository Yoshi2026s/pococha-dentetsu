// 音のバランスのテスト（2026-11-01）：OfflineAudioContextで書き出して測る（Playwright・Chromium）
// 1) BGMの音量を下げると、残響・こだまも同じだけ下がる（以前は送りが音量を通らず、残響だけが残った）
// 2) 全15曲の聞こえる大きさ（スマホ相当＝180Hz以下を除いた音量6割＋全帯域4割）の差が4.5dB以内（以前は約12.6dB）
// 3) 曲バスの超低域カット・メロディの輪郭、効果音の低音の倍音づけがある
const {chromium}=require('playwright');const fs=require('fs'),path=require('path');
const fail=[];const ok=(c,m)=>{if(!c)fail.push(m)};
(async()=>{const src=fs.readFileSync('index.html','utf8');
  ok(/sub\.type='highpass';sub\.frequency\.value=38/.test(src)&&/pr\.frequency\.value=2600/.test(src),'曲バスの超低域カット・メロディの輪郭');
  ok(/lo\.frequency\.value=150;lo\.Q\.value=\.6;const sh=ac\.createWaveShaper\(\)/.test(src),'効果音の低音の倍音づけ');
  ok(/s\.connect\(out\._rv\|\|AU\.rev\)/.test(src)&&/for\(const n of \[AU\.duck,AU\.mRvD,AU\.mDlD\]\)/.test(src),'残響・こだまの送りが音量・ダッキングを通る');
  const b=await chromium.launch();const pg=await b.newPage();const errs=[];pg.on('pageerror',e=>errs.push(String(e)));await pg.route(/gstatic\.com/,r=>r.abort());
  await pg.addInitScript(()=>{window.__T=0;window.__DUR=8;window.AudioContext=function(){const c=new OfflineAudioContext(2,44100*window.__DUR,44100);Object.defineProperty(c,'currentTime',{get:()=>window.__T});Object.defineProperty(c,'state',{get:()=>'running'});c.resume=()=>Promise.resolve();c.suspend=()=>Promise.resolve();return c};window.webkitAudioContext=window.AudioContext});
  await pg.goto('file://'+path.resolve('index.html'));await pg.waitForTimeout(500);await pg.evaluate(()=>{window.__music=music;music=()=>{}});
  const run=(key,bgm,dur)=>pg.evaluate(async({key,bgm,dur})=>{window.__DUR=dur;window.__T=0;SET.fxq='rich';SET.bgm=bgm;SET.se=70;AU.ac=null;songKey=null;songGain=null;clearInterval(mTimer);NB=null;unlock();__music(key);clearInterval(mTimer);for(let T=0;T<dur-1;T+=.05){window.__T=T;sched()}
    const buf=await AU.ac.startRendering(),L=buf.getChannelData(0),R=buf.getChannelData(1),sr=44100,s0=sr*1.5|0;const M=new Float32Array(L.length-s0);for(let i=0;i<M.length;i++)M[i]=(L[i+s0]+R[i+s0])/2;
    const hp=(x,f)=>{const w=2*Math.PI*f/sr,c=Math.cos(w),s=Math.sin(w),al=s/(2*.707),b0=(1+c)/2,b1=-(1+c),a0=1+al,a1=-2*c,a2=1-al;const y=new Float32Array(x.length);let x1=0,x2=0,y1=0,y2=0;for(let i=0;i<x.length;i++){const v=(b0*x[i]+b1*x1+b0*x2-a1*y1-a2*y2)/a0;x2=x1;x1=x[i];y2=y1;y1=v;y[i]=v}return y};
    const db=x=>{let s=0;for(let i=0;i<x.length;i++)s+=x[i]*x[i];return 10*Math.log10(s/x.length+1e-12)};const all=db(M),ph=db(hp(hp(M,180),180));return{all,ph,mix:.6*ph+.4*all}},{key,bgm,dur});
  try{for(const k of ['wait','ending']){const a=await run(k,40,6),c=await run(k,10,6),d=a.all-c.all;ok(d>10.5&&d<13.5,`BGMを1/4にしたとき${k}が約12dB下がる（実際 ${d.toFixed(1)}dB）`)}
    const ks=await pg.evaluate(()=>Object.keys(SONGS));const m={};for(const k of ks)m[k]=+(await run(k,60,9)).mix.toFixed(1);const v=Object.values(m),sp=Math.max(...v)-Math.min(...v);
    ok(sp<=4.5,'曲ごとの聞こえる大きさの差 '+sp.toFixed(1)+'dB '+JSON.stringify(m));console.log('曲ごとの差',sp.toFixed(1)+'dB')}finally{await b.close()}
  if(errs.length)fail.push(...errs);
  if(fail.length){console.error('FAIL 音のバランス\n'+fail.join('\n'));process.exitCode=1}else console.log('PASS 音のバランス（残響・こだまが音量に連動・曲ごとの大きさの差・帯域の調整）')})();
