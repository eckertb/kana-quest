// Generates PNG icons for the PWA (no external deps).
const zlib = require('zlib');
const fs = require('fs');

// ---- PNG helpers ----
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(buf) {
  let c = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xFF] ^ (c >>> 8);
  return (c ^ 0xFFFFFFFF) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}
function encodePNG(width, height, rgba) {
  const sig = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 6;  // color type RGBA
  ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (width * 4 + 1)] = 0; // filter none
    rgba.copy(raw, y * (width * 4 + 1) + 1, y * width * 4, (y + 1) * width * 4);
  }
  const idat = zlib.deflateSync(raw, { level: 9 });
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0))]);
}

// ---- SDF helpers ----
function sdfRoundedRect(x, y, x0, y0, x1, y1, r) {
  const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
  const hw = (x1 - x0) / 2, hh = (y1 - y0) / 2;
  const qx = Math.abs(x - cx) - (hw - r);
  const qy = Math.abs(y - cy) - (hh - r);
  const dx = Math.max(qx, 0), dy = Math.max(qy, 0);
  return Math.sqrt(dx * dx + dy * dy) + Math.min(Math.max(qx, qy), 0) - r;
}
function sdfCircle(x, y, cx, cy, r) {
  return Math.sqrt((x - cx) ** 2 + (y - cy) ** 2) - r;
}

function render(size, opts) {
  const { bgRadius, tileSize, tileRadius } = opts;
  const buf = Buffer.alloc(size * size * 4);
  const SS = 3;
  const start = [99, 102, 241];   // #6366f1
  const end = [168, 85, 247];     // #a855f7
  const red = [225, 29, 72];      // #e11d48
  const white = [255, 255, 255];

  const tileHalf = tileSize / 2;
  const cx = size / 2, cy = size / 2;
  const circleR = tileSize * 0.3;

  for (let py = 0; py < size; py++) {
    for (let px = 0; px < size; px++) {
      let r = 0, g = 0, b = 0, a = 0;
      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const x = px + (sx + 0.5) / SS;
          const y = py + (sy + 0.5) / SS;

          // background gradient (rounded, transparent corners)
          if (sdfRoundedRect(x, y, 0, 0, size, size, bgRadius) <= 0) {
            const t = (x + y) / (2 * size);
            r += start[0] + (end[0] - start[0]) * t;
            g += start[1] + (end[1] - start[1]) * t;
            b += start[2] + (end[2] - start[2]) * t;
            a += 255;

            // white tile
            if (sdfRoundedRect(x, y, cx - tileHalf, cy - tileHalf, cx + tileHalf, cy + tileHalf, tileRadius) <= 0) {
              r += (white[0] - (start[0] + (end[0] - start[0]) * t));
              g += (white[1] - (start[1] + (end[1] - start[1]) * t));
              b += (white[2] - (start[2] + (end[2] - start[2]) * t));
              // red circle
              if (sdfCircle(x, y, cx, cy, circleR) <= 0) {
                r += red[0] - white[0];
                g += red[1] - white[1];
                b += red[2] - white[2];
              }
            }
          }
        }
      }
      const n = SS * SS;
      const i = (py * size + px) * 4;
      buf[i] = Math.round(r / n);
      buf[i + 1] = Math.round(g / n);
      buf[i + 2] = Math.round(b / n);
      buf[i + 3] = Math.round(a / n);
    }
  }
  return buf;
}

const dir = __dirname + '/icons';
fs.mkdirSync(dir, { recursive: true });

fs.writeFileSync(dir + '/icon-192.png', encodePNG(192, 192, render(192, { bgRadius: 42, tileSize: 120, tileRadius: 27 })));
fs.writeFileSync(dir + '/icon-512.png', encodePNG(512, 512, render(512, { bgRadius: 112, tileSize: 320, tileRadius: 72 })));
// Maskable: full-bleed background (no rounded corners) so the OS mask looks right
fs.writeFileSync(dir + '/icon-maskable-512.png', encodePNG(512, 512, render(512, { bgRadius: 0, tileSize: 320, tileRadius: 72 })));

console.log('Icons written.');
