// 监听来自background script的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'getSelection') {
    // 获取当前选中的文本
    const selectedText = window.getSelection().toString().trim();
    sendResponse({ text: selectedText });
  }
});

// 添加右键菜单选项
document.addEventListener('mouseup', () => {
  const selectedText = window.getSelection().toString().trim();
  if (selectedText) {
    chrome.runtime.sendMessage({
      type: 'getSelectedText',
      text: selectedText
    });
  }
});