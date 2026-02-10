// Handle messages from popup and content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'SAVE_TOKEN') {
    chrome.storage.local.set({ ledgerToken: message.token });
    sendResponse({ success: true });
  }
  return true;
});

// Listen for auth callback from Ledger web app
chrome.runtime.onMessageExternal.addListener((message, sender, sendResponse) => {
  if (message.type === 'LEDGER_AUTH') {
    chrome.storage.local.set({ ledgerToken: message.token });
    sendResponse({ success: true });
  }
});