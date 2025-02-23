// 监听扩展安装事件
chrome.runtime.onInstalled.addListener(() => {
  // 初始化存储
  chrome.storage.local.set({
    settings: {
      defaultStyle: 'style1'
    }
  });
});

// 监听来自content script的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'getSelectedText') {
    // 处理获取选中文本的请求
    chrome.tabs.sendMessage(sender.tab.id, { type: 'getSelection' }, (response) => {
      sendResponse(response);
    });
    return true;
  }
});