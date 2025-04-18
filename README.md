# Image Compression System

A JavaScript implementation of DCT-based image compression with additional compression techniques including DPCM and Huffman coding.


## Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/ImageCompressor.git
cd ImageCompressor
```

2. Install dependencies:

```bash
npm install sharp dct2
```

## Project Structure

```
ImageCompressor/
├── DCT_Compression.js
├── compressionPipeline.js
├── file_handling.js
├── huffman_coding.js
├── main.js
├── pipeline_main.js
└── IO/
    ├── Inputs/
    └── Outputs/
```

## Usage

### 1. Huffman Compression

```bash
node main.js
```

When prompted, enter the path to your input image.

### 2. DCT Pipeline Compression

```bash
node pipeline_main.js
```

### Configuration

You can adjust compression quality in `pipeline_main.js`:

```javascript
const QUALITY = 5; // Range: 1-100 (lower = more compression)
```

## Input/Output

- Place input images in `IO/Inputs/`
- Compressed and decompressed files will be saved in `IO/Outputs/`

### Output Files

- `compressed_image.bin` - Huffman compressed binary
- `decompressed_image.jpg` - Reconstructed image
- `huffman_codes.txt` - Huffman coding dictionary
- `cat.dctjson` - DCT compressed data
- `cat_recon.jpg` - DCT reconstructed image

## Compression Methods

1. **DCT (Discrete Cosine Transform)**

   - Similar to JPEG compression
   - Converts image blocks to frequency domain
   - Quality-adjustable quantization

2. **Huffman Coding**
   - Variable-length prefix coding
   - Lossless compression
   - Generates optimal binary codes

## Performance

Compression ratio depends on:

- Input image complexity
- Selected quality level
- Compression method used
