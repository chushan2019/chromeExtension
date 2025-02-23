// 全局变量
let currentStyle = 'style1';
let generatedImage = null;

// DOM 元素
const textInput = document.getElementById('textInput');
const generateBtn = document.getElementById('generateBtn');
const downloadBtn = document.getElementById('downloadBtn');
const shareBtn = document.getElementById('shareBtn');
const imagePreview = document.getElementById('imagePreview');
const styleItems = document.querySelectorAll('.style-item');

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

// 初始化事件监听
function initEventListeners() {
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
  canvas.width = 800;
  canvas.height = 1000;

  // 获取当前样式配置
  const style = styleConfigs[currentStyle];

  // 绘制背景
  ctx.fillStyle = style.background;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 设置文本样式
  ctx.fillStyle = style.textColor;
  ctx.font = `24px ${style.fontFamily}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // 文本换行处理
  const words = text.split('');
  const lines = [];
  let currentLine = '';
  const maxWidth = canvas.width - 100;

  for (const word of words) {
    const testLine = currentLine + word;
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  lines.push(currentLine);

  // 绘制文本
  const lineHeight = 36;
  const totalHeight = lines.length * lineHeight;
  const startY = (canvas.height - totalHeight) / 2;

  lines.forEach((line, index) => {
    ctx.fillText(line, canvas.width / 2, startY + index * lineHeight);
  });

  // 添加水印
  ctx.font = '16px Arial';
  ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
  ctx.textAlign = 'right';
  ctx.fillText(style.watermark, canvas.width - 20, canvas.height - 20);

  // 更新预览
  generatedImage = canvas.toDataURL('image/png');
  imagePreview.innerHTML = `<img src="${generatedImage}" style="width: 100%; height: 100%; object-fit: contain;">`;

  // 启用下载和分享按钮
  downloadBtn.disabled = false;
  shareBtn.disabled = false;
}

// 下载图片
function downloadImage() {
  if (!generatedImage) return;

  const link = document.createElement('a');
  link.download = '金句图片.png';
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
    alert('图片已复制到剪贴板！');
  } catch (err) {
    console.error('复制到剪贴板失败：', err);
    alert('复制到剪贴板失败，请重试！');
  }
}

// 初始化
document.addEventListener('DOMContentLoaded', initEventListeners);