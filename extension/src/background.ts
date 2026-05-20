// Background service worker.
// Registers the "Try with Lume" context menu on images, opens the side panel
// on click, and forwards the clicked image URL via runtime messaging.

const CONTEXT_MENU_ID = "lume-try";

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: CONTEXT_MENU_ID,
    title: "Try with Lume",
    contexts: ["image"],
  });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== CONTEXT_MENU_ID) return;
  if (!info.srcUrl || !tab?.id) return;

  try {
    await chrome.sidePanel.open({ tabId: tab.id });
  } catch (err) {
    console.warn("sidePanel.open failed:", err);
  }

  await chrome.runtime.sendMessage({
    type: "TRY_PRODUCT",
    imageUrl: info.srcUrl,
    pageUrl: info.pageUrl,
    pageTitle: tab.title,
  });
});

chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((err) => console.warn("setPanelBehavior failed:", err));
