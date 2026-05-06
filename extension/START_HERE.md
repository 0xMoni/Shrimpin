# 🦐 START HERE - Shrimpin' Chrome Extension

## What You Have Now

✅ A **complete Chrome extension** that replaces your Python backend  
✅ **MediaPipe pose detection** running entirely in the browser  
✅ **Floating widget** that appears on every webpage  
✅ **Auto-calibration** and posture monitoring  
✅ **Zero dependencies** - no Python needed!

---

## Quick Test (5 minutes)

### 1. Load the Extension

```bash
# Open Chrome
# Type in address bar: chrome://extensions
# Toggle "Developer mode" ON (top-right)
# Click "Load unpacked"
# Select: /Users/moni/Shrimpin/extension/
```

### 2. Enable Detection

```
1. Click the 🦐 icon in Chrome toolbar
2. Toggle "Detection" to ON
3. Click "Allow" when asked for camera permission
```

### 3. Test It

```
1. Open any webpage (google.com works)
2. Look for the floating shrimp widget (bottom-right)
3. Sit in good posture for 3 seconds (calibration)
4. Lean forward toward screen → widget turns red + plays sound
5. Sit back up → widget turns green
```

**✅ If all 5 steps work, you're done!**

---

## Files Created

| File | What It Does |
|------|--------------|
| `offscreen.html` | Hidden page that runs MediaPipe |
| `offscreen.js` | **Core detection logic** (Python ported to JS) |
| `background.js` | Updated to manage offscreen document |
| `content.js` | Updated to receive status from offscreen |
| `manifest.json` | Updated with offscreen permissions |
| `popup/popup.html` | Updated UI (removed backend status) |
| `popup/popup.js` | Updated controls |
| `assets/pose_landmarker_lite.task` | MediaPipe model (copied from parent) |

---

## What Changed?

### Before (Python Backend)
```
┌──────────────┐        HTTP GET         ┌──────────────┐
│  Extension   │ ───────────────────────> │  Python      │
│  (Browser)   │ http://localhost:8765    │  posture.py  │
└──────────────┘ <─────────────────────── └──────────────┘
                   JSON status                  │
                                                │
                                           ┌────▼────┐
                                           │ Webcam  │
                                           └─────────┘
```

### After (Browser-Only)
```
┌────────────────────────────────────────────────────────┐
│              CHROME BROWSER                            │
│                                                         │
│  ┌──────────────┐         ┌─────────────────────┐     │
│  │  Extension   │         │ Offscreen Document  │     │
│  │  Widget      │ <─────> │ (Hidden)            │     │
│  │ (content.js) │ chrome. │ - MediaPipe         │     │
│  │              │ runtime │ - Pose detection    │     │
│  └──────────────┘ msg     │ - Webcam access     │     │
│                            └──────────┬──────────┘     │
│                                       │                 │
│                                  ┌────▼────┐           │
│                                  │ Webcam  │           │
│                                  └─────────┘           │
└────────────────────────────────────────────────────────┘
```

**Result:** Same detection, zero setup! 🎉

---

## Next Steps

### 1. Read the Docs

- **QUICKSTART.md** - Installation guide
- **ARCHITECTURE.md** - Technical deep-dive
- **TEST_CHECKLIST.md** - Full test suite
- **README.md** - Complete documentation

### 2. Customize (Optional)

**Change sensitivity:**
```javascript
// Edit: offscreen.js line 22
const SENSITIVITY = {
  ratio_offset: 0.06,  // Increase = more sensitive
  fwd_offset: 0.020,
  // ...
};
```

**Change sounds:**
```javascript
// Edit: content.js line 305
const sounds = {
  faah: new Audio(chrome.runtime.getURL('assets/faah.mp3')),
  vine: new Audio(chrome.runtime.getURL('assets/vine-boom.mp3'))
};
```

**Change detection window:**
```javascript
// Edit: offscreen.js line 54
window_size: 15  // Number of frames to average
```

### 3. Publish (Optional)

Want to share on Chrome Web Store?

1. Create a developer account: https://chrome.google.com/webstore/devconsole
2. Pay one-time $5 fee
3. Zip the extension folder
4. Upload and fill out listing details
5. Submit for review (~1-3 days)

---

## Troubleshooting

### "Offscreen document failed"
→ Restart Chrome completely (close all windows)

### Widget not showing
→ Refresh page after enabling detection

### Camera not working
→ Check `chrome://settings/content/camera`

### Console errors about ES modules
→ Already fixed in `offscreen.js` (uses import syntax)

---

## Support

If something's not working:

1. Check `chrome://extensions` for errors (red text)
2. Open DevTools console: `Cmd+Option+J`
3. Look for messages starting with 🦐
4. Check TEST_CHECKLIST.md for common issues

---

## That's It!

You now have a **production-ready Chrome extension** that:
- ✅ Detects posture in real-time
- ✅ Works on all websites
- ✅ Requires no setup
- ✅ Is 100% browser-based
- ✅ Respects privacy (all local)

**No Python. No localhost. Just install and go.** 🦐✨

---

**Built:** May 6, 2026  
**Tech:** MediaPipe + Chrome Extension Manifest V3  
**Status:** Ready to use!
