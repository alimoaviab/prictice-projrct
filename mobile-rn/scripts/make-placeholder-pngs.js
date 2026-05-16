/**
 * Generates valid 1024x1024 placeholder PNGs for the launcher icon and
 * splash. Uses Node's built-in zlib + a minimal hand-rolled PNG encoder so
 * we don't need to add an extra dependency just for build-time assets.
 *
 * Run with: node scripts/make-placeholder-pngs.js
 */

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

function crc32(buf) {
  let crc = ~0;
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i];
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
  }
  return ~crc >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crc]);
}

function makePng(width, height, rgb) {
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;   // bit depth
  ihdr[9] = 2;   // colour type 2 = truecolor RGB
  ihdr[10] = 0;  // compression
  ihdr[11] = 0;  // filter
  ihdr[12] = 0;  // interlace

  // IDAT — raw scanlines, each prefixed with filter byte 0
  const row = Buffer.alloc(1 + width * 3);
  for (let x = 0; x < width; x++) {
    row[1 + x * 3] = rgb[0];
    row[2 + x * 3] = rgb[1];
    row[3 + x * 3] = rgb[2];
  }
  const raw = Buffer.alloc(height * row.length);
  for (let y = 0; y < height; y++) row.copy(raw, y * row.length);
  const idatData = zlib.deflateSync(raw);

  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', idatData),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

const outDir = path.join(__dirname, '..', 'assets', 'images');
fs.mkdirSync(outDir, { recursive: true });

// Brand navy for adaptive-icon foreground area, brand blue for icon, white for splash.
fs.writeFileSync(path.join(outDir, 'icon.png'),          makePng(1024, 1024, [0x25, 0x63, 0xeb])); // #2563EB
fs.writeFileSync(path.join(outDir, 'adaptive-icon.png'), makePng(1024, 1024, [0xff, 0xff, 0xff])); // white foreground
fs.writeFileSync(path.join(outDir, 'splash.png'),        makePng(1024, 1024, [0xff, 0xff, 0xff])); // white splash

console.log('Placeholder PNGs written to', outDir);
