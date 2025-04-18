// compressionPipeline.js
const fs = require("fs");
const sharp = require("sharp");
const { DCT, IDCT } = require("dct2");
const blockSize = 8;

// Standard JPEG quant matrix
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

//–– Quant matrix generator ––
function makeQuantMatrix(quality) {
  const scale = quality < 50 ? 5000 / quality : 200 - quality * 2;
  return Qbase.map((row) =>
    row.map((v) => Math.max(1, Math.floor((v * scale + 50) / 100)))
  );
}

//–– Precompute zig‑zag index order for an 8×8 block ––
const zigzagIndex = (() => {
  const coords = [];
  let up = true;
  for (let sum = 0; sum <= 14; sum++) {
    if (up) {
      for (let i = 0; i <= sum; i++) {
        const j = sum - i;
        if (i < 8 && j < 8) coords.push([i, j]);
      }
    } else {
      for (let j = 0; j <= sum; j++) {
        const i = sum - j;
        if (i < 8 && j < 8) coords.push([i, j]);
      }
    }
    up = !up;
  }
  return coords;
})();

//–– Flatten an 8×8 to 1‑D via zig‑zag ––
function zigzagFlatten(block) {
  return zigzagIndex.map(([i, j]) => block[i][j]);
}

//–– Reconstruct 8×8 from a zig‑zag array ––
function zigzagUnflatten(arr) {
  const block = Array.from({ length: 8 }, (_) => Array(8).fill(0));
  zigzagIndex.forEach(([i, j], k) => (block[i][j] = arr[k]));
  return block;
}

//–– RLE encode a 1‑D array ––
function rleEncode(arr) {
  const out = [];
  let run = 1;
  for (let i = 1; i < arr.length; i++) {
    if (arr[i] === arr[i - 1]) run++;
    else {
      out.push([arr[i - 1], run]);
      run = 1;
    }
  }
  out.push([arr[arr.length - 1], run]);
  return out;
}

//–– RLE decode back to 1‑D ––
function rleDecode(pairs) {
  const out = [];
  pairs.forEach(([val, run]) => {
    for (let k = 0; k < run; k++) out.push(val);
  });
  return out;
}

//–– Build a trivial “Huffman” codebook from the set of values ––
function buildCodebook(pairs) {
  // collect frequencies
  const freq = new Map();
  pairs.flat().forEach(([val, count]) => {
    freq.set(val, (freq.get(val) || 0) + count);
  });
  // sort descending
  const symbols = [...freq.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([val]) => val);
  // assign each symbol a unique binary string = its index in base‑2
  const codebook = {};
  symbols.forEach((val, i) => {
    codebook[val] = i.toString(2);
  });
  // also build inverse
  const inverse = Object.fromEntries(
    Object.entries(codebook).map(([v, code]) => [code, parseInt(v, 10)])
  );
  return { codebook, inverse };
}

//–– Main compression function ––
async function compressImage(inputPath, outputJSON, quality = 75) {
  const { data, info } = await sharp(inputPath)
    .greyscale()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const w = info.width,
    h = info.height;
  const w8 = Math.ceil(w / blockSize) * blockSize;
  const h8 = Math.ceil(h / blockSize) * blockSize;
  const Q = makeQuantMatrix(quality);

  // pad to multiples of 8
  const M = Array.from({ length: h8 }, (_, y) =>
    Array.from({ length: w8 }, (_, x) => (y < h && x < w ? data[y * w + x] : 0))
  );

  // STEP 1–4: DCT → Quantize → Zigzag → RLE
  const allRLE = [];
  for (let by = 0, k = 0; by < h8; by += blockSize) {
    for (let bx = 0; bx < w8; bx += blockSize, k++) {
      // extract
      const block = M.slice(by, by + 8).map((r) => r.slice(bx, bx + 8));
      // DCT
      const coeff = DCT(block);
      // quantize
      const qblk = coeff.map((row, i) =>
        row.map((c, j) => Math.round(c / Q[i][j]))
      );
      // zig‑zag + RLE
      const zz = zigzagFlatten(qblk);
      const rle = rleEncode(zz);
      allRLE.push(rle);
    }
  }

  // STEP 5: build codebook + encode
  const { codebook, inverse } = buildCodebook(allRLE);
  const encoded = allRLE.map((rle) =>
    rle.map(([val, run]) => ({
      code: codebook[val],
      run,
    }))
  );

  // write out a single JSON
  fs.writeFileSync(
    outputJSON,
    JSON.stringify(
      {
        width: w,
        height: h,
        width8: w8,
        height8: h8,
        quality,
        codebook,
        encoded,
      },
      null,
      2
    )
  );
  console.log("✅ Compression complete:", outputJSON);
}

//–– Main decompression function ––
async function decompressImage(inputJSON, outputImage) {
  const {
    width: w,
    height: h,
    width8: w8,
    height8: h8,
    quality,
    codebook: cb,
    encoded,
  } = JSON.parse(fs.readFileSync(inputJSON, "utf8"));
  const Q = makeQuantMatrix(quality);

  // invert codebook
  const inverse = Object.fromEntries(
    Object.entries(cb).map(([val, code]) => [code, Number(val)])
  );

  // reconstruct matrix
  const M = Array.from({ length: h8 }, () => Array(w8).fill(0));
  let idx = 0;
  for (let by = 0; by < h8; by += 8) {
    for (let bx = 0; bx < w8; bx += 8) {
      const rle = encoded[idx++];
      // decode Huffman→RLE pairs
      const pairs = rle.map(({ code, run }) => [inverse[code], run]);
      // recover 64‑long zigzag array
      const zz = rleDecode(pairs);
      // un‑zigzag → quant block
      const qblk = zigzagUnflatten(zz);
      // dequantize
      const coeff = qblk.map((row, i) => row.map((c, j) => c * Q[i][j]));
      // inverse DCT → spatial block
      const block = IDCT(coeff);
      // copy back (clamp)
      for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
          const v = Math.round(block[i][j]);
          M[by + i][bx + j] = Math.min(255, Math.max(0, v));
        }
      }
    }
  }

  // flatten and trim to original size
  const flat = Buffer.from([].concat(...M).slice(0, h8 * w8)).filter((_, i) => {
    const y = Math.floor(i / w8);
    const x = i % w8;
    return x < w && y < h;
  });

  await sharp(flat, { raw: { width: w, height: h, channels: 1 } }).toFile(
    outputImage
  );
  console.log("✅ Decompression complete:", outputImage);
}

module.exports = { compressImage, decompressImage };
