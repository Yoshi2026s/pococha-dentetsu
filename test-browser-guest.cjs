const fs=require('fs'),vm=require('vm'),assert=require('assert');const fb=require('firebase/compat/app').default;require('firebase/compat/auth');require('firebase/compat/firestore');
const code=process.argv[2];if(!/^[A-Z2-9]{4}$/.test(code))throw Error('テスト部屋コードが必要');
const cfg=JSON.parse(fs.readFileSync('firebase-config.js','utf8').replace('window.FIREBASE_CONFIG = ','').replace(/;\s*$/,''));
const app=fb.initializeApp(cfg,'browser-guest'),auth=app.auth(),store=app.firestore();let room,stop=()=>{},ended=false,working=false;
const timeout=setTimeout(()=>finish(new Error('別環境の手番確認は時間切れ')),180000);
async function finish(e,result){if(ended)return;ended=true;clearTimeout(timeout);stop();if(room)room.leave();if(result){fs.writeFileSync('browser-guest-results.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result));}if(e){console.error(e.code||e.message);process.exitCode=1;}await app.delete();}
(async()=>{const af=()=>({setPersistence:async()=>{},signInAnonymously:()=>auth.signInAnonymously(),get currentUser(){return auth.currentUser}});af.Auth=fb.auth.Auth;const ff=()=>store;ff.FieldValue=fb.firestore.FieldValue;
const window={FIREBASE_CONFIG:cfg,firebase:true,dispatchEvent(){}};new Function('window','firebase','addEventListener','removeEventListener','navigator',fs.readFileSync('online.js','utf8'))(window,{initializeApp(){},auth:af,firestore:ff},()=>{},()=>{},{onLine:true});
const db=await window.claude.use('db');if(!db)throw Error(window.__PD_BOOT_ERROR);await db.online.join(code);const u=auth.currentUser.uid,m=(await db.doc('games/'+code).get()).data();assert.notEqual(u,m.host);const seat=m.seatUids.indexOf(u);
console.log('別の匿名UIDで参加完了。席：'+(seat+1));
const engine=fs.readFileSync('index.html','utf8'),core=engine.slice(engine.indexOf("'use strict';",engine.indexOf('// ===== GitHub Pages版')));const ctx={console};vm.createContext(ctx);vm.runInContext(core.split('// ================= 音（')[0]+engine.slice(engine.indexOf('function bestPath('),engine.indexOf('function allRoutes('))+'\nglobalThis.E={curSeat};',ctx);const E=ctx.E;
room=await (await window.claude.use('room')).join('g'+code.toLowerCase());await room.presence({seat});let submitted=-1;
stop=db.doc('games/'+code).onSnapshot(async d=>{if(working||ended)return;const meta=d.data();if(meta.phase!=='playing'||meta.paused||!meta.tipId)return;working=true;try{const t=(await db.doc('games/'+code+'/turns/'+meta.tipId).get()).data();
if(t.by&&t.by.includes(u)&&t.turn>0){await finish(null,{testRoom:code,distinctAnonymousUsers:true,guestSeat:seat+1,guestActionCommitted:true,revision:t.turn,environment:'公開Cloud Browser + 独立Node.js SDKクライアント',physicalDevices:false});return;}
if(E.curSeat(t.state)===seat&&submitted!==t.turn){submitted=t.turn;await db.online.submit(code,t,seat,{type:'roll',buy:false},false);console.log('別クライアントの行動を送信しました');}
}catch(e){await finish(e)}finally{working=false;}});
})().catch(finish);
