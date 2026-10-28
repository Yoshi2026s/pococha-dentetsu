/* ポコチャ電鉄 v2: ホストが行動を検算し、Firestoreへ一度だけ確定する。 */
(() => {
 'use strict';
 const cfg=window.FIREBASE_CONFIG;
 if(!cfg||!cfg.apiKey){window.__PD_NO_FB=true;return;}
 const fail=e=>{window.__PD_BOOT_ERROR=String(e.code||e.message||e);};
 if(!window.firebase){window.__PD_NO_FB=true;window.__PD_FB_MISSING=true;return;}
 if(cfg.projectId!=='pococha-dentetsu'){fail(new Error('接続設定または通信ライブラリを確認してください'));window.claude={use:async()=>null};return;}
 let auth,fs,ready;
 try {firebase.initializeApp(cfg);auth=firebase.auth();fs=firebase.firestore();fs.settings({ignoreUndefinedProperties:true,merge:true});
 ready=auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL).then(()=>auth.signInAnonymously()).then(r=>r.user);
 ready.catch(fail);
 } catch(e){fail(e);window.claude={use:async()=>null};return;}
 const stamp=()=>firebase.firestore.FieldValue.serverTimestamp();
 const clean=x=>JSON.parse(JSON.stringify(x));
 const uid=()=>auth.currentUser.uid;
 const game=c=>fs.doc('pdGames/'+c);
 const err=m=>{throw new Error(m);};
 const native=p=>p.replace(/^games\//,'pdGames/').replace(/^players\//,'pdPlayers/');
 const encodeRec=r=>{const {state,action,...rest}=r;return {...rest,stateJson:JSON.stringify(state),actionJson:JSON.stringify(action),currentSeat:state.order[state.oi],finished:!!state.finished};};
 const decodeRec=r=>r&&'stateJson' in r?((({stateJson,actionJson,currentSeat,finished,...rest})=>({...rest,state:JSON.parse(stateJson),action:JSON.parse(actionJson)}))(r)):r;
 const wrap=d=>({id:d.id,exists:d.exists,data:()=>decodeRec(d.data())});
 const wrapQ=q=>({docs:q.docs.map(wrap),size:q.size,empty:q.empty,docChanges:()=>q.docChanges().map(c=>({type:c.type,doc:wrap(c.doc)}))});
 const snapshotError=e=>{fail(e);window.dispatchEvent(new CustomEvent('pd-network-error',{detail:e}));};
 function doc(path){const r=fs.doc(native(path));return {id:r.id,path,
 get:async()=>wrap(await r.get({source:'server'})),set:v=>r.set(clean(v)),
 update:v=>fs.runTransaction(async tx=>{const d=await tx.get(r);if(!d.exists)err('部屋が見つかりません');tx.update(r,clean(v));}),
 delete:()=>r.delete(),acquire:async()=>({acquired:false}),
 onSnapshot:(fn,onErr)=>r.onSnapshot(d=>fn(wrap(d)),e=>{snapshotError(e);if(onErr)onErr(e);})};}
 function collection(path){let q=fs.collection(native(path));if(path.endsWith('/turns'))q=q.orderBy('turn').limitToLast(40);
 return {get:async()=>wrapQ(await q.get({source:'server'})),onSnapshot:(fn,onErr)=>q.onSnapshot(s=>fn(wrapQ(s)),e=>{snapshotError(e);if(onErr)onErr(e);})};}
 const online={
 async create(c,version){const r=game(c);await fs.runTransaction(async tx=>{const old=await tx.get(r);if(old.exists)err('部屋コードが使用されています');
 tx.set(r,{schemaVersion:2,disconnectSec:45,cpuTimeoutSec:90,rulesVersion:version,host:uid(),members:[uid()],seatUids:[uid(),'','',''],phase:'lobby',cpu:[],cpuLv:'normal',days:2,revision:0,tipId:'',createdAt:stamp(),turnAt:stamp(),paused:null,uname:{},pname:{},cpuChar:{}});
 tx.set(r.collection('seats').doc('0'),{uid:uid(),ready:true});});},
 async join(c,version){const r=game(c);for(let attempt=0;attempt<5;attempt++){try{return await fs.runTransaction(async tx=>{const d=await tx.get(r);if(!d.exists)err('その部屋は見つかりません');const m=d.data();
 if(m.phase==='closed')err('この部屋は閉じられています');
 if(version!==undefined&&m.rulesVersion!==version)err('古い版の部屋です。新しく部屋を作ってください');
 if(m.members.includes(uid()))return m.seatUids.indexOf(uid());
 if(m.phase!=='lobby')err('開始後の新規参加はできません');const i=m.seatUids.indexOf('');if(i<0)err('満員です（最大4人）');
 const a=m.seatUids.slice();a[i]=uid();tx.update(r,{members:m.members.concat(uid()),seatUids:a});tx.set(r.collection('seats').doc(String(i)),{uid:uid(),ready:true});return i;});}catch(e){if(e.code!=='permission-denied'||attempt===4)throw e;}}},
 async start(c,makeGenesis,chooseCpu,seed){const r=game(c),choices={};for(const lv of ['weak','normal','strong'])for(let mask=0;mask<16;mask++)choices[lv+':'+mask]=chooseCpu([0,1,2,3].filter(i=>mask&(1<<i)),lv);for(let attempt=0;attempt<5;attempt++){try{await fs.runTransaction(async tx=>{const d=await tx.get(r),m=d.data();if(!m||m.host!==uid()||m.phase!=='lobby')err('開始できません');
 const slots=await Promise.all([0,1,2,3].map(i=>tx.get(r.collection('seats').doc(String(i)))));
 if(slots.some((s,i)=>m.seatUids[i]&&(!s.exists||!s.data().ready)))err('全員の準備OKを待っています');
 const cpu=[0,1,2,3].filter(i=>!m.seatUids[i]),rec=makeGenesis(seed,m.days);tx.set(r.collection('turns').doc('0-0'),encodeRec(rec));
 tx.update(r,{phase:'playing',cpu,cpuChar:choices[m.cpuLv+':'+cpu.reduce((n,i)=>n+(1<<i),0)],seed,tipId:'0-0',revision:0,turnAt:stamp(),paused:null});});return;}catch(e){if(e.code!=='permission-denied'||attempt===4)throw e;}}},
 async submit(c,tip,seat,action,proxy){const r=game(c),id=tip.turn+'-'+uid(),ref=r.collection('actions').doc(id);
 const a=clean(action);delete a.end;
 await fs.runTransaction(async tx=>{const d=await tx.get(r),old=await tx.get(ref),m=d.data();if(old.exists)return;
 if(!m||m.phase!=='playing'||m.paused||m.revision!==tip.turn||m.tipId!==tip.id)err('手番が更新されました。最新の画面で操作してください');
 tx.set(ref,{uid:uid(),revision:tip.turn,parent:tip.id,seat,proxy:!!proxy,actionJson:JSON.stringify(a),status:'pending',createdAt:stamp()});});},
 async process(c,requestId,apply,seatOf){const r=game(c),ar=r.collection('actions').doc(requestId);
 await fs.runTransaction(async tx=>{const md=await tx.get(r),ad=await tx.get(ar);if(!md.exists||!ad.exists)return;const m=md.data(),a=ad.data();
 if(m.host!==uid()||a.status!=='pending')return;if(a.revision!==m.revision||a.parent!==m.tipId){tx.update(ar,{status:'rejected'});return;}if(m.phase!=='playing'||m.paused)return;
 const pd=await tx.get(r.collection('turns').doc(m.tipId));if(!pd.exists)return;const prev=decodeRec(pd.data()),seat=seatOf(prev.state);if(prev.state.finished||seat!==a.seat)return;
 const actor=m.seatUids[seat],elapsed=Date.now()-(m.turnAt?.toMillis()||Date.now());
 if(a.proxy){if(a.uid!==m.host||(!m.cpu.includes(seat)&&elapsed<(m.cpuTimeoutSec||90)*1000))return;}else if(actor!==a.uid||m.cpu.includes(seat))return;
 let state;try {const action=JSON.parse(a.actionJson);if(m.endReq&&!prev.state.days)action.end=true;state=apply(prev.state,action,m.seed);}catch(e){tx.update(ar,{status:'rejected'});return;}
 const id=state.turn+'-1',rec={id,turn:state.turn,grant:1,parent:m.tipId,by:(a.proxy?'cpu':'s')+seat+':'+a.uid,action:{...JSON.parse(a.actionJson),...(m.endReq&&!prev.state.days?{end:true}:{})},state,rulesVersion:m.rulesVersion};
 tx.set(r.collection('turns').doc(id),encodeRec(rec));tx.update(r,{tipId:id,revision:state.turn,turnAt:stamp()});tx.update(ar,{status:'processed'});});},
 watchActions(c,fn){return game(c).collection('actions').where('status','==','pending').onSnapshot(q=>q.docChanges().forEach(ch=>{if(ch.type!=='removed')fn(ch.doc.id);}),snapshotError);},
 async leave(c){const r=game(c);await fs.runTransaction(async tx=>{const d=await tx.get(r);if(!d.exists)return;const m=d.data(),i=m.seatUids.indexOf(uid());if(i<0)return;
 if(m.phase!=='lobby')return;
 if(m.host===uid()){tx.update(r,{phase:'closed'});return;}const a=m.seatUids.slice();a[i]='';tx.update(r,{seatUids:a,members:m.members.filter(u=>u!==uid())});tx.delete(r.collection('seats').doc(String(i)));});},
 async requests(c){return game(c).collection('actions').where('status','==','pending').get();}
 };
 const db={doc,collection,online};
 const room={async join(name){const c=name.slice(1).toUpperCase(),base=game(c),me=uid(),pref=base.collection('peers').doc(me);let pres={},listeners=[],peerFns=[],connFns=[],last=[],disconnectSec=45;
 listeners.push(base.onSnapshot(d=>{disconnectSec=d.data()?.disconnectSec||45;},snapshotError));
 const beat=()=>pref.set({uid:me,presence:pres,at:stamp()}).catch(snapshotError);
 const hb=setInterval(beat,15000);await beat();
 listeners.push(base.collection('peers').onSnapshot(q=>{last=q.docs.map(d=>{const data=d.data({serverTimestamps:'estimate'});return {id:d.id,isMe:d.id===me,presence:data.presence,at:data.at?.toMillis()||0}});peerFns.forEach(f=>f({peers:last.filter(p=>Date.now()-p.at<disconnectSec*1000)}));},snapshotError));
 const iv=setInterval(()=>peerFns.forEach(f=>f({peers:last.filter(p=>Date.now()-p.at<disconnectSec*1000)})),1000);
 let stampHandler=null,start=Date.now();const seenStamps=new Map();
 listeners.push(base.collection('stamps').orderBy('at','desc').limit(12).onSnapshot(q=>{q.docChanges().forEach(ch=>{const d=ch.doc.data(),at=d.at?.toMillis()||0;
 // 同じ送信者の2回目以降は modified。サーバー時刻確定前の通知は表示しない。
 if(ch.type==='removed'||ch.doc.metadata?.hasPendingWrites||at<=start||at<=(seenStamps.get(ch.doc.id)||0))return;
 seenStamps.set(ch.doc.id,at);if(stampHandler)stampHandler({isMe:d.uid===me,data:{i:d.i}});
 });},snapshotError));
 const connectivity=()=>connFns.forEach(f=>f(navigator.onLine));addEventListener('online',connectivity);addEventListener('offline',connectivity);
 return {on(t,f){if(t==='stamp')stampHandler=f;},emit(t,data){if(t!=='stamp')return Promise.resolve();return base.collection('stamps').doc(me).set({uid:me,i:data.i,at:stamp()});},presence(p){pres=p;return beat();},onPeers(f){peerFns.push(f);f({peers:last});},onConnection(f){connFns.push(f);f(navigator.onLine);},leave(){clearInterval(hb);clearInterval(iv);listeners.forEach(f=>f());pref.delete().catch(()=>{});removeEventListener('online',connectivity);removeEventListener('offline',connectivity);}};}};
 window.claude={firebase:true,use:async n=>{try{await ready;}catch(e){fail(e);return null;}return n==='db'?db:n==='room'?room:n==='user'?{id:async()=>uid(),can:async()=>true,profiles:async()=>({})}:null;}};
})();
