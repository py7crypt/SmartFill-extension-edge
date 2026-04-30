// background/service-worker.js
// Handles messaging between popup and content scripts

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {

  if (message.action === "fill_form") {
    // Forward profile data to active tab's content script
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (!tabs[0]?.id) return sendResponse({ success: false, error: "No active tab" });
      chrome.tabs.sendMessage(tabs[0].id, {
        action: "fill_form",
        profile: message.profile,
        manualMappings: message.manualMappings || {}
      }, (response) => {
        sendResponse(response || { success: false });
      });
    });
    return true; // keep channel open for async
  }

  if (message.action === "scan_fields") {
    // Ask content script to scan the page and return unmatched fields
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (!tabs[0]?.id) return sendResponse({ success: false, fields: [] });
      chrome.tabs.sendMessage(tabs[0].id, { action: "scan_fields" }, (response) => {
        sendResponse(response || { success: false, fields: [] });
      });
    });
    return true;
  }

});
