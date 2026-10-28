const fs=require('fs'),vm=require('vm'),assert=require('assert');
const source=fs.readFileSync('online.js','utf8'),html=fs.readFileSync('index.html','utf8');
assert(html.includes(source.trim()),'実行用の埋め込みとonline.jsの一致');
let callback,handler,display=[],now=1000;const ctx={Date:{now:()=>now},Map,me:'me',listeners:[],snapshotError:e=>{throw e},base:{collection:()=>({orderBy:()=>({limit:()=>({onSnapshot:f=>{callback=f;return()=>{}}})})})}};
vm.createContext(ctx);vm.runInContext(source.slice(source.indexOf('let stampHandler=null'),source.indexOf('const connectivity='))+'\nstampHandler=e=>display.push(e);',Object.assign(ctx,{display}));
function send(type,at,pending=false){callback({docChanges:()=>[{type,doc:{id:'me',metadata:{hasPendingWrites:pending},data:()=>({uid:'me',i:2,at:at?{toMillis:()=>at}:null})}}]});}
send('added',900);send('added',1100,true);send('modified',1100);send('modified',1100);send('modified',1200);send('removed',1300);assert.equal(display.length,2,'初回・繰返しの確定通知を各1回だけ表示');
let stored;const history={localStorage:{getItem:()=>stored}};vm.createContext(history);
vm.runInContext(html.slice(html.indexOf('function validRooms('),html.indexOf('let myRooms='))+html.slice(html.indexOf('function mergeRooms('),html.indexOf('async function refreshResume(')),history);
for(const bad of ['null','{}','[null,{},42]','破損']){stored=bad;assert.equal(history.loadRooms().length,0);assert.equal(history.mergeRooms(history.loadRooms(),[null]).length,0);}
stored='[{"c":"ABCD","at":100},{"c":"<img","at":200}]';assert.equal(history.loadRooms().length,1);
assert.equal(history.mergeRooms([{c:'ABCD',at:100}],[{c:'ABCD',at:200}])[0].at,200);
console.log('PASS 埋め込み同期・スタンプ初回/繰返し/重複/過去通知・履歴破損/不正値/統合');

// サーバー時刻の確定待ちでも、自分の通信確認を0時扱いしない。
let peersCallback;const presenceCtx={Date:{now:()=>2000},disconnectSec:45,me:'host',last:[],peerFns:[],listeners:[],snapshotError:e=>{throw e},base:{collection:()=>({onSnapshot:f=>{peersCallback=f;return()=>{}}})}};
vm.createContext(presenceCtx);const start=source.indexOf("listeners.push(base.collection('peers')");vm.runInContext(source.slice(start,source.indexOf('const iv=',start)),presenceCtx);
peersCallback({docs:[{id:'host',data:options=>({presence:{seat:0},at:options?.serverTimestamps==='estimate'?{toMillis:()=>2000}:null})}]});assert.equal(presenceCtx.last[0].at,2000);
// 実際の入室関数で、重複接続と取得失敗を検証。
(async()=>{let joins=0,reads=0,renders=0,toasts=[];const ectx={normCode:v=>v,unlock(){},code:'ABCD',render(){renders++},toast:t=>toasts.push(t),errText:e=>e.message,RULES_VERSION:32,db:{online:{join:async(c,v)=>{joins++;assert.equal(v,32)}},doc:()=>({get:async()=>{reads++;throw Error('通信断')}})}};
vm.createContext(ectx);vm.runInContext(html.slice(html.indexOf('async function enter('),html.indexOf('async function rematch(')),ectx);
await ectx.enter('ABCD');assert.equal(joins,0);assert.equal(reads,0);assert.equal(renders,1);
await ectx.enter('EFGH');assert.equal(joins,1);assert.equal(reads,1);assert.equal(toasts[0],'通信断');console.log('PASS 通信確認の時刻推定・同室重複接続防止・入室取得失敗の表示');})().catch(e=>{console.error(e);process.exitCode=1});
