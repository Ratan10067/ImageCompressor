const readline = require("readline");
const fileHandling = require("./file_handling");
const huffman = require("./huffman_coding");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question("Image Path: ", function (imagePath) {
  const imageBitString = fileHandling.readImageBitString(imagePath);
  const compressed = huffman.compress(imageBitString);
  fileHandling.writeImage(compressed, "IO/Outputs/compressed_image.bin");

  console.log(
    "Compression Ratio (CR):",
    imageBitString.length / compressed.length
  );

  const decompressed = huffman.decompress(compressed);
  fileHandling.writeImage(decompressed, "IO/Outputs/decompressed_image.jpg");
  rl.close();
});
