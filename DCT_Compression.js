// dct_compression.js
const fs = require("fs");
const sharp = require("sharp");
const { DCT, IDCT } = require("dct2");

// JPEG‑style quant matrix
function makeQuantMatrix(quality) {
  const Qbase = [
    [16, 11, 10, 16, 24, 40, 51, 61],
    [12, 12, 14, 19, 26, 58, 60, 55],
    [14, 13, 16, 24, 40, 57, 69, 56],
    [14, 17, 22, 29, 51, 87, 80, 62],
    [18, 22, 37, 56, 68, 109, 103, 77],
    [24, 35, 55, 64, 81, 104, 113, 92],
    [49, 64, 78, 87, 103, 121, 120, 101],
    [72, 92, 95, 98, 112, 100, 103, 99],
  ];
  const scale = quality < 50 ? 5000 / quality : 200 - quality * 2;
  return Qbase.map((row) =>
    row.map((v) => Math.max(1, Math.floor((v * scale + 50) / 100)))
  );
}

async function compressImageDCT(inputPath, outputPath, quality = 75) {
  const { data, info } = await sharp(inputPath)
    .greyscale()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const w = info.width,
    h = info.height,
    B = 8;
  const Q = makeQuantMatrix(quality);

  // pad to multiples of 8
  const w8 = Math.ceil(w / B) * B,
    h8 = Math.ceil(h / B) * B;
  const mat = Array.from({ length: h8 }, (_, y) =>
    Array.from({ length: w8 }, (_, x) => (y < h && x < w ? data[y * w + x] : 0))
  );

  const compressed = [];
  for (let by = 0; by < h8; by += B) {
    for (let bx = 0; bx < w8; bx += B) {
      // extract block
      const block = mat.slice(by, by + B).map((r) => r.slice(bx, bx + B));
      // forward 2D DCT
      const coeffs = DCT(block);
      // quantize
      const q = coeffs.map((row, i) =>
        row.map((c, j) => Math.round(c / Q[i][j]))
      );
      compressed.push(q);
    }
  }

  fs.writeFileSync(
    outputPath,
    JSON.stringify({ compressed, width: w8, height: h8, quality })
  );
  console.log("✅ DCT Compression Done");
}

async function decompressImageDCT(compressedPath, outputPath, quality = 75) {
  const {
    compressed,
    width: w8,
    height: h8,
  } = JSON.parse(fs.readFileSync(compressedPath, "utf8"));
  const B = 8,
    Q = makeQuantMatrix(quality);
  const mat = Array.from({ length: h8 }, () => Array(w8).fill(0));
  let k = 0;

  for (let by = 0; by < h8; by += B) {
    for (let bx = 0; bx < w8; bx += B) {
      // de‑quantize
      const deq = compressed[k].map((row, i) => row.map((c, j) => c * Q[i][j]));
      // inverse 2D DCT
      const block = IDCT(deq);

      // copy back
      for (let i = 0; i < B; i++) {
        for (let j = 0; j < B; j++) {
          const v = Math.round(block[i][j]);
          mat[by + i][bx + j] = Math.min(255, Math.max(0, v));
        }
      }
      k++;
    }
  }

  // flatten
  const flat = Buffer.from([].concat(...mat));
  await sharp(flat, { raw: { width: w8, height: h8, channels: 1 } }).toFile(
    outputPath
  );

  console.log("✅ DCT Decompression Done");
}

module.exports = { compressImageDCT, decompressImageDCT };
