// 専用のテスト部屋を作る。本番利用者の部屋を読まない・削除しない。
const fs=require('fs'),vm=require('vm'),crypto=require('crypto'),assert=require('assert');
const firebase=require('firebase/compat/app').default;require('firebase/compat/auth');require('firebase/compat/firestore');
const cfg=JSON.parse(fs.readFileSync('firebase-config.js','utf8').replace('window.FIREBASE_CONFIG = ','').replace(/;\s*$/,''));
const report={projectId:cfg.projectId,checks:[],testRoom:null,physicalDevices:false};const apps=[];
const timer=setTimeout(()=>{console.log('実接続テスト：時間切れ。完了と扱いません。');process.exit(2)},60000);
async function client(n){const app=firebase.initializeApp(cfg,n);apps.push(app);const au=app.auth(),store=app.firestore();
const af=()=>({setPersistence:async()=>{},signInAnonymously:()=>au.signInAnonymously(),get currentUser(){return au.currentUser}});af.Auth=firebase.auth.Auth;const ff=()=>store;ff.FieldValue=firebase.firestore.FieldValue;
const window={FIREBASE_CONFIG:cfg,firebase:true,dispatchEvent(){}};new Function('window','firebase',fs.readFileSync('online.js','utf8'))(window,{initializeApp(){},auth:af,firestore:ff});
const db=await window.claude.use('db');if(!db)throw Error(window.__PD_BOOT_ERROR||'匿名認証に失敗');return {app,db,store,uid:au.currentUser.uid};}
(async()=>{const H=await client('live-host'),A=await client('live-guest');assert.notEqual(H.uid,A.uid);report.checks.push('異なる2つの匿名UIDで認証成功');
const alphabet='ABCDEFGHJKLMNPQRSTUVWXYZ23456789',code=[...crypto.randomBytes(4)].map(x=>alphabet[x%alphabet.length]).join('');report.testRoom=code;
await H.db.online.create(code,32);report.checks.push('本番で専用部屋を作成');await A.db.online.join(code);report.checks.push('別UIDで参加');
const h=fs.readFileSync('index.html','utf8'),engine=h.slice(h.indexOf("'use strict';",h.indexOf('// ===== GitHub Pages版')));const ctx={console};vm.createContext(ctx);vm.runInContext(engine.split('// ================= 音（')[0]+h.slice(h.indexOf('function bestPath('),h.indexOf('function allRoutes('))+'\nglobalThis.E={genesis,applyTurn,curSeat};',ctx);const E=ctx.E;
await H.db.online.start(code,E.genesis,()=>({}),'ABCDEFGHIJKL');await H.store.doc('pdGames/'+code+'/peers/'+H.uid).set({uid:H.uid,presence:{seat:0},at:firebase.firestore.FieldValue.serverTimestamp()});
const t=(await H.db.doc('games/'+code+'/turns/0-0').get()).data();await H.db.online.submit(code,t,E.curSeat(t.state),{type:'roll',buy:false},false);await H.db.online.process(code,'0-'+H.uid,E.applyTurn,E.curSeat);
const [one,two]=await Promise.all([H.db.doc('games/'+code+'/turns/1-1').get(),A.db.doc('games/'+code+'/turns/1-1').get()]);assert(one.exists&&two.exists);assert.deepStrictEqual(one.data(),two.data());report.checks.push('開始・CPU補完・手番確定・別UIDの盤面一致');
try{await A.store.doc('pdGames/'+code+'/turns/forged').set({x:1});throw Error('不正書込が許可された')}catch(e){if(e.code!=='permission-denied')throw e;report.checks.push('本番ルールが参加者の盤面直接書込を拒否');}
await H.db.doc('games/'+code).update({paused:{by:H.uid,seat:0,at:Date.now(),turn:1}});report.checks.push('テスト部屋を中断して保持（削除せず）');
fs.writeFileSync('live-test-results.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));await Promise.all(apps.map(a=>a.delete()));clearTimeout(timer);
})().catch(async e=>{console.error('実接続テスト未完了:',e.code||e.name,JSON.stringify(report),String(e.stack||'').split('\n').filter(l=>l.includes('test-live.cjs')).join('\n'));clearTimeout(timer);await Promise.all(apps.map(a=>a.delete()));process.exitCode=1;});
