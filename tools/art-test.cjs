'use strict';
// Verify every animation pose stays on the raster path without a browser dependency.
const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const root = path.join(__dirname, '..'), calls = [];
const context = () => ({ globalAlpha:1, save(){}, restore(){}, translate(){}, scale(){}, rotate(){},
  drawImage(...args) { calls.push(args); } });
class Image {
  set src(value) {
    this.url=value;
    const file=path.join(root,new URL(value).pathname);
    if (!fs.existsSync(file)) { if(this.onerror)this.onerror(); return; }
    this.complete=true;this.width=this.naturalWidth=426;this.height=640;
    if(file.endsWith('.png')) { const b=fs.readFileSync(file);this.width=this.naturalWidth=b.readUInt32BE(16);this.height=b.readUInt32BE(20); }
    if(this.onload)this.onload();
  }
}
const ctx=vm.createContext({console,URL,Image,Map,Promise,window:{},document:{
  currentScript:{src:'http://localhost/src/art.js'},
  createElement:()=>({width:0,height:0,getContext:context}),
}});
for(const f of ['config','rig','characters','art'])vm.runInContext(fs.readFileSync(path.join(root,'src',f+'.js'),'utf8'),ctx);
const SM=ctx.window.SM;
SM.Art.preload(SM.CHARACTERS.map(ch => ch.id));
let draws=0, atlases=0;
for(const ch of SM.CHARACTERS) {
  if(SM.Art.combatReady(ch.id))atlases++;
  for(const [name,pose] of Object.entries(SM.Rig.POSES)) {
    assert.notEqual(SM.Art.frames[name],undefined,'Missing raster pose: '+name);
    for(const face of [-1,1]) {
      calls.length=0;
      SM.Rig.draw(context(),ch,pose,200,205,face,{t:10,flash:'#fff'});
      assert.equal(calls.length,1,ch.id+' '+name+' must draw one realistic frame');
      assert.ok(calls[0].slice(1).every(Number.isFinite),'Finite crop and destination coordinates');
      assert.ok(calls[0].at(-1)>0 && calls[0].at(-2)>0,'Positive frame dimensions');
      const mixed=SM.Rig.mix(SM.Rig.POSES.idle,pose,.6);
      assert.equal(mixed.sprite,pose.sprite,'Transitions preserve the selected raster pose');
      draws++;
    }
  }
}
if(process.argv.includes('--all'))assert.equal(atlases,SM.CHARACTERS.length,'Every character needs a combat sheet');
console.log(`art OK: ${draws} mirrored pose draws; ${atlases}/${SM.CHARACTERS.length} unique combat sheets`);
