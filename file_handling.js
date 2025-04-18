const fs = require("fs");

function readImageBitString(path) {
  console.log(path);
  const buffer = fs.readFileSync(path);
  let bitString = "";
  for (let byte of buffer) {
    let bits = byte.toString(2).padStart(8, "0");
    bitString += bits;
  }
  return bitString;
}

function writeImage(bitString, path) {
  const bytes = [];
  for (let i = 0; i < bitString.length; i += 8) {
    const byte = bitString.slice(i, i + 8);
    bytes.push(parseInt(byte, 2));
  }
  const buffer = Buffer.from(bytes);
  fs.writeFileSync(path, buffer);
}

function writeDictionaryFile(dictionary, path) {
  const lines = Object.entries(dictionary)
    .map(([key, value]) => `${key}:${value}`)
    .join("\n");
  fs.writeFileSync(path, lines);
}

module.exports = {
  readImageBitString,
  writeImage,
  writeDictionaryFile,
};
