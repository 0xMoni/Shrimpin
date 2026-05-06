# 🦐 Shrimpin' Extension - Test Checklist

## Pre-Flight Check

Before loading the extension, verify these files exist:

```bash
cd /Users/moni/Shrimpin/extension

# Core files
ls -lh manifest.json
ls -lh background.js
ls -lh offscreen.html
ls -lh offscreen.js
ls -lh content.js

# Popup files
ls -lh popup/popup.html
ls -lh popup/popup.js
ls -lh popup/popup.css

# Assets
ls -lh assets/pose_landmarker_lite.task
ls -lh assets/shrimp1.png
ls -lh assets/shrimp2.png
ls -lh assets/faah.mp3
ls -lh assets/vine-boom.mp3

# Icons
ls -lh icons/icon16.png
ls -lh icons/icon48.png
ls -lh icons/icon128.png
```

## Load Extension

1. Open `chrome://extensions`
2. Enable **Developer mode** (top-right toggle)
3. Click **Load unpacked**
4. Select `/Users/moni/Shrimpin/extension/`
5. Verify extension appears with 🦐 icon

## Test 1: Extension Loads

- [ ] Extension appears in list
- [ ] No errors shown in red
- [ ] Can click the extension icon
- [ ] Popup opens

## Test 2: Popup UI

- [ ] Popup shows "Shrimpin' Detector" title
- [ ] "Detection" toggle is OFF by default
- [ ] "Sound Alerts" toggle is ON by default
- [ ] Volume slider is at 50%
- [ ] Shows "Mode: Browser-Based"
- [ ] Shows "Engine: MediaPipe Pose"

## Test 3: Enable Detection

- [ ] Toggle "Detection" to ON
- [ ] Browser asks for camera permission
- [ ] Click "Allow"
- [ ] No errors in console

**Check Console:**
```
Cmd+Option+J → Console tab
Look for:
  🦐 Offscreen: Initializing MediaPipe...
  🦐 Offscreen: MediaPipe ready
  🦐 Offscreen: Starting webcam...
```

## Test 4: Widget Appears

- [ ] Open any webpage (e.g., `google.com`)
- [ ] Floating widget appears in bottom-right corner
- [ ] Shows shrimp animation (2 frames alternating)
- [ ] Shows counter: "0"
- [ ] Shows status: "Calibrating..."

## Test 5: Calibration

- [ ] Sit in **good posture** for 3 seconds
- [ ] Status should show: "Calibrating in 3s...", "2s...", "1s..."
- [ ] Then shows: "Calibrating 0%", "10%", "20%", etc.
- [ ] After ~45 frames: "Good posture" + **green dot**

## Test 6: Shrimp Detection

- [ ] Intentionally **hunch forward** (lean toward screen)
- [ ] After ~1-2 seconds, should see:
  - Status: "Straighten up!"
  - Dot turns **red** and pulses
  - Counter increments: "1"
  - Alert sound plays (faah.mp3)

## Test 7: Recovery

- [ ] Sit back in good posture
- [ ] After ~1-2 seconds:
  - Status: "Good posture"
  - Dot turns **green**
  - Counter stays at "1" (doesn't reset)

## Test 8: Widget Dragging

- [ ] Click and drag the widget
- [ ] Release
- [ ] Widget stays in new position
- [ ] Reload page (`Cmd+R`)
- [ ] Widget appears at last saved position

## Test 9: Sound Toggle

- [ ] Open extension popup
- [ ] Toggle "Sound Alerts" to OFF
- [ ] Hunch forward again
- [ ] Should NOT play alert sound
- [ ] Toggle back to ON
- [ ] Sound should work again

## Test 10: Volume Control

- [ ] Open extension popup
- [ ] Drag volume slider to 100%
- [ ] Hunch forward
- [ ] Alert should be louder
- [ ] Set volume to 0%
- [ ] Alert should be silent

## Test 11: Multi-Tab

- [ ] Open 3+ tabs
- [ ] Each tab should have its own widget
- [ ] All widgets show the same counter
- [ ] Detection works across all tabs

## Test 12: Disable Detection

- [ ] Open extension popup
- [ ] Toggle "Detection" to OFF
- [ ] Widget status: "Offline"
- [ ] Dot turns **grey**
- [ ] Hunching should NOT trigger alerts

## Common Issues

### Issue: "Offscreen document failed to create"
**Fix:** Close all Chrome windows and restart Chrome completely.

### Issue: Widget not showing
**Fix:** Refresh the page (`Cmd+R`) after enabling detection.

### Issue: Webcam not working
**Fix:** 
1. Check `chrome://settings/content/camera`
2. Ensure Chrome has camera permission
3. Close other apps using webcam (Zoom, Skype, etc.)

### Issue: "Failed to load model"
**Fix:** Verify `assets/pose_landmarker_lite.task` exists and is ~5.5MB.

### Issue: Sound not playing
**Fix:** 
1. Check browser isn't muted
2. Check site permissions allow audio autoplay
3. Verify assets exist: `assets/faah.mp3`, `assets/vine-boom.mp3`

### Issue: Console shows "ES module" errors
**Fix:** The offscreen.js uses ES6 imports. Make sure manifest.json includes:
```json
"type": "module"
```
(Already configured)

## Debug Tips

### View Background Console
```
chrome://extensions → Shrimpin' Detector → "service worker" link
```

### View Offscreen Console
```
chrome://extensions → Shrimpin' Detector → "Inspect views: offscreen.html"
```

### View Content Script Console
```
Open any page → Cmd+Option+J → Console
Filter by "🦐" emoji
```

## Success Criteria

✅ All 12 tests pass  
✅ No errors in any console  
✅ Detection accurately catches hunching  
✅ Widget is draggable and persistent  
✅ Sounds play at correct volume  

---

If all tests pass: **You're ready to shrimp! 🦐✨**
