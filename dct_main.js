// dct_main.js
const path = require("path");
const { compressImageDCT, decompressImageDCT } = require("./DCT_Compression");

(async () => {
  const inputPath = path.join(__dirname, "IO", "Inputs", "Cat.jpg");
  const compressedPath = path.join(
    __dirname,
    "IO",
    "Outputs",
    "dct_compressed.json"
  );
  const decompressedPath = path.join(
    __dirname,
    "IO",
    "Outputs",
    "dct_decompressed.jpg"
  );
  const quality = 10;

  await compressImageDCT(inputPath, compressedPath, quality);
  await decompressImageDCT(compressedPath, decompressedPath, quality);
})();
