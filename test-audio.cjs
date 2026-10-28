// 音響テスト（第34版）：全BGM・全効果音をOfflineAudioContextで書き出し、無音・非数値・音割れ・発音数を検査する。
// 実行：node test-audio.cjs [書き出し先フォルダ]  ※Playwright（Chromium）が必要。結果は audio-test-results.json。
// 書き出し先を指定すると、試聴用のWAVを保存する。実機スピーカーでの聞こえ方は別途確認すること。
const {chromium}=require('playwright');const fs=require('fs'),path=require('path');
const OUT=process.argv[2]||null;if(OUT)fs.mkdirSync(OUT,{recursive:true});
(async()=>{const b=await chromium.launch();const pg=await b.newPage();const errs=[];pg.on('pageerror',e=>errs.push(String(e)));
  await pg.route(/gstatic\.com/,r=>r.abort());
  await pg.addInitScript(()=>{window.__T=0;window.__DUR=12;window.__MADE=0;window.AudioContext=function(){const c=new OfflineAudioContext(2,44100*window.__DUR,44100);Object.defineProperty(c,'currentTime',{get:()=>window.__T});Object.defineProperty(c,'state',{get:()=>'running'});c.resume=()=>Promise.resolve();c.suspend=()=>Promise.resolve();const o1=c.createOscillator.bind(c),o2=c.createBufferSource.bind(c);c.createOscillator=()=>{window.__MADE++;return o1()};c.createBufferSource=()=>{window.__MADE++;return o2()};return c};window.webkitAudioContext=window.AudioContext});
  await pg.goto('file://'+path.resolve('index.html'));await pg.waitForTimeout(500);await pg.evaluate(()=>{window.__music=music;music=()=>{}});
  const run=async(kind,key,dur,fxq)=>pg.evaluate(async({kind,key,dur,fxq})=>{window.__DUR=dur;window.__T=0;SET.fxq=fxq;SET.bgm=60;SET.se=80;AU.ac=null;songKey=null;songGain=null;clearInterval(mTimer);NB=null;unlock();window.__MADE=0;let made=0,maxStep=0;
    if(kind==='song'){__music(key);clearInterval(mTimer);for(let T=0;T<dur-1.2;T+=.05){window.__T=T;sched()}made=window.__MADE}
    else{window.__T=0;const dk=SE_DUCK[key];if(dk)duckTo(dk[0],dk[1]);SE[key](.02,3);made=window.__MADE}
    const buf=await AU.ac.startRendering();const L=buf.getChannelData(0),R=buf.getChannelData(1);let pk=0,ss=0,nan=0,clip=0;
    for(let i=0;i<L.length;i++){const a=L[i],c=R[i];if(!isFinite(a)||!isFinite(c)){nan++;continue}const m=Math.max(Math.abs(a),Math.abs(c));if(m>pk)pk=m;if(m>=.999)clip++;ss+=a*a+c*c}
    const rms=Math.sqrt(ss/(2*L.length));let wav=null;
    if(window.__SAVE){const n=L.length,bb=new ArrayBuffer(44+n*4),v=new DataView(bb),w=(o,s)=>{for(let i=0;i<s.length;i++)v.setUint8(o+i,s.charCodeAt(i))};w(0,'RIFF');v.setUint32(4,36+n*4,true);w(8,'WAVE');w(12,'fmt ');v.setUint32(16,16,true);v.setUint16(20,1,true);v.setUint16(22,2,true);v.setUint32(24,44100,true);v.setUint32(28,44100*4,true);v.setUint16(32,4,true);v.setUint16(34,16,true);w(36,'data');v.setUint32(40,n*4,true);
      for(let i=0;i<n;i++){v.setInt16(44+i*4,Math.max(-1,Math.min(1,L[i]||0))*32767,true);v.setInt16(46+i*4,Math.max(-1,Math.min(1,R[i]||0))*32767,true)}let s='';const u=new Uint8Array(bb);for(let i=0;i<u.length;i+=32768)s+=String.fromCharCode.apply(null,u.subarray(i,i+32768));wav=btoa(s)}
    return{peak:+pk.toFixed(3),rmsDb:+(20*Math.log10(rms+1e-9)).toFixed(1),nan,clip,nodesPerSec:kind==='song'?Math.round(made/(dur-1.2)):made,wav}},{kind,key,dur,fxq});
  await pg.evaluate(s=>window.__SAVE=s,!!OUT);
  const songs=await pg.evaluate(()=>Object.keys(SONGS)),ses=await pg.evaluate(()=>Object.keys(SE));const res={songs:{},se:{},lite:{},errors:[]};let fail=[];
  for(const k of songs){const r=await run('song',k,14,'rich');if(r.skip)continue;if(r.wav)fs.writeFileSync(path.join(OUT,'bgm-'+k+'.wav'),Buffer.from(r.wav,'base64'));delete r.wav;res.songs[k]=r;
    if(r.nan||r.peak<.05||r.peak>1.0001||r.rmsDb<-45)fail.push('BGM '+k+' '+JSON.stringify(r));
    const l=await run('song',k,8,'lite');delete l.wav;res.lite[k]=l;if(l.nan||l.peak<.05)fail.push('BGM(lite) '+k)}
  for(const k of ses){const d=k==='goalBig'?10:k==='goal'||k==='rarUR'?7:3;const r=await run('se',k,d,'rich');if(r.wav)fs.writeFileSync(path.join(OUT,'se-'+k+'.wav'),Buffer.from(r.wav,'base64'));delete r.wav;res.se[k]=r;
    if(r.nan||r.peak<.01||r.peak>1.0001)fail.push('SE '+k+' '+JSON.stringify(r))}
  res.errors=errs;if(errs.length)fail.push(...errs);await b.close();
  fs.writeFileSync('audio-test-results.json',JSON.stringify(res,null,1));
  console.table(Object.fromEntries(Object.entries(res.songs).map(([k,v])=>[k,{peak:v.peak,rmsDb:v.rmsDb,nodes_s:v.nodesPerSec,lite_nodes_s:res.lite[k].nodesPerSec}])));
  console.table(res.se);
  if(fail.length){console.error('FAIL\n'+fail.join('\n'));process.exitCode=1}else console.log(`PASS 音響 BGM${songs.length}曲・効果音${ses.length}種（非数値0・無音0・音割れ検査）`)})();
