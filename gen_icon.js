const fs = require('fs');

// 创建 128x128 的 PNG 图标
// 天蓝色背景 (#4FC3F7)，红色文字 "OC32 ASM"
// 使用简单的 PNG 生成（不依赖外部库）

const width = 128;
const height = 128;
const colorDepth = 3; // RGB

// 创建 PNG 二进制数据
function createPNG() {
  // PNG 签名
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);  // width
  ihdrData.writeUInt32BE(height, 4); // height
  ihdrData[8] = 8;  // bit depth
  ihdrData[9] = 2;  // color type (RGB)
  ihdrData[10] = 0; // compression
  ihdrData[11] = 0; // filter
  ihdrData[12] = 0; // interlace

  // 图像数据 - 天蓝色背景
  const rawData = Buffer.alloc(width * height * (colorDepth + 1)); // +1 for filter byte
  for (let i = 0; i < height; i++) {
    for (let j = 0; j < width; j++) {
      const offset = i * width * (colorDepth + 1) + j * (colorDepth + 1);
      rawData[offset] = 0; // filter byte (none)
      rawData[offset + 1] = 0x4F; // R - 天蓝
      rawData[offset + 2] = 0xC3; // G
      rawData[offset + 3] = 0xF7; // B
    }
  }

  // 定义文字颜色 (深红色 #E53935)
  const textColorR = 0xE5;
  const textColorG = 0x39;
  const textColorB = 0x35;

  // 简单绘制文字 "OC32" (8x16 点阵字体)
  const font8x16 = {
    'O': [
      0x3C, 0x42, 0x81, 0x81, 0x81, 0x81, 0x42, 0x3C
    ],
    'C': [
      0x3C, 0x40, 0x80, 0x80, 0x80, 0x80, 0x40, 0x3C
    ],
    '3': [
      0x7C, 0x82, 0x02, 0x3C, 0x02, 0x82, 0x42, 0x7C
    ],
    '2': [
      0x7C, 0x82, 0x01, 0x7E, 0x40, 0x20, 0x10, 0x7C
    ],
    'A': [
      0x18, 0x3C, 0x3C, 0x7E, 0x44, 0x44, 0x44, 0x44
    ],
    'S': [
      0x7E, 0x40, 0x40, 0x7E, 0x02, 0x02, 0x02, 0x7C
    ],
    'M': [
      0x41, 0x61, 0x51, 0x49, 0x45, 0x45, 0x45, 0x45
    ],
    ' ': [
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00
    ]
  };

  // 绘制大字体 (8x16 放大 3x)
  function drawChar(char, x, y, scale = 3) {
    const bits = font8x16[char];
    if (!bits) return;
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        if (bits[row] & (0x80 >> col)) {
          for (let sy = 0; sy < scale; sy++) {
            for (let sx = 0; sx < scale; sx++) {
              const px = x + col * scale + sx;
              const py = y + row * scale + sy;
              if (px >= 0 && px < width && py >= 0 && py < height) {
                const offset = py * width * (colorDepth + 1) + px * (colorDepth + 1);
                rawData[offset + 1] = textColorR;
                rawData[offset + 2] = textColorG;
                rawData[offset + 3] = textColorB;
              }
            }
          }
        }
      }
    }
  }

  // 绘制 "OC32" 在大字区域
  drawChar('O', 20, 10, 3);
  drawChar('C', 44, 10, 3);
  drawChar('3', 68, 10, 3);
  drawChar('2', 92, 10, 3);

  // 绘制 "ASM" 在底部 (使用 2x 缩放)
  drawChar('A', 24, 64, 2);
  drawChar('S', 48, 64, 2);
  drawChar('M', 72, 64, 2);

  // 添加二进制背景图案 (淡白色点)
  const binaryChars = ['0', '1'];
  const binaryFont = {
    '0': [0x00, 0x3C, 0x42, 0x81, 0x81, 0x42, 0x3C, 0x00],
    '1': [0x00, 0x10, 0x30, 0x10, 0x10, 0x10, 0x38, 0x00]
  };

  function drawBinary(char, x, y, scale = 1) {
    const bits = binaryFont[char];
    if (!bits) return;
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        if (bits[row] & (0x80 >> col)) {
          for (let sy = 0; sy < scale; sy++) {
            for (let sx = 0; sx < scale; sx++) {
              const px = x + col * scale + sx;
              const py = y + row * scale + sy;
              if (px >= 0 && px < width && py >= 0 && py < height) {
                const offset = py * width * (colorDepth + 1) + px * (colorDepth + 1);
                rawData[offset + 1] = 0xF5; // 淡白色
                rawData[offset + 2] = 0xF5;
                rawData[offset + 3] = 0xF5;
              }
            }
          }
        }
      }
    }
  }

  // 在角落绘制二进制背景
  drawBinary('0', 2, 2, 2);
  drawBinary('1', 2, 28, 2);
  drawBinary('0', 2, 54, 2);
  drawBinary('1', 2, 80, 2);
  drawBinary('0', 2, 106, 2);
  drawBinary('1', 100, 2, 2);
  drawBinary('0', 100, 28, 2);
  drawBinary('1', 100, 54, 2);
  drawBinary('0', 100, 80, 2);
  drawBinary('1', 100, 106, 2);

  // 压缩图像数据 (使用 deflate)
  const zlib = require('zlib');
  const compressed = zlib.deflateSync(rawData);

  // 创建 chunks
  function createChunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeBuf = Buffer.from(type);
    const crcData = Buffer.concat([typeBuf, data]);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(crcData), 0);
    return Buffer.concat([len, typeBuf, data, crc]);
  }

  // CRC32 计算
  function crc32(buf) {
    let crc = 0xFFFFFFFF;
    for (let i = 0; i < buf.length; i++) {
      crc ^= buf[i];
      for (let j = 0; j < 8; j++) {
        crc = (crc >>> 1) ^ (crc & 1 ? 0xEDB88320 : 0);
      }
    }
    return (crc ^ 0xFFFFFFFF) >>> 0;
  }

  // 组装 PNG
  const ihdr = createChunk('IHDR', ihdrData);
  const idat = createChunk('IDAT', compressed);
  const iend = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdr, idat, iend]);
}

const pngBuffer = createPNG();
fs.writeFileSync('icon.png', pngBuffer);
console.log('图标已生成: icon.png (' + pngBuffer.length + ' bytes)');
