const fs = require("fs");
const sharp = require("sharp"); // npm i sharp

async function compressImageDPCM(inputPath, outputPath) {
  const { data, info } = await sharp(inputPath).greyscale().raw().toBuffer({ resolveWithObject: true });

  const width = info.width;
  const height = info.height;
  const pixels = data;

  let compressed = [];
  let previousPixel = 0;

  for (let i = 0; i < pixels.length; i++) {
    const diff = pixels[i] - previousPixel;
    compressed.push(diff);
    previousPixel = pixels[i];
  }

  // Save the compressed data as JSON for simplicity
  fs.writeFileSync(outputPath, JSON.stringify({ compressed, width, height }));
  console.log("✅ DPCM Compression Done");
}

async function decompressImageDPCM(compressedPath, outputPath) {
  const { compressed, width, height } = JSON.parse(fs.readFileSync(compressedPath, "utf8"));

  let decompressed = [];
  let previousPixel = 0;

  for (let i = 0; i < compressed.length; i++) {
    const pixel = previousPixel + compressed[i];
    decompressed.push(pixel);
    previousPixel = pixel;
  }

  const buffer = Buffer.from(decompressed.map((v) => Math.max(0, Math.min(255, v))));
  await sharp(buffer, { raw: { width, height, channels: 1 } }).toFile(outputPath);

  console.log("✅ DPCM Decompression Done");
}

module.exports = {
  compressImageDPCM,
  decompressImageDPCM,
};
