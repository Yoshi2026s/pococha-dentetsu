// 時間帯・天気の小窓とBGMの選び方（2026-10-31）の回帰テスト（jsdom・端末内モード）
// 1) 時間帯・天気の演出は左上の小窓だけ：地図全体に重ねる要素（色の層・空の帯・夜の暗幕・夜の光）がない
// 2) 時刻を変えても地図の枠に時間帯・天気の印が付かない。小窓の札に時刻・決算まで・天気・倍率が出る
// 3) BGM：ふだんはPOP（4曲を順に交代＝@pop）、目的地まであと少し・終盤・お邪魔・空路・海路のときだけ場面の曲
// 4) 曲データ：全曲の各部分が1小節8コマの倍数で和音の数と合う、音量係数がそろっている、POP4曲が交代用の設定、続きの位置が部分の頭
const {JSDOM,VirtualConsole}=require('jsdom');const fs=require('fs'),assert=require('assert');
const errors=[],vc=new VirtualConsole();vc.on('jsdomError',e=>{if(!e.message.includes('Not implemented'))errors.push(e.message)});
const html=fs.readFileSync('index.html','utf8'),s=html.replace(/<script[^>]+src=[^>]+><\/script>/g,'');
const dom=new JSDOM(s,{url:'https://example.test/',runScripts:'dangerously',pretendToBeVisual:true,virtualConsole:vc,beforeParse(w){w.matchMedia=()=>({matches:true,addEventListener(){},removeEventListener(){}});w.HTMLCanvasElement.prototype.getContext=()=>new Proxy({},{get:()=>()=>{}});w.SVGElement.prototype.getScreenCTM=()=>({a:1,b:0,c:0,d:1,e:0,f:0});w.SVGElement.prototype.getBBox=()=>({x:0,y:0,width:100,height:100});w.Element.prototype.animate=()=>({cancel(){},finished:Promise.resolve()});}});
const wait=ms=>new Promise(r=>setTimeout(r,ms));
setTimeout(async()=>{const w=dom.window,d=w.document,E=c=>w.eval(c);try{
  d.querySelector('#bCreate').click();await wait(150);d.querySelector('#bStart').click();await wait(400);
  // 1) 地図全体に重ねる要素がない
  for(const q of ['.atmo','#sky','#nightLayer','#glows'])assert(!d.querySelector(q),'地図全体に重ねる演出が残っている：'+q);
  assert(!/\.atmo\{|data-tp=|\.isnight/.test(html),'地図全体の時間帯・天気のCSSが残っている');
  const cv=d.querySelector('#skyLabel #wxWin');assert(cv&&cv.tagName==='CANVAS','時間帯・天気の小窓がない');
  // 2) 時刻と天気を変えて描画
  const lab=E(`(()=>{const out=[];for(const [h,wx] of [[7,0],[13,1],[21,2],[2,3]]){dispState.hour=h;dispState.weather=wx;render();const m=document.querySelector('#mapbox');out.push({tp:m.dataset.tp||'',wx:m.dataset.wx||'',cls:m.className,txt:document.querySelector('#skyLabel').textContent,win:WXW.tp+'/'+WXW.wx})}return out})()`);
  for(const r of lab){assert(!r.tp&&!r.wx&&!/isnight/.test(r.cls),'地図の枠に時間帯・天気の印が付いた：'+JSON.stringify(r));
    assert(/日目 \d+:00/.test(r.txt)&&/決算まで\d+時間/.test(r.txt)&&r.txt.includes('倍率'),'小窓の札の文字：'+r.txt)}
  assert.deepEqual(lab.map(r=>r.win),['morning/0','day/1','night/2','late/3'],'小窓の時間帯・天気');
  assert(d.querySelector('#skyLabel').getAttribute('role')==='button'&&d.querySelector('#skyLabel').getAttribute('tabindex')==='0','小窓の札をキーボードで押せない');
  // 3) BGMの選び方（music を差し替えて、選ばれた曲を記録）
  const songs=E(`(()=>{const got=[];const keep=music;music=k=>got.push(k);const out={};const t=curTip(),st=t.state,bk=JSON.stringify(st);
    const go=(k,fn)=>{Object.assign(st,JSON.parse(bk));fn(st);dispState=st;got.length=0;render();out[k]=got[got.length-1]};
    /* 目的地はランダムなので、近いときの曲（goalrun）が優先されないよう、全員を目的地から遠い場所に置いてから確かめる */
    const farAll=s=>{const d=D(s.goal),f=d.findIndex(v=>v>=8);s.players.forEach(p=>p.pos=f);return d};
    go('day1',s=>{farAll(s)});go('day2',s=>{farAll(s);s.month=2});
    go('near',s=>{const k=D(s.goal).findIndex(v=>v===3);s.players[curSeat(s)].pos=k});
    go('far',s=>{const k=D(s.goal).findIndex(v=>v===6);s.players.forEach(p=>p.pos=k)});
    go('final',s=>{farAll(s);s.maxTurn=s.maxTurn||120;s.turn=s.maxTurn-5});
    go('troll',s=>{farAll(s);s.troll=curSeat(s)});
    go('air',s=>{const d=farAll(s);s.players[curSeat(s)].pos=NODES.findIndex((n,i)=>n.air&&d[i]>5)});
    go('sea',s=>{const d=farAll(s);s.players[curSeat(s)].pos=NODES.findIndex((n,i)=>n.sea&&!n.air&&!n.oki&&d[i]>5)});
    music=keep;return out})()`);
  assert.deepEqual(songs,{day1:'@pop',day2:'@pop',near:'goalrun',far:'@pop',final:'climax',troll:'pinch',air:'sky',sea:'sea'},'BGMの選び方：'+JSON.stringify(songs));
  // 4) 曲データ
  const bad=E(`(()=>{const b=[];for(const [k,v] of Object.entries(SONGS)){if(!(SONG_GAIN[k]>0))b.push(k+':音量係数');if(v.up&&v.up.length!==v.form.length)b.push(k+':転調');for(const sk of new Set(v.form)){const c=v[sk];if(!c){b.push(k+':'+sk+'なし');continue}if(c.m.length%8||c.c.length*8!==c.m.length)b.push(k+':'+sk+':小節');for(const f of ['h','cm'])if(c[f]&&c[f].length!==c.m.length)b.push(k+':'+sk+':'+f)}}
    if(POPS.length!==4||!POPS.every(k=>SONGS[k]&&SONGS[k].pl&&SONGS[k].resume&&SONGS[k].vary))b.push('POPの交代設定');
    {const s=SONGS.pop,O=songOff(s),a=songAt(s,O[3]+13),z=songAt(s,s._len*2+O[2]);if(a.fi!==3||a.i!==13||z.pass!==2||z.fi!==2||z.i!==0)b.push('曲の位置の計算')}
    for(const k of ['map','night','kyushu','hokkaido'])if(SONGS[k])b.push(k+':廃止した曲が残っている');if(typeof regionSong!=='undefined')b.push('regionSongが残っている');return b})()`);
  assert.deepEqual(bad,[],'曲データ：'+bad.join(', '));
  if(errors.length)throw Error(errors.join('\n'));
  console.log('PASS 小窓とBGM（地図に重ねない・小窓の時間帯/天気・札の文字・POPが基本で場面の曲8場面・曲データ15曲）');dom.window.close();
}catch(e){console.error('FAIL',e.message);process.exitCode=1;dom.window.close()}},500);
