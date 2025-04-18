// main.js
const path = require("path");
const { compressImage, decompressImage } = require("./compressionPipeline");

(async () => {
  const INPUT = path.join(__dirname, "IO", "Inputs", "Cat.jpg");
  const COMP = path.join(__dirname, "IO", "Outputs", "cat.dctjson");
  const RECON = path.join(__dirname, "IO", "Outputs", "cat_recon.jpg");

  // pick quality 1–100
  const QUALITY = 5;

  // 1) compress
  await compressImage(INPUT, COMP, QUALITY);

  // 2) decompress
  await decompressImage(COMP, RECON);
})();
