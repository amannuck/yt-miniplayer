document.getElementById("pip").onclick = () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.scripting.executeScript({
      target: { tabId: tabs[0].id },
      func: () => {
        const video = document.querySelector("video");
        if (video) video.requestPictureInPicture();
      },
    });
  });
};

document.getElementById("exit").onclick = () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.scripting.executeScript({
      target: { tabId: tabs[0].id },
      func: () => {
        if (document.pictureInPictureElement) {
          document.exitPictureInPicture();
        }
      },
    });
  });
};

document.getElementById("goto").onclick = () => {
  chrome.runtime.sendMessage({ action: "goToSourceTab" });
};

// Progress polling
let progressBar = document.getElementById("progress-bar");
setInterval(() => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.scripting.executeScript(
      {
        target: { tabId: tabs[0].id },
        func: () => {
          const video = document.querySelector("video");
          return video ? [video.currentTime, video.duration] : null;
        },
      },
      (results) => {
        if (results && results[0].result) {
          const [time, duration] = results[0].result;
          const percent = (time / duration) * 100;
          progressBar.style.width = percent + "%";
        }
      }
    );
  });
}, 1000);
