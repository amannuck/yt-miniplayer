let currentVideoData = null;
let miniPlayerWindowId = null;
let sourceTabId = null;

// Listen for tab updates to detect YouTube videos
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (
    changeInfo.status === "complete" &&
    tab.url &&
    tab.url.includes("youtube.com/watch")
  ) {
    const videoId = extractVideoId(tab.url);
    if (videoId) {
      currentVideoData = {
        videoId: videoId,
        title: tab.title,
        url: tab.url,
        tabId: tabId,
      };
      sourceTabId = tabId;

      // Store in chrome storage for the mini player to access
      chrome.storage.local.set({ currentVideo: currentVideoData });
    }
  }
});

// Handle extension icon click
chrome.action.onClicked.addListener((tab) => {
  if (currentVideoData) {
    openMiniPlayer();
  } else {
    // Try to extract video from current tab if it's YouTube
    if (tab.url && tab.url.includes("youtube.com/watch")) {
      const videoId = extractVideoId(tab.url);
      if (videoId) {
        currentVideoData = {
          videoId: videoId,
          title: tab.title,
          url: tab.url,
          tabId: tab.id,
        };
        sourceTabId = tab.id;
        chrome.storage.local.set({ currentVideo: currentVideoData });
        openMiniPlayer();
      }
    }
  }
});

// Handle messages from content script and mini player
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.action) {
    case "openMiniPlayer":
      if (message.videoData) {
        currentVideoData = message.videoData;
        sourceTabId = sender.tab.id;
        chrome.storage.local.set({ currentVideo: currentVideoData });
        openMiniPlayer();
      }
      break;

    case "videoDetected":
      if (message.videoData && sender.tab) {
        currentVideoData = {
          ...message.videoData,
          tabId: sender.tab.id,
        };
        sourceTabId = sender.tab.id;
        chrome.storage.local.set({ currentVideo: currentVideoData });
      }
      break;

    case "goToSourceTab":
      if (sourceTabId) {
        chrome.tabs.update(sourceTabId, { active: true }, () => {
          chrome.tabs.get(sourceTabId, (tab) => {
            if (tab.windowId) {
              chrome.windows.update(tab.windowId, { focused: true });
            }
          });
        });
      }
      break;

    case "closeMiniPlayer":
      if (miniPlayerWindowId) {
        chrome.windows.remove(miniPlayerWindowId);
        miniPlayerWindowId = null;
      }
      break;
  }
});

// Handle window removal
chrome.windows.onRemoved.addListener((windowId) => {
  if (windowId === miniPlayerWindowId) {
    miniPlayerWindowId = null;
  }
});

function extractVideoId(url) {
  const regex = /[?&]v=([^&#]*)/;
  const match = url.match(regex);
  return match ? match[1] : null;
}

function openMiniPlayer() {
  if (miniPlayerWindowId) {
    // Focus existing window
    chrome.windows.update(miniPlayerWindowId, { focused: true });
    return;
  }

  // Create new mini player window
  chrome.windows.create(
    {
      url: chrome.runtime.getURL("index.html"),
      type: "popup",
      width: 480,
      height: 320,
      left: 100,
      top: 100,
    },
    (window) => {
      miniPlayerWindowId = window.id;
    }
  );
}
