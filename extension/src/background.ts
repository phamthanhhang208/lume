// Background service worker.
// Registers the "Try with Lume" (product try-on) and "Steal this look with
// Lume" (makeup transfer) context menus on images, opens the side panel on
// click, and forwards the clicked image URL via runtime messaging.

const TRY_MENU_ID = "lume-try";
const STEAL_MENU_ID = "lume-steal";

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: TRY_MENU_ID,
    title: "Try with Lume",
    contexts: ["image"],
  });
  chrome.contextMenus.create({
    id: STEAL_MENU_ID,
    title: "Steal this look with Lume",
    contexts: ["image"],
  });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== TRY_MENU_ID && info.menuItemId !== STEAL_MENU_ID) return;
  if (!info.srcUrl || !tab?.id) return;

  try {
    await chrome.sidePanel.open({ tabId: tab.id });
  } catch (err) {
    console.warn("sidePanel.open failed:", err);
  }

  if (info.menuItemId === TRY_MENU_ID) {
    await chrome.runtime.sendMessage({
      type: "TRY_PRODUCT",
      imageUrl: info.srcUrl,
      pageUrl: info.pageUrl,
      pageTitle: tab.title,
    });
  } else {
    await chrome.runtime.sendMessage({
      type: "STEAL_LOOK",
      imageUrl: info.srcUrl,
      pageTitle: tab.title,
    });
  }
});

chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((err) => console.warn("setPanelBehavior failed:", err));
