// 全局变量
let currentStyle = 'style1';
let currentSize = '1:1';
let currentAlign = 'center';
let currentBgImage = null;
let generatedImage = null;

// DOM 元素
const textInput = document.getElementById('textInput');
const generateBtn = document.getElementById('generateBtn');
const downloadBtn = document.getElementById('downloadBtn');
const shareBtn = document.getElementById('shareBtn');
const imagePreview = document.getElementById('imagePreview');
const styleItems = document.querySelectorAll('.style-item');
const sizeButtons = document.querySelectorAll('.size-btn');
const layoutButtons = document.querySelectorAll('.layout-btn');
const fontFamily = document.getElementById('fontFamily');
const fontColor = document.getElementById('fontColor');
const fontSize = document.getElementById('fontSize');
const lineHeight = document.getElementById('lineHeight');
const bgUpload = document.getElementById('bgUpload');
const resetBgBtn = document.getElementById('resetBgBtn');

// 样式模板配置
const styleConfigs = {
  style1: {
    background: '#f8f9fa',
    textColor: '#212529',
    fontFamily: 'Arial',
    watermark: '@Stanley'
  },
  style2: {
    background: '#212529',
    textColor: '#f8f9fa',
    fontFamily: 'Georgia',
    watermark: '@Stanley'
  },
  style3: {
    background: '#e9ecef',
    textColor: '#495057',
    fontFamily: 'Verdana',
    watermark: '@Stanley'
  }
};

// 尺寸配置
const sizeConfigs = {
  '1:1': { width: 800, height: 800 },
  '16:9': { width: 1600, height: 900 },
  '9:16': { width: 900, height: 1600 },
  '18.5:9': { width: 1850, height: 900 }
};

// 初始化事件监听
function initEventListeners() {
  // 监听来自background的消息
  chrome.runtime.onMessage.addListener((request) => {
    if (request.type === 'showPopupWithText' && request.text) {
      textInput.value = request.text;
      generateImage();
    }
  });

  // 样式选择
  styleItems.forEach(item => {
    item.addEventListener('click', () => {
      styleItems.forEach(i => i.classList.remove('active'));
      item.classList.add('active');
      currentStyle = item.dataset.style;
      if (textInput.value) {
        generateImage();
      }
    });
  });

  // 尺寸选择
  sizeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      sizeButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentSize = btn.dataset.size;
      if (textInput.value) {
        generateImage();
      }
    });
  });

  // 排版控制
  layoutButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      layoutButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentAlign = btn.dataset.align;
      if (textInput.value) {
        generateImage();
      }
    });
  });

  // 字体设置
  [fontFamily, fontColor, fontSize, lineHeight].forEach(control => {
    control.addEventListener('change', () => {
      if (textInput.value) {
        generateImage();
      }
    });
  });

  // 背景图片上传
  bgUpload.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          currentBgImage = img;
          if (textInput.value) {
            generateImage();
          }
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    }
  });

  // 重置背景
  resetBgBtn.addEventListener('click', () => {
    currentBgImage = null;
    bgUpload.value = '';
    if (textInput.value) {
      generateImage();
    }
  });

  // 生成图片
  generateBtn.addEventListener('click', generateImage);

  // 下载图片
  downloadBtn.addEventListener('click', downloadImage);

  // 分享到剪贴板
  shareBtn.addEventListener('click', shareToClipboard);

  // 文本输入监听
  textInput.addEventListener('input', () => {
    const hasText = textInput.value.trim().length > 0;
    generateBtn.disabled = !hasText;
  });
}

// 生成图片
async function generateImage() {
  const text = textInput.value.trim();
  if (!text) return;

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  // 设置画布尺寸
  const size = sizeConfigs[currentSize];
  canvas.width = size.width;
  canvas.height = size.height;

  // 绘制背景
  if (currentBgImage) {
    ctx.drawImage(currentBgImage, 0, 0, canvas.width, canvas.height);
  } else {
    const style = styleConfigs[currentStyle];
    ctx.fillStyle = style.background;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  // 设置文本样式
  ctx.fillStyle = fontColor.value;
  ctx.font = `${fontSize.value}px ${fontFamily.value}`;
  ctx.textAlign = currentAlign;
  ctx.textBaseline = 'middle';

  // 文本换行处理
  const maxWidth = canvas.width * 0.8;
  const lineSpacing = parseFloat(lineHeight.value);
  const lines = text.split('\n');
  const formattedLines = [];

  lines.forEach(line => {
    // 处理每行的缩进
    const indentMatch = line.match(/^(\s+)/);
    const indent = indentMatch ? indentMatch[1].length * 8 : 0; // 假设每个空格8像素

    // 处理超出宽度的行
    let remainingText = line;
    while (remainingText.length > 0) {
      const metrics = ctx.measureText(remainingText);
      if (metrics.width + indent <= maxWidth) {
        formattedLines.push({ text: remainingText, indent });
        break;
      }

      // 查找合适的断点
      let breakPoint = remainingText.length;
      while (breakPoint > 0) {
        const testText = remainingText.substring(0, breakPoint);
        const testMetrics = ctx.measureText(testText);
        if (testMetrics.width + indent <= maxWidth) {
          formattedLines.push({ text: testText, indent });
          remainingText = remainingText.substring(breakPoint);
          break;
        }
        breakPoint--;
      }

      if (breakPoint === 0) {
        formattedLines.push({ text: remainingText, indent });
        break;
      }
    }
  });


  // 绘制文本
  const totalHeight = formattedLines.length * fontSize.value * lineSpacing;
  const startY = (canvas.height - totalHeight) / 2;
  let y = startY;

  formattedLines.forEach(line => {
    let x;
    switch (currentAlign) {
      case 'left':
        x = canvas.width * 0.1 + line.indent;
        break;
      case 'right':
        x = canvas.width * 0.9;
        break;
      default: // center
        x = canvas.width / 2;
    }
    ctx.fillText(line.text, x, y + fontSize.value / 2);
    y += fontSize.value * lineSpacing;
  });

  // 添加水印
  const style = styleConfigs[currentStyle];
  ctx.font = '14px Arial';
  ctx.fillStyle = fontColor.value;
  ctx.textAlign = 'right';
  ctx.fillText(style.watermark, canvas.width - 20, canvas.height - 20);

  // 更新预览
  imagePreview.innerHTML = '';
  const img = document.createElement('img');
  img.src = canvas.toDataURL('image/png');
  img.style.width = '100%';
  img.style.height = '100%';
  img.style.objectFit = 'contain';
  imagePreview.appendChild(img);

  // 保存生成的图片
  generatedImage = canvas.toDataURL('image/png');
  downloadBtn.disabled = false;
  shareBtn.disabled = false;
}

// 下载图片
function downloadImage() {
  if (!generatedImage) return;

  // 获取当前日期时间并格式化
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  const timestamp = `${year}${month}${day}_${hours}${minutes}${seconds}`;

  const link = document.createElement('a');
  link.download = `awesome_${timestamp}.png`;
  link.href = generatedImage;
  link.click();
}

// 分享到剪贴板
async function shareToClipboard() {
  if (!generatedImage) return;

  try {
    const response = await fetch(generatedImage);
    const blob = await response.blob();
    await navigator.clipboard.write([
      new ClipboardItem({
        [blob.type]: blob
      })
    ]);
    alert('图片已复制到剪贴板');
  } catch (err) {
    console.error('复制到剪贴板失败:', err);
    alert('复制到剪贴板失败');
  }
}

// 初始化
initEventListeners();