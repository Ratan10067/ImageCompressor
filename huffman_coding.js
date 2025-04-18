const fileHandling = require("./file_handling");

class Node {
  constructor(frequency, symbol, left = null, right = null) {
    this.frequency = frequency;
    this.symbol = symbol;
    this.left = left;
    this.right = right;
    this.huffman_direction = "";
  }
}

const huffmanCodes = {};

function getFrequency(imageBitString) {
  const byteToFrequency = {};
  for (let i = 0; i < imageBitString.length; i += 8) {
    const byte = imageBitString.slice(i, i + 8);
    byteToFrequency[byte] = (byteToFrequency[byte] || 0) + 1;
  }
  return byteToFrequency;
}

function getMergedHuffmanTree(byteToFrequency) {
  const pq = Object.entries(byteToFrequency).map(
    ([byte, freq]) => new Node(freq, byte)
  );

  while (pq.length > 1) {
    pq.sort((a, b) => a.frequency - b.frequency);
    const left = pq.shift();
    const right = pq.shift();
    left.huffman_direction = "0";
    right.huffman_direction = "1";
    const merged = new Node(
      left.frequency + right.frequency,
      left.symbol + right.symbol,
      left,
      right
    );
    pq.push(merged);
  }

  return pq[0];
}

function calculateHuffmanCodes(node, code = "") {
  code += node.huffman_direction;
  if (node.left) calculateHuffmanCodes(node.left, code);
  if (node.right) calculateHuffmanCodes(node.right, code);
  if (!node.left && !node.right) huffmanCodes[node.symbol] = code;
  return huffmanCodes;
}

function getCompressedImage(imageBitString) {
  let compressed = "";
  for (let i = 0; i < imageBitString.length; i += 8) {
    const byte = imageBitString.slice(i, i + 8);
    compressed += huffmanCodes[byte];
  }
  return compressed;
}

function compress(imageBitString) {
  const freqMap = getFrequency(imageBitString);
  const tree = getMergedHuffmanTree(freqMap);
  calculateHuffmanCodes(tree);
  fileHandling.writeDictionaryFile(
    huffmanCodes,
    "./IO/Outputs/huffman_codes.txt"
  );
  return getCompressedImage(imageBitString);
}

function decompress(compressedBitString) {
  let decompressed = "";
  let current = "";
  for (let bit of compressedBitString) {
    current += bit;
    for (let [byte, code] of Object.entries(huffmanCodes)) {
      if (code === current) {
        decompressed += byte;
        current = "";
        break;
      }
    }
  }
  return decompressed;
}

module.exports = {
  compress,
  decompress,
};
