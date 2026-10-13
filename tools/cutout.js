'use strict';
// Remove o fundo cinzento liso das artes dos lutadores e grava um PNG com transparência.
// Uso: node tools/cutout.js entrada.bmp saida.png
// Entrada em BMP (o `sips` do macOS converte), para não precisar de bibliotecas de imagem.
//
// Método: "balde de tinta" a partir das bordas. Um píxel é fundo se for cinzento (pouca
// saturação), não muito escuro, e parecido com o vizinho de onde a pintura veio, o que acompanha
// o degradê do fundo mas pára nos contornos da personagem (incluindo calças pretas).

const fs = require('fs');
const zlib = require('zlib');

function readBMP(file) {
  const b = fs.readFileSync(file);
  const off = b.readUInt32LE(10), w = b.readInt32LE(18), hRaw = b.readInt32LE(22), bpp = b.readUInt16LE(28);
  const h = Math.abs(hRaw), bottomUp = hRaw > 0, step = bpp / 8, stride = Math.ceil((w * bpp) / 32) * 4;
  const px = new Uint8Array(w * h * 4);
  for (let y = 0; y < h; y++) {
    const row = off + (bottomUp ? h - 1 - y : y) * stride;
    for (let x = 0; x < w; x++) {
      const i = row + x * step, o = (y * w + x) * 4;
      px[o] = b[i + 2]; px[o + 1] = b[i + 1]; px[o + 2] = b[i]; px[o + 3] = 255;
    }
  }
  return { w, h, px };
}

function writePNG(file, { w, h, px }) {
  const crcTable = Array.from({ length: 256 }, (_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
  const crc = (buf) => { let c = 0xffffffff; for (const v of buf) c = crcTable[(c ^ v) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
  const chunk = (type, data) => {
    const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
    const td = Buffer.concat([Buffer.from(type), data]);
    const c = Buffer.alloc(4); c.writeUInt32BE(crc(td));
    return Buffer.concat([len, td, c]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 6; // RGBA 8 bits
  const raw = Buffer.alloc((w * 4 + 1) * h);
  for (let y = 0; y < h; y++) {
    raw[y * (w * 4 + 1)] = 0;
    Buffer.from(px.buffer, y * w * 4, w * 4).copy(raw, y * (w * 4 + 1) + 1);
  }
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  fs.writeFileSync(file, Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0))]));
}

const SM_clamp = (v, a, b) => Math.max(a, Math.min(b, v));

function cutout(img) {
  const { w, h, px } = img;
  const bg = new Uint8Array(w * h);
  const isGrey = (i) => {
    const r = px[i * 4], g = px[i * 4 + 1], b = px[i * 4 + 2];
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
    return mx - mn < 16 && mx > 24 && mx < 110;
  };
  const diff = (a, b) => Math.abs(px[a * 4] - px[b * 4]) + Math.abs(px[a * 4 + 1] - px[b * 4 + 1]) + Math.abs(px[a * 4 + 2] - px[b * 4 + 2]);
  // cor esperada do fundo em cada ponto: média das bordas esquerda/direita dessa linha
  const edge = (y, x0) => { let t = 0; for (let k = 0; k < 4; k++) t += px[(y * w + x0 + k) * 4 + 1]; return t / 4; };
  const bgL = new Float32Array(h), bgR = new Float32Array(h);
  for (let y = 0; y < h; y++) { bgL[y] = edge(y, 0); bgR[y] = edge(y, w - 4); }
  const nearBg = (i) => { const x = i % w, y = (i / w) | 0; const e = bgL[y] + (bgR[y] - bgL[y]) * (x / w); return Math.abs(px[i * 4 + 1] - e) < 16; };
  const stack = [];
  const seed = (i) => { if (!bg[i] && isGrey(i)) { bg[i] = 1; stack.push(i); } };
  for (let x = 0; x < w; x++) { seed(x); seed((h - 1) * w + x); }
  for (let y = 0; y < h; y++) { seed(y * w); seed(y * w + w - 1); }
  while (stack.length) {
    const i = stack.pop(), x = i % w, y = (i / w) | 0;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
      const n = ny * w + nx;
      if (!bg[n] && isGrey(n) && diff(i, n) < 9 && nearBg(n)) { bg[n] = 1; stack.push(n); }
    }
  }
  // sombra no chão: zonas cinzentas lisas, mais escuras do que o fundo, na metade de baixo,
  // ligadas ao fundo -> viram sombra preta semitransparente
  const shadow = new Uint8Array(w * h);
  const bgAt = (i) => { const x = i % w, y = (i / w) | 0; return bgL[y] + (bgR[y] - bgL[y]) * (x / w); };
  for (let i = 0; i < w * h; i++) if (bg[i]) stack.push(i);
  while (stack.length) {
    const i = stack.pop(), x = i % w, y = (i / w) | 0;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy;
      if (nx < 0 || ny < h * 0.4 || nx >= w || ny >= h) continue;
      const n = ny * w + nx;
      if (bg[n] || shadow[n] || !isGrey(n) || diff(i, n) >= 5 || Math.abs(px[n * 4 + 1] - bgAt(n)) > 30) continue;
      shadow[n] = 1; // fundo mais claro (vinheta) ou sombra mais escura
      stack.push(n);
    }
  }
  for (let i = 0; i < w * h; i++) {
    if (!shadow[i]) continue;
    const a = SM_clamp((bgAt(i) - px[i * 4 + 1] - 3) * 6, 0, 150);
    px[i * 4] = px[i * 4 + 1] = px[i * 4 + 2] = 0;
    px[i * 4 + 3] = a;
    bg[i] = 2;
  }

  // alfa com borda suave: píxeis de contorno ficam meio transparentes
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      if (bg[i] === 1) { px[i * 4 + 3] = 0; continue; }
      if (bg[i] === 2) continue;
      let near = 0;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx, ny = y + dy;
        if (nx >= 0 && ny >= 0 && nx < w && ny < h && bg[ny * w + nx] === 1) near++;
      }
      if (near) px[i * 4 + 3] = near >= 3 ? 90 : 170;
    }
  }
  return img;
}

const [, , input, output] = process.argv;
writePNG(output, cutout(readBMP(input)));
