const path = require("path");
const {
  compressImageDPCM,
  decompressImageDPCM,
} = require("./DPCM_Compression");

(async () => {
  const inputPath = path.join(__dirname, "IO", "Inputs", "Cat.jpg");
  const compressedPath = path.join(
    __dirname,
    "IO",
    "Outputs",
    "dpcm_compressed.json"
  );
  const decompressedPath = path.join(
    __dirname,
    "IO",
    "Outputs",
    "dpcm_decompressed.jpg"
  );

  await compressImageDPCM(inputPath, compressedPath);
  await decompressImageDPCM(compressedPath, decompressedPath);
})();
