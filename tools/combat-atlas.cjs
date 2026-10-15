'use strict';
// Extract alpha-component bounds from generated RGBA PNG combat sheets.
// Usage: node tools/combat-atlas.cjs assets/fighters/combat/*.png
const fs = require('node:fs');
const zlib = require('node:zlib');
function bounds(file) {
  const png = fs.readFileSync(file), w = png.readUInt32BE(16), h = png.readUInt32BE(20);
  if (png[24] !== 8 || png[25] !== 6 || png[28] !== 0) throw new Error('Expected non-interlaced 8-bit RGBA PNG: ' + file);
  const chunks = [];
  for (let i = 8; i < png.length;) {
    const n = png.readUInt32BE(i);
    if (png.toString('ascii', i + 4, i + 8) === 'IDAT') chunks.push(png.subarray(i + 8, i + 8 + n));
    i += n + 12;
  }
  const raw = zlib.inflateSync(Buffer.concat(chunks)), stride = w * 4, pixels = new Uint8Array(w * h * 4);
  const paeth = (a,b,c) => { const p=a+b-c, da=Math.abs(p-a), db=Math.abs(p-b), dc=Math.abs(p-c); return da<=db&&da<=dc?a:db<=dc?b:c; };
  for (let y = 0; y < h; y++) {
    const filter = raw[y * (stride + 1)];
    if (filter > 4) throw new Error('Invalid PNG filter');
    for (let x = 0; x < stride; x++) {
      const i = y * stride + x, a = x >= 4 ? pixels[i - 4] : 0, b = y ? pixels[i - stride] : 0, c = y && x >= 4 ? pixels[i - stride - 4] : 0;
      pixels[i] = raw[y * (stride + 1) + x + 1] + [0,a,b,Math.floor((a+b)/2),paeth(a,b,c)][filter];
    }
  }
  const seen = new Uint8Array(w*h), queue = new Uint32Array(w*h), groups=[];
  for (let n=0;n<w*h;n++) {
    if(seen[n] || pixels[n*4+3]<220)continue;
    let count=1, xmin=w,ymin=h,xmax=0,ymax=0;queue[0]=n;seen[n]=1;
    for(let k=0;k<count;k++) {
      const i=queue[k],x=i%w,y=Math.floor(i/w);
      xmin=Math.min(xmin,x);xmax=Math.max(xmax,x);ymin=Math.min(ymin,y);ymax=Math.max(ymax,y);
      for(const j of [x>0?i-1:-1,x<w-1?i+1:-1,y>0?i-w:-1,y<h-1?i+w:-1]) {
        if(j>=0&&!seen[j]&&pixels[j*4+3]>=220){seen[j]=1;queue[count++]=j;}
      }
    }
    if(count>500)groups.push([xmin,ymin,xmax+1,ymax+1]);
  }
  if(groups.length!==12)throw new Error(file + ': expected 12 separate poses, found ' + groups.length);
  const frames = Array(12), pivots=[.5,.41,.35,.33,.27,.46,.5,.57,.5,.5,.5,.5];
  for(const [x0,y0,x1,y1] of groups) {
    const col=Math.min(3,Math.floor((x0+x1)/2/w*4)), row=Math.min(2,Math.floor((y0+y1)/2/h*3)), i=row*4+col;
    if(frames[i])throw new Error(file + ': overlapping pose slots at ' + i);
    const x=Math.max(0,x0-3),y=Math.max(0,y0-3);
    frames[i]=[x,y,Math.min(w,x1+3)-x,Math.min(h,y1+3)-y,pivots[i]];
  }
  if(frames.some(f=>!f))throw new Error('Missing pose');
  return {file:file.split('/').pop(),frames};
}
if(require.main===module)for(const file of process.argv.slice(2))console.log(JSON.stringify(bounds(file)));
module.exports = bounds;
