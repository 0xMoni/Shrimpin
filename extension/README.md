# 🦐 Shrimpin' - Chrome Extension

**Catch yourself hunching with real-time posture detection!**

A Chrome extension that monitors your posture using MediaPipe Pose Detection and alerts you when you start "shrimping" (hunching forward). No external dependencies, no Python backend — everything runs in your browser.

---

## ✨ Features

- 🎥 **Real-time pose detection** using MediaPipe
- 🦐 **Floating widget** on every tab (draggable)
- 🔔 **Audio alerts** when bad posture is detected
- 📊 **Shrimp counter** tracks how many times you've hunched
- 🎯 **Auto-calibration** learns your good posture
- 🎨 **Animated shrimp character** (because why not)
- 🔒 **Privacy-first**: All processing happens locally in your browser
- 🚀 **Zero setup**: Just install and go

---

## 🚀 Quick Start

### Installation

1. Open Chrome and navigate to:
   ```
   chrome://extensions
   ```

2. Enable **Developer mode** (toggle in top-right)

3. Click **Load unpacked**

4. Select this folder:
   ```
   /Users/moni/Shrimpin/extension/
   ```

5. The extension is now installed! Look for the 🦐 icon in your toolbar.

### First Use

1. **Click the 🦐 icon** in your Chrome toolbar
2. **Toggle "Detection" to ON**
3. **Allow camera access** when prompted
4. **Sit in your best posture** for 3 seconds (calibration phase)
5. Watch the widget appear in the bottom-right corner of your tabs!

### Normal Use

- The widget shows a **green dot** when your posture is good ✅
- If you hunch forward, the dot turns **red** and plays an alert sound 🚨
- The counter increments each time bad posture is detected
- Drag the widget anywhere on the page to reposition it

---

## 📁 What's Inside

```
extension/
├── manifest.json                 Extension configuration
├── background.js                 Service worker (manages offscreen document)
├── offscreen.html               Hidden page for MediaPipe
├── offscreen.js                 Pose detection logic (ported from Python)
├── content.js                   Widget injection and UI updates
│
├── popup/
│   ├── popup.html               Extension popup interface
│   ├── popup.js                 Popup controls
│   └── popup.css                Popup styles
│
├── assets/
│   ├── pose_landmarker_lite.task  MediaPipe model (5.5MB)
│   ├── shrimp1.png              Shrimp animation frame 1
│   ├── shrimp2.png              Shrimp animation frame 2
│   ├── faah.mp3                 Alert sound option 1
│   └── vine-boom.mp3            Alert sound option 2
│
└── icons/
    ├── icon16.png               Extension icon (small)
    ├── icon48.png               Extension icon (medium)
    └── icon128.png              Extension icon (large)
```

---

## 🔧 How It Works

### Architecture

1. **Offscreen Document** (`offscreen.html` + `offscreen.js`)
   - Hidden page with webcam access
   - Runs MediaPipe Pose Landmarker
   - Detects 33 body landmarks in real-time
   - Calculates posture metrics every frame

2. **Background Service Worker** (`background.js`)
   - Manages offscreen document lifecycle
   - Relays messages between offscreen and content scripts

3. **Content Script** (`content.js`)
   - Injected into every webpage
   - Renders floating widget using Shadow DOM
   - Receives posture status updates
   - Plays alert sounds

### Posture Detection Algorithm

The extension monitors 4 key metrics:

1. **Shrimp Ratio**: `(eyes→nose) / (nose→shoulder)`
   - Increases when you lean forward

2. **Head Forward Lean**: `abs(ears.x - shoulders.x)`
   - Measures forward head posture

3. **Shoulder Drop**: `shoulders.y / hips.y`
   - Detects slouching

4. **Sideways Tilt**: `abs(left_ear.y - right_ear.y)`
   - Catches leaning to one side

**Detection Logic:**
- Uses a 15-frame sliding window
- If ≥55% of frames show bad posture → triggers alert
- If <25% of frames show bad posture → clears alert
- Hysteresis prevents flickering

---

## ⚙️ Settings

### Detection Toggle
Turn posture monitoring on/off

### Sound Alerts
Enable/disable alert sounds when bad posture is detected

### Volume
Adjust alert volume (0-100%)

---

## 🐛 Troubleshooting

### Widget not appearing
- Make sure Detection is ON in the popup
- Refresh the page (`Cmd+R` or `F5`)
- Check browser console for errors (`Cmd+Option+J`)

### Camera permission denied
1. Go to `chrome://settings/content/camera`
2. Find the extension and set to "Allow"
3. Reload the extension

### Extension not loading
- Check all files are present (see file structure above)
- Look for errors in `chrome://extensions` (red text)
- Try removing and re-adding the extension

### Offscreen document errors
- Restart Chrome completely (close all windows)
- Clear browser cache
- Check DevTools for specific error messages

### False positives/negatives
- Recalibrate: Toggle Detection OFF then ON again
- Ensure good lighting for camera
- Try adjusting your camera angle

---

## 🔐 Privacy

- **All processing happens locally** in your browser
- **No data is sent to any server**
- **No telemetry or analytics**
- Webcam stream never leaves your machine
- Open source — you can inspect all the code

---

## 📚 Documentation

- [QUICKSTART.md](QUICKSTART.md) - Installation and basic usage
- [ARCHITECTURE.md](ARCHITECTURE.md) - Technical deep-dive with diagrams
- [TEST_CHECKLIST.md](TEST_CHECKLIST.md) - Complete testing guide

---

## 🎯 Development

### Testing Changes

1. Make your edits
2. Go to `chrome://extensions`
3. Click the **refresh icon** on the Shrimpin' extension
4. Reload any open tabs to see changes

### Debugging

**Background Script Console:**
```
chrome://extensions → Service Worker → Inspect
```

**Offscreen Document Console:**
```
chrome://extensions → Inspect views: offscreen.html
```

**Content Script Console:**
```
Open any page → F12 → Console → Filter by "🦐"
```

### Building for Production

For Chrome Web Store submission:
1. Update `manifest.json` version
2. Create icons (16x16, 48x48, 128x128)
3. Zip the extension folder
4. Upload to [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)

---

## 🛠️ Tech Stack

- **Pose Detection**: [MediaPipe Pose Landmarker](https://developers.google.com/mediapipe/solutions/vision/pose_landmarker)
- **Browser API**: Chrome Extension Manifest V3
- **Webcam Access**: `navigator.mediaDevices.getUserMedia()`
- **Offscreen Processing**: Chrome Offscreen Documents API
- **UI Isolation**: Shadow DOM
- **Storage**: `chrome.storage.local`
- **Messaging**: `chrome.runtime.sendMessage()`

---

## 🎨 Credits

- Original Python backend and detection algorithm: [Shrimpin' project](https://github.com/yourusername/shrimpin)
- MediaPipe: Google
- Shrimp artwork: [Credit if applicable]
- Sound effects: [Credit if applicable]

---

## 📜 License

[MIT License](LICENSE) - See LICENSE file for details

---

## 🦐 Keep That Posture Straight!

Built with ❤️ and good posture.

**Questions? Issues? Suggestions?**  
Open an issue or submit a PR!

---

**Version:** 1.0.0  
**Last Updated:** May 6, 2026  
**Maintained by:** Moni
