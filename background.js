// 监听扩展安装事件
chrome.runtime.onInstalled.addListener(() => {
  // 初始化存储
  chrome.storage.local.set({
    settings: {
      defaultStyle: 'style1'
    }
  });

  // 创建右键菜单
  chrome.contextMenus.create({
    id: "generateImage",
    title: "生成分享图片",
    contexts: ["selection"]
  });
});

// 处理右键菜单点击
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === "generateImage" && info.selectionText) {
    try {
      // 检查标签页是否存在
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tabs.length) {
        console.error('无法找到活动标签页');
        return;
      }

      // 尝试发送消息到content script
      await chrome.tabs.sendMessage(tab.id, {
        type: "showPopupWithText",
        text: info.selectionText
      });
    } catch (error) {
      console.error('发送消息到content script失败:', error);
      // 如果连接失败，尝试重新注入content script
      try {
        // 确保tab.id存在
        if (!tab.id) {
          throw new Error('无效的标签页ID');
        }
        // 使用chrome.scripting API重新注入content script
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['content.js']
        });
        // 等待一小段时间确保content script已加载
        await new Promise(resolve => setTimeout(resolve, 100));
        // 重试发送消息
        await chrome.tabs.sendMessage(tab.id, {
          type: "showPopupWithText",
          text: info.selectionText
        });
      } catch (retryError) {
        console.error('重试发送消息失败:', retryError);
        // 向用户显示错误信息
        chrome.action.setBadgeText({ text: '!' });
        chrome.action.setBadgeBackgroundColor({ color: '#FF0000' });
      }
    }
  }
});

// 监听来自content script的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'getSelectedText') {
    // 处理获取选中文本的请求
    chrome.tabs.sendMessage(sender.tab.id, { type: 'getSelection' }, (response) => {
      sendResponse(response);
    });
    return true;
  } else if (request.type === 'saveSelectedText') {
    // 处理保存选中文本的请求
    chrome.tabs.sendMessage(sender.tab.id, {
      type: 'showPopupWithText',
      text: request.text
    });
  }
});