// 监听来自background script的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // 保持消息通道开放以便异步响应
  try {
    if (!chrome.runtime?.id) {
      console.warn('扩展上下文无效');
      return false;
    }

    switch (request.type) {
      case 'getSelection':
        const selectedText = window.getSelection().toString().trim();
        sendResponse({ text: selectedText });
        return true;
      case 'showPopupWithText':
        // 处理显示弹窗的消息
        if (request.text) {
          console.log('接收到文本：', request.text);
        }
        return true;
      default:
        console.warn('未知的消息类型：', request.type);
        return false;
    }
  } catch (error) {
    console.error('消息处理出错：', error);
    return false;
  }
});

// 添加右键菜单选项
document.addEventListener('mouseup', () => {
  try {
    if (!chrome.runtime?.id) {
      console.warn('扩展上下文无效');
      return;
    }

    const selectedText = window.getSelection().toString().trim();
    if (selectedText) {
      chrome.runtime.sendMessage({
        type: 'getSelectedText',
        text: selectedText
      }).catch(error => {
        if (error.message.includes('Extension context invalidated')) {
          console.warn('扩展上下文已失效');
        } else {
          console.error('发送消息失败：', error);
        }
      });
    }
  } catch (error) {
    console.error('处理选中文本出错：', error);
  }
});

// 添加浮动按钮逻辑
let floatingBtn = null;
let isCreatingBtn = false;
let clickOutsideHandler = null;

// 创建浮动按钮的函数
function createFloatingButton(e, selection) {
  // 创建浮动按钮
  floatingBtn = document.createElement('div');
  floatingBtn.textContent = '生成金句';
  Object.assign(floatingBtn.style, {
    position: 'absolute',
    left: `${e.pageX + 10}px`,
    top: `${e.pageY + 10}px`,
    background: '#2196F3',
    color: 'white',
    padding: '8px 16px',
    borderRadius: '4px',
    cursor: 'pointer',
    zIndex: 999999,
    boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
    userSelect: 'none',
    transition: 'background-color 0.2s'
  });

  // 添加悬停效果
  floatingBtn.addEventListener('mouseover', () => {
    floatingBtn.style.background = '#1976D2';
  });

  floatingBtn.addEventListener('mouseout', () => {
    floatingBtn.style.background = '#2196F3';
  });

  // 点击事件处理
  floatingBtn.addEventListener('click', async () => {
    try {
      if (!chrome.runtime?.id) {
        console.warn('扩展上下文无效');
        removeFloatingButton();
        return;
      }

      await chrome.runtime.sendMessage({
        type: 'saveSelectedText',
        text: selection
      });
      removeFloatingButton();
    } catch (error) {
      if (error.message.includes('Extension context invalidated')) {
        console.warn('扩展上下文已失效');
      } else {
        console.error('处理按钮点击事件出错：', error);
      }
      removeFloatingButton();
    }
  });

  document.body.appendChild(floatingBtn);

  // 添加点击外部区域移除按钮的处理
  clickOutsideHandler = (event) => {
    if (floatingBtn && !floatingBtn.contains(event.target)) {
      removeFloatingButton();
    }
  };
  document.addEventListener('mousedown', clickOutsideHandler);
}

// 移除浮动按钮的函数
function removeFloatingButton() {
  if (floatingBtn) {
    floatingBtn.remove();
    floatingBtn = null;
  }
  if (clickOutsideHandler) {
    document.removeEventListener('mousedown', clickOutsideHandler);
    clickOutsideHandler = null;
  }
  isCreatingBtn = false;
}

// 监听选中文本事件
document.addEventListener('mouseup', (e) => {
  try {
    if (!chrome.runtime?.id) {
      console.warn('扩展上下文无效');
      return;
    }

    const selection = window.getSelection().toString().trim();
    
    if (selection && !isCreatingBtn) {
      isCreatingBtn = true;
      removeFloatingButton(); // 移除已存在的按钮
      createFloatingButton(e, selection);
    } else if (!selection) {
      removeFloatingButton();
    }
  } catch (error) {
    console.error('处理浮动按钮逻辑出错：', error);
    removeFloatingButton();
  }
});

// 页面卸载时清理
window.addEventListener('unload', () => {
  removeFloatingButton();
});