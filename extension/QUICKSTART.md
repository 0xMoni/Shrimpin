# 🦐 Shrimpin' Chrome Extension - Quick Start

## What Changed?

✅ **No Python backend needed anymore!**  
The entire pose detection now runs in your browser using MediaPipe's JavaScript library.

## How to Install

### 1. Open Chrome Extensions Page

Navigate to:
```
chrome://extensions
```

Or click:  
**Menu (⋮) → Extensions → Manage Extensions**

### 2. Enable Developer Mode

Toggle the **Developer mode** switch in the top-right corner.

### 3. Load the Extension

1. Click **"Load unpacked"**
2. Navigate to `/Users/moni/Shrimpin/extension/`
3. Click **Select**

You should see "Shrimpin' Detector" appear in your extensions list with a 🦐 icon.

### 4. Grant Camera Permission

When you first enable detection, Chrome will ask for webcam permission. Click **Allow**.

## How to Use

### Step 1 — Click the Extension Icon

Click the 🦐 icon in your Chrome toolbar (pin it for easy access).

### Step 2 — Toggle Detection ON

Flip the **Detection** switch to **ON**.

### Step 3 — Calibrate

- Sit in your **best posture** for 3 seconds
- Stay still while it calibrates (progress bar will fill)
- Once calibrated, it starts monitoring automatically

### Step 4 — See the Widget

A floating shrimp widget will appear in the bottom-right of **every tab**:

- **Green dot** = Good posture ✅
- **Red dot** = Shrimping detected! 🦐
- **Counter** = Number of times you've shrimped

You can **drag the widget** anywhere on the page.

## Troubleshooting

### Widget not showing?

1. Make sure **Detection is ON** in the popup
2. Refresh the page (`Cmd+R`)
3. Check the browser console for errors (`Cmd+Option+J`)

### Camera not working?

1. Check Chrome has camera permission: `chrome://settings/content/camera`
2. Make sure no other app is using your webcam
3. Try restarting Chrome

### Still using localhost:8765?

The extension is now **fully browser-based**. You don't need to run `python posture_detector.py` anymore!

## File Structure

```
extension/
├── manifest.json          ← Extension config
├── background.js          ← Manages offscreen document
├── offscreen.html         ← Hidden page for MediaPipe
├── offscreen.js           ← Pose detection logic (Python ported to JS)
├── content.js             ← Injects widget into pages
├── popup/
│   ├── popup.html         ← Extension popup UI
│   ├── popup.js           ← Popup controls
│   └── popup.css          ← Popup styles
├── assets/
│   ├── shrimp1.png
│   ├── shrimp2.png
│   ├── faah.mp3
│   ├── vine-boom.mp3
│   └── pose_landmarker_lite.task  ← MediaPipe model (~5.5MB)
└── icons/
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

## Next Steps

Want to publish this? Check out:
- [Chrome Web Store Publishing Guide](https://developer.chrome.com/docs/webstore/publish/)

---

Built with MediaPipe Pose Detection  
Keep that posture straight! 🦐✨
