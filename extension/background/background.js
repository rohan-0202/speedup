const STEP_ACTIONS = {
  "speed-up": "up",
  "speed-down": "down",
  "speed-reset": "reset",
};

chrome.commands.onCommand.addListener((command) => {
  const action = STEP_ACTIONS[command];
  if (!action) return;

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tab = tabs[0];
    if (!tab?.id) return;
    chrome.tabs.sendMessage(tab.id, { type: "natural-speed-adjust", action });
  });
});
