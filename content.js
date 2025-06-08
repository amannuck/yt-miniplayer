// Content script to detect YouTube videos and provide quick access
(function () {
  let lastVideoId = null;

  function getCurrentVideoId() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get("v");
  }

  function getCurrentVideoData() {
    const videoId = getCurrentVideoId();
    if (!videoId) return null;

    const titleElement =
      document.querySelector(
        "h1.ytd-video-primary-info-renderer yt-formatted-string"
      ) ||
      document.querySelector(
        ".title.style-scope.ytd-video-primary-info-renderer"
      );

    return {
      videoId: videoId,
      title: titleElement ? titleElement.textContent.trim() : document.title,
      url: window.location.href,
      timestamp: Date.now(),
    };
  }

  function checkForVideoChange() {
    const currentVideoId = getCurrentVideoId();
    if (currentVideoId && currentVideoId !== lastVideoId) {
      lastVideoId = currentVideoId;
      const videoData = getCurrentVideoData();
      if (videoData) {
        chrome.runtime.sendMessage({
          action: "videoDetected",
          videoData: videoData,
        });
      }
    }
  }

  // Check for video changes on page load and navigation
  checkForVideoChange();

  // Listen for YouTube's navigation events
  let observer = new MutationObserver(() => {
    checkForVideoChange();
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

  // Also listen for URL changes (for SPA navigation)
  let lastUrl = location.href;
  new MutationObserver(() => {
    const url = location.href;
    if (url !== lastUrl) {
      lastUrl = url;
      setTimeout(checkForVideoChange, 1000); // Delay to allow page to load
    }
  }).observe(document, { subtree: true, childList: true });
})();
