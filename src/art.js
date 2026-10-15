'use strict';
// Photographic combat frames share the same feet origin as the collision rig.
SM.Art = (() => {
  const base = document.currentScript ? new URL('../assets/fighters/', document.currentScript.src).href : 'assets/fighters/';
  const SHEETS = {
    rodrigo: { file: 'rodrigo.png', frames: [
      [33,11,293,353,.5], [397,11,329,351,.41], [763,14,357,348,.35], [1163,5,277,356,.33],
      [20,371,360,335,.27], [431,435,244,266,.46], [783,370,277,337,.5], [1172,373,266,332,.57],
      [61,706,233,317,.5], [414,692,279,382,.5], [737,952,407,121,.5], [1172,701,246,374,.5],
    ] },
    alvaro: {"file":"alvaro.png","frames":[[25,7,298,353,0.5],[393,8,342,352,0.41],[761,11,371,351,0.35],[1155,4,288,356,0.33],[20,368,363,335,0.27],[448,440,247,258,0.46],[795,371,264,336,0.5],[1146,380,295,324,0.57],[91,704,194,315,0.5],[418,695,284,387,0.5],[737,957,393,119,0.5],[1162,705,258,376,0.5]]},
    cristiano: {"file":"cristiano.png","frames":[[23,11,302,350,0.5],[383,12,342,349,0.41],[775,15,365,346,0.35],[1168,6,279,353,0.33],[25,370,338,339,0.27],[413,439,249,261,0.46],[793,379,279,330,0.5],[1177,378,268,329,0.57],[88,711,193,308,0.5],[395,693,297,384,0.5],[719,963,443,107,0.5],[1192,701,246,380,0.5]]},
    cleusio: {"file":"cleusio.png","frames":[[21,6,291,359,0.5],[381,9,351,357,0.41],[765,13,374,353,0.35],[1162,5,280,354,0.33],[16,373,342,334,0.27],[424,444,248,260,0.46],[784,374,283,334,0.5],[1152,382,285,326,0.57],[93,703,189,305,0.5],[391,694,305,381,0.5],[730,955,411,120,0.5],[1170,693,265,383,0.5]]},
    atircio: {"file":"atircio.png","frames":[[14,10,303,358,0.5],[370,8,357,359,0.41],[739,13,376,355,0.35],[1138,5,302,367,0.33],[17,367,353,345,0.27],[416,443,258,263,0.46],[771,369,290,345,0.5],[1165,383,262,324,0.57],[64,722,203,313,0.5],[375,699,307,382,0.5],[716,949,414,128,0.5],[1166,699,259,382,0.5]]},
    naftali: {"file":"naftali.png","frames":[[24,0,306,361,0.5],[365,0,343,361,0.41],[739,7,391,354,0.35],[1137,0,303,360,0.33],[18,371,365,338,0.27],[412,431,247,268,0.46],[766,366,306,342,0.5],[1134,374,301,331,0.57],[65,704,208,307,0.5],[390,697,313,383,0.5],[714,950,420,125,0.5],[1159,697,266,384,0.5]]},
    daniel: {"file":"daniel.png","frames":[[28,9,293,354,0.5],[395,8,348,355,0.41],[770,17,360,346,0.35],[1160,8,279,352,0.33],[25,374,347,337,0.27],[424,435,248,262,0.46],[781,371,284,339,0.5],[1171,375,268,332,0.57],[93,709,198,309,0.5],[405,698,275,382,0.5],[730,965,416,106,0.5],[1183,697,247,382,0.5]]},
    dave: {"file":"dave.png","frames":[[26,3,300,357,0.5],[389,2,343,358,0.41],[763,5,370,355,0.35],[1145,1,293,359,0.33],[21,367,341,337,0.27],[421,427,241,272,0.46],[774,368,281,335,0.5],[1145,365,292,339,0.57],[58,699,221,324,0.5],[392,699,291,379,0.5],[709,955,438,120,0.5],[1160,698,271,380,0.5]]},
    diego: {"file":"diego.png","frames":[[25,10,298,347,0.5],[372,7,343,350,0.41],[759,14,347,344,0.35],[1139,9,298,347,0.33],[15,366,346,341,0.27],[426,429,250,270,0.46],[776,366,302,343,0.5],[1155,373,288,330,0.57],[69,700,215,317,0.5],[398,697,283,378,0.5],[722,953,414,118,0.5],[1157,695,267,384,0.5]]},
    walgidio: {"file":"walgidio.png","frames":[[26,5,293,352,0.5],[383,6,341,350,0.41],[752,7,359,349,0.35],[1136,0,303,354,0.33],[19,360,349,346,0.27],[414,436,248,263,0.46],[771,369,276,336,0.5],[1153,365,283,338,0.57],[81,701,204,323,0.5],[389,695,293,386,0.5],[715,950,415,124,0.5],[1163,693,265,388,0.5]]},
    leonardo: {"file":"leonardo.png","frames":[[25,5,295,358,0.5],[382,5,348,358,0.41],[781,11,366,351,0.35],[1162,4,283,357,0.33],[19,369,337,341,0.27],[415,427,243,276,0.46],[796,366,279,343,0.5],[1178,372,270,335,0.57],[68,701,214,315,0.5],[397,694,285,386,0.5],[726,949,429,124,0.5],[1177,694,251,384,0.5]]},
    emanuel: { file: 'street.png', frames: [
      [26,9,294,352,.5], [391,8,328,353,.41], [753,14,350,347,.35], [1138,4,302,352,.33],
      [18,369,339,339,.27], [419,430,241,271,.46], [769,367,271,339,.5], [1149,370,279,331,.57],
      [68,703,214,324,.5], [399,697,270,382,.5], [722,952,398,122,.5], [1164,697,246,382,.5],
    ] },
  };
  const FRAMES = {
    idle:0, idle2:0, walk1:0, walk2:0, crouch:5, squat:5, jumpUp:8, jumpFall:8,
    blockHi:6, blockLo:5, hitHi:7, hitMid:7, hitLow:7, launched:7, down:10, getup:5, dizzy:7,
    lpWind:0, lp:1, hpWind:0, hp:2, lkWind:8, lk:3, hkWind:8, hk:4,
    clp:1, chpWind:5, chp:9, clk:3, chkWind:5, chk:3, jlp:1, jhp:2, jlk:3, jhk:4,
    grab:2, toss:9, projWind:6, proj:2, rise:9, spin:4, rush:1, rush2:2, dive:3, slam:2,
    cmdGrab:2, counter:6, shoot:3, bicycle:4, charge:6, win:11, winCool:11, winPoint:11, siu:11, lose:5,
  };
  // Tight rectangles can include a fist from the neighbouring row; retain only the fighter.
  function cutFrame(img, frame) {
    const [x,y,w,h] = frame, cv = document.createElement('canvas');
    cv.width=w; cv.height=h;
    const c=cv.getContext('2d'); c.drawImage(img,x,y,w,h,0,0,w,h);
    if (!c.getImageData) return cv;
    let image;
    try { image=c.getImageData(0,0,w,h); }
    catch (_) { return cv; } // Local-file browsers may disallow pixel reads; the frame still draws.
    const pixels=image.data, seen=new Uint8Array(w*h), queue=new Uint32Array(w*h);
    let largest=new Uint32Array(0);
    for(let n=0;n<w*h;n++) {
      if(seen[n] || pixels[n*4+3]<32)continue;
      let count=1; queue[0]=n; seen[n]=1;
      for(let k=0;k<count;k++) {
        const i=queue[k], px=i%w, py=Math.floor(i/w);
        for(const j of [px>0?i-1:-1,px<w-1?i+1:-1,py>0?i-w:-1,py<h-1?i+w:-1]) {
          if(j>=0&&!seen[j]&&pixels[j*4+3]>=32){seen[j]=1;queue[count++]=j;}
        }
      }
      if(count>largest.length)largest=queue.slice(0,count);
    }
    const keep=new Uint8Array(w*h);
    for(const i of largest)keep[i]=1;
    for(let i=0;i<w*h;i++)if(!keep[i])pixels[i*4+3]=0;
    c.putImageData(image,0,0);
    return cv;
  }
  const imgs = new Map(), sheets = new Map(), previews = new Map(), loads = [];
  const load = (src, done) => {
    const img = new Image();
    loads.push(new Promise(resolve => {
      img.onload = () => { done(img); resolve(); };
      img.onerror = () => resolve();
    }));
    img.src = base + src;
    return img;
  };
  for (const ch of SM.CHARACTERS) imgs.set(ch.id, load(ch.portrait || ch.id + '.webp', () => {}));
  const requested = new Set();
  function preload(ids) {
    for (const id of ids) {
      const spec = SHEETS[id];
      if (!spec || requested.has(id)) continue;
      requested.add(id);
      load('combat/' + spec.file, img => {
        const images = spec.frames.map(frame => cutFrame(img, frame));
        sheets.set(id, { images, ...spec });
        previews.set(id, images[0]);
      });
    }
    return Promise.all(loads);
  }
  const ready = id => {
    const preview = previews.get(id);
    if (preview) return preview;
    const img = imgs.get(id);
    return img && img.complete && img.naturalWidth > 0 ? img : null;
  };
  function full(ctx, id, x, y, height, face = -1, alpha = 1) {
    if (!requested.has(id)) preload([id]);
    const img = ready(id);
    if (!img) return false;
    const w = img.width / img.height * height;
    ctx.save(); ctx.globalAlpha *= alpha; ctx.translate(x,y);
    // Existing portraits face left; combat sheets face right.
    ctx.scale(previews.has(id) ? face : face * (SM.charById(id).portraitFace || -1),1);
    ctx.drawImage(img,-w/2,-height,w,height); ctx.restore();
    return true;
  }
  function fight(ctx, ch, pose, x, y, face, opts = {}) {
    if (!requested.has(ch.id)) preload([ch.id]);
    const sheet = sheets.get(ch.id);
    if (!sheet) { full(ctx,ch.id,x,y,96*ch.body.size,face,opts.alpha === undefined ? 1 : opts.alpha); return; }
    const frame = FRAMES[pose.sprite] === undefined ? 0 : FRAMES[pose.sprite];
    const [, ,sw,sh,pivot] = sheet.frames[frame];
    const scale = 96 * ch.body.size / sheet.frames[0][3];
    const idle = pose.sprite === 'idle' || pose.sprite === 'idle2';
    const walking = pose.sprite === 'walk1' || pose.sprite === 'walk2';
    const step = Math.sin((opts.t || 0) * 0.24);
    const bob = idle ? Math.sin((opts.t || 0)*0.075)*0.45 : walking ? -Math.abs(step)*0.9 : 0;
    ctx.save(); ctx.translate(x,y+bob); ctx.scale(face,1);
    if (walking) ctx.rotate(step * 0.012);
    if (opts.alpha !== undefined) ctx.globalAlpha *= opts.alpha;
    if (opts.flash) ctx.filter = 'brightness(2.5)';
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(sheet.images[frame],-sw*pivot*scale,-sh*scale,sw*scale,sh*scale);
    ctx.restore();
  }
  return {
    get loaded() { return Promise.all(loads); }, preload, ready, full, fight, frames: FRAMES,
    combatReady: id => sheets.has(id),
    face(ctx,id,x,y,w,h) {
      const img = ready(id); if (!img) return false;
      const iw=img.width, ih=img.height, sw=iw*0.44, sh=sw*h/w;
      ctx.drawImage(img,iw*0.27,ih*0.005,sw,sh,x,y,w,h); return true;
    },
  };
})();
