'use strict';
const assert=require('node:assert/strict'), vm=require('node:vm'), fs=require('node:fs'), EventEmitter=require('node:events');
let now=0, id=0;const timers=new Map(), peers=[];
class Connection extends EventEmitter { constructor(){super();this.open=true;this.sent=[];} send(m){this.sent.push(m);} close(){this.emit('close');} }
class Peer extends EventEmitter {
  constructor(name){super();this.id=name;this.open=false;peers.push(this);}
  connect(){return this.connection=new Connection();}
  destroy(){this.destroyed=true;this.emit('disconnected');}
  reconnect(){}
}
const SM={clamp:(v,a,b)=>Math.min(b,Math.max(a,v)),FX:{},Audio:{}};
for(const name of ['spark','dust','trail','text','bolt','clear'])SM.FX[name]=()=>{};
for(const name of ['sfx','music'])SM.Audio[name]=()=>{};
const context=vm.createContext({SM,window:{Peer},performance:{now:()=>now},location:{origin:'https://example.org',pathname:'/'},console,setTimeout:(fn,ms)=>{timers.set(++id,{fn,at:now+ms});return id;},clearTimeout:id=>timers.delete(id)});
vm.runInContext(fs.readFileSync('src/net.js','utf8').split('// ---------- fotografias')[0],context);
const N=SM.Net;
function openHost(){N.host();const p=peers.at(-1);p.open=true;p.emit('open');const c=new Connection();p.emit('connection',c);c.emit('open');return {p,c};}
function advance(ms){now+=ms;for(const [id,t] of [...timers])if(t.at<=now){timers.delete(id);t.fn();}}
let {p,c}=openHost();assert.equal(N.connected,false,'Wait for protocol handshake');c.emit('data',{t:'hello',v:3});assert.equal(N.connected,true);
c.emit('data',{t:'i',h:8,p:8});assert.equal(N.nextRemote().held,8);advance(301);assert.equal(N.nextRemote().held,0,'Release stale remote input');
for(let i=0;i<100;i++)c.emit('data',{t:'i',h:-1,p:-1});assert.equal(N.remoteQ.length,12);assert.equal(N.nextRemote().held,1023);
let unsafe=false;SM.FX.unsafe=()=>unsafe=true;N.pending.push(['FX','unsafe',[]],null);N.replay();assert.equal(unsafe,false);
N.leave();c.emit('close');p.emit('error',{type:'network'});assert.equal(N.error,'','Old events cannot damage the next session');
({p,c}=openHost());c.emit('data',{t:'hello',v:1});assert.match(N.error,/ATUALIZA/);
({p,c}=openHost());advance(15001);assert.match(N.error,/EXPIROU/);
N.host();advance(15001);assert.match(N.error,/SERVIDOR/);
N.join('ABC');assert.match(N.error,/5 CARACTERES/);
({p,c}=openHost());c.emit('data',{t:'hello',v:3});const busy=new Connection();p.emit('connection',busy);busy.emit('open');assert.equal(busy.sent[0].reason,'full');
N.leave();assert.equal(timers.size,0);assert.equal(N.connected,false);
console.log('net OK: handshake, version, room-full, timeout, cancellation, bounded input, stale controls, event whitelist');
