const slider = document.getElementById("speed-slider");
const speedInput = document.getElementById("speed-input");
const presetButtons = document.querySelectorAll(".presets button");

const MIN_SPEED = 0.25;
const MAX_SPEED = 4;

let committedSpeed = 1;

function formatSpeed(speed) {
  const cent = Math.round(speed * 100) / 100;
  if (Math.abs(speed - cent) < 1e-6) {
    return cent.toFixed(2);
  }
  return parseFloat(speed.toPrecision(5)).toString();
}

function parseSpeedInput(raw) {
  const trimmed = raw.trim().replace(/×$/u, "").replace(/x$/iu, "");
  const n = parseFloat(trimmed, 10);
  if (!Number.isFinite(n)) return null;
  return Math.min(MAX_SPEED, Math.max(MIN_SPEED, n));
}

function commitSpeedInput() {
  const parsed = parseSpeedInput(speedInput.value);
  if (parsed === null) {
    speedInput.value = formatSpeed(committedSpeed);
    return;
  }
  setSpeed(parsed);
}

function highlightPreset(speed) {
  presetButtons.forEach((btn) => {
    const preset = parseFloat(btn.dataset.speed, 10);
    btn.classList.toggle("active", Math.abs(preset - speed) < 0.001);
  });
}

function updateUI(speed) {
  committedSpeed = speed;
  slider.value = String(speed);
  if (document.activeElement !== speedInput) {
    speedInput.value = formatSpeed(speed);
  }
  highlightPreset(speed);
}

function setSpeed(speed) {
  chrome.storage.sync.set({ speed }, () => updateUI(speed));
}

function adjust(action) {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tabId = tabs[0]?.id;
    if (!tabId) return;

    chrome.tabs.sendMessage(tabId, { type: "natural-speed-adjust", action }, (response) => {
      if (chrome.runtime.lastError || !response?.speed) {
        chrome.storage.sync.get({ speed: 1 }, ({ speed }) => {
          let next = speed;
          if (action === "up") next = Math.min(4, speed + 0.05);
          else if (action === "down") next = Math.max(0.25, speed - 0.05);
          else if (action === "reset") next = 1;
          setSpeed(next);
        });
        return;
      }
      updateUI(response.speed);
    });
  });
}

chrome.storage.sync.get({ speed: 1 }, ({ speed }) => updateUI(speed));

slider.addEventListener("input", () => {
  const speed = parseFloat(slider.value, 10);
  if (document.activeElement !== speedInput) {
    speedInput.value = formatSpeed(speed);
  }
  highlightPreset(speed);
});

speedInput.addEventListener("focus", () => {
  speedInput.select();
});

speedInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    commitSpeedInput();
    speedInput.blur();
  } else if (event.key === "Escape") {
    speedInput.value = formatSpeed(committedSpeed);
    speedInput.blur();
  }
});

speedInput.addEventListener("blur", () => {
  commitSpeedInput();
});

slider.addEventListener("change", () => {
  setSpeed(parseFloat(slider.value, 10));
});

presetButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    setSpeed(parseFloat(btn.dataset.speed, 10));
  });
});

document.getElementById("btn-up").addEventListener("click", () => adjust("up"));
document.getElementById("btn-down").addEventListener("click", () => adjust("down"));
document.getElementById("btn-reset").addEventListener("click", () => adjust("reset"));
