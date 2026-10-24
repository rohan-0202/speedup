const DEFAULT_SPEED = 1;
const MIN_SPEED = 0.25;
const MAX_SPEED = 4;
const STEP = 0.05;

let currentSpeed = DEFAULT_SPEED;
const observers = [];

function extensionAlive() {
  try {
    return Boolean(chrome.runtime?.id);
  } catch {
    return false;
  }
}

function teardown() {
  for (const observer of observers) observer.disconnect();
  observers.length = 0;
}

function clampSpeed(speed) {
  return Math.min(MAX_SPEED, Math.max(MIN_SPEED, speed));
}

function applyNaturalSpeed(media, speed) {
  media.preservesPitch = false;
  if ("mozPreservesPitch" in media) media.mozPreservesPitch = false;
  if ("webkitPreservesPitch" in media) media.webkitPreservesPitch = false;

  media.defaultPlaybackRate = speed;
  media.playbackRate = speed;
}

function applyToMedia(media, speed) {
  if (!(media instanceof HTMLMediaElement)) return;
  applyNaturalSpeed(media, speed);
}

function applyToAllDocumentRoots(speed, root = document) {
  root.querySelectorAll("video, audio").forEach((el) => applyToMedia(el, speed));
}

function applySpeed(speed) {
  currentSpeed = clampSpeed(speed);
  applyToAllDocumentRoots(currentSpeed);
}

function storageGet(defaults, callback) {
  if (!extensionAlive()) {
    teardown();
    return;
  }
  try {
    chrome.storage.sync.get(defaults, (result) => {
      if (chrome.runtime.lastError || !extensionAlive()) {
        teardown();
        return;
      }
      callback(result);
    });
  } catch {
    teardown();
  }
}

function storageSet(values, callback) {
  if (!extensionAlive()) {
    teardown();
    return;
  }
  try {
    chrome.storage.sync.set(values, () => {
      if (chrome.runtime.lastError || !extensionAlive()) {
        teardown();
        return;
      }
      callback?.();
    });
  } catch {
    teardown();
  }
}

function observeRoot(root) {
  if (!root || root.__naturalSpeedObserved) return;
  root.__naturalSpeedObserved = true;

  const observer = new MutationObserver((mutations) => {
    if (!extensionAlive()) {
      teardown();
      return;
    }

    const speed = currentSpeed;
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node instanceof HTMLMediaElement) {
          applyToMedia(node, speed);
        } else if (node instanceof Element) {
          if (node.matches?.("video, audio")) applyToMedia(node, speed);
          applyToAllDocumentRoots(speed, node);
        }
      }
    }
  });

  observer.observe(root, { childList: true, subtree: true });
  observers.push(observer);
}

function init(speed) {
  applySpeed(speed);
  observeRoot(document);
}

if (extensionAlive()) {
  storageGet({ speed: DEFAULT_SPEED }, ({ speed }) => {
    init(clampSpeed(speed));
  });

  chrome.storage.onChanged.addListener((changes, area) => {
    if (!extensionAlive()) {
      teardown();
      return;
    }
    if (area !== "sync" || !changes.speed) return;
    applySpeed(changes.speed.newValue ?? DEFAULT_SPEED);
  });

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message?.type !== "natural-speed-adjust") return;

    if (!extensionAlive()) {
      teardown();
      return;
    }

    let next = currentSpeed;
    if (message.action === "up") next = clampSpeed(currentSpeed + STEP);
    else if (message.action === "down") next = clampSpeed(currentSpeed - STEP);
    else if (message.action === "reset") next = DEFAULT_SPEED;
    else if (message.action === "set" && typeof message.speed === "number") {
      next = clampSpeed(message.speed);
    }

    storageSet({ speed: next }, () => {
      applySpeed(next);
      sendResponse({ speed: next });
    });

    return true;
  });
}
