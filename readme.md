# Natural Speed (Chrome extension)

Speed up or slow down **video and audio** in the browser with the **natural pitch effect**: faster playback sounds higher (chipmunk), slower sounds lower — **no pitch normalization**.

Most players and extensions keep pitch fixed while changing speed. This extension turns that off by setting `preservesPitch = false` on media elements and controlling `playbackRate`.

## Install (unpacked)

1. Open Chrome and go to `chrome://extensions`.
2. Enable **Developer mode** (top right).
3. Click **Load unpacked**.
4. Select the `extension/` folder in this repository.

## Use

- Click the extension icon to open the popup: slider, presets (0.5×–2×), and ± / Reset.
- Keyboard shortcuts (changeable under `chrome://extensions/shortcuts`):
  - **Alt+Shift+.** — speed up (+0.05×)
  - **Alt+Shift+,** — slow down (−0.05×)
  - **Alt+Shift+0** — reset to 1×

Speed is saved per browser profile and applied to `<video>` and `<audio>` on any site (YouTube, streaming, podcasts, etc.). New media that loads on the page is picked up automatically.

## How it works

HTML5 media can preserve pitch when `playbackRate` changes (`preservesPitch`, default **true** in modern Chrome). This extension sets `preservesPitch` to **false** and sets `playbackRate` to your chosen value so pitch scales with speed.

## Limits

- Does not run on restricted pages (`chrome://`, Chrome Web Store, etc.).
- Sites that use non-standard audio pipelines (some Web Audio graphs) may not respond to `playbackRate` on the `<video>` element alone.
