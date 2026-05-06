# 🔧 Toggle Button Fix Guide

## Quick Fix (Try This First!)

### Step 1: Open Test Page
1. Save the test page to desktop or open it:
   ```
   file:///Users/moni/Shrimpin/extension/test.html
   ```
   Or just drag `test.html` into Chrome

### Step 2: Open Console
- Press `Cmd+Option+J` (Mac) or `F12` (Windows)
- Go to **Console** tab

### Step 3: Run Debug Script
1. Copy all content from `check-toggle.js`
2. Paste into console
3. Press Enter
4. Wait 3 seconds and read the output

The script will tell you exactly what's wrong!

---

## Manual Test

If the debug script doesn't help, try this:

### 1. Reload Extension
```
1. Go to: chrome://extensions
2. Find "Shrimpin' Detector"
3. Click the refresh icon (circular arrow)
4. Close all tabs
5. Open a new tab to: google.com
```

### 2. Open DevTools on Page
```
1. Press Cmd+Option+J (or F12)
2. Go to Console tab
3. Keep it open
```

### 3. Click Extension Icon
```
1. Click 🦐 in Chrome toolbar
2. Popup opens
```

### 4. Open DevTools on Popup
```
1. Right-click INSIDE the popup
2. Click "Inspect"
3. New DevTools window opens
4. Go to Console tab
```

### 5. Toggle and Watch Both Consoles

**In POPUP Console, you should see:**
```
Toggle clicked, enabled: true
```

**In PAGE Console (google.com), you should see:**
```
🦐 Storage changed: {enabled: true, soundEnabled: true, volume: 0.5}
🦐 Detection state changing from false to true
🦐 Detection started
```

**Widget should appear in bottom-right corner!**

---

## If Still Not Working

### Check 1: Is content script injecting?

**Run in page console:**
```javascript
console.log('Widget exists?', !!document.getElementById('shrimpin-root'));
```

- **If FALSE** → Content script not loaded
  - Solution: Refresh page (Cmd+R)
  - Check chrome://extensions for errors

- **If TRUE** → Widget is there, but might be hidden or broken
  - Check for CSS/JS errors in console

### Check 2: Is storage working?

**Run in page console:**
```javascript
chrome.storage.local.get(['settings'], (result) => {
  console.log('Settings:', result);
});
```

- **If empty** → Storage not initialized
  - Run this to initialize:
    ```javascript
    chrome.storage.local.set({
      settings: { enabled: true, volume: 0.5, soundEnabled: true }
    });
    ```

- **If shows settings** → Storage is working, issue elsewhere

### Check 3: Can we start detection manually?

**Run in page console:**
```javascript
chrome.runtime.sendMessage({ action: 'startDetection' }, (response) => {
  console.log('Response:', response);
});
```

- **If error** → Background script issue
  - Check background console at chrome://extensions → "service worker"

- **If success** → Detection can start, issue is in the toggle flow

### Check 4: Is background service worker alive?

```
1. Go to: chrome://extensions
2. Find "Shrimpin' Detector"
3. Look for blue text "service worker"
4. Click it
```

- **If no link** → Service worker not running
  - Toggle the extension OFF then ON
  - Or remove and re-add the extension

- **If link exists** → Click it and check console for errors

### Check 5: Camera permission

```
1. Go to: chrome://settings/content/camera
2. Find "Shrimpin' Detector"
3. Make sure it's set to "Allow"
```

---

## Common Issues & Solutions

### Issue: "No shrimpin-root element"
**Cause:** Content script not injected  
**Fix:** Refresh the page

### Issue: "Chrome runtime error: Could not establish connection"
**Cause:** Extension crashed or service worker stopped  
**Fix:** Go to chrome://extensions, toggle extension OFF then ON

### Issue: "Offscreen document failed to create"
**Cause:** Chrome already has an offscreen document open  
**Fix:** Restart Chrome completely (close ALL windows)

### Issue: Toggle works once, then stops
**Cause:** Service worker went to sleep  
**Fix:** Click the refresh icon on the extension at chrome://extensions

### Issue: Widget appears but stays grey/offline
**Cause:** Offscreen document or MediaPipe not starting  
**Fix:**
1. Go to chrome://extensions
2. Look for "Inspect views: offscreen.html"
3. Click it → Check console for errors
4. Look for "Failed to initialize" or camera errors

---

## Nuclear Option: Complete Reset

If nothing else works, start fresh:

### 1. Remove Extension
```
chrome://extensions → Remove "Shrimpin' Detector"
```

### 2. Clear All Data
**Run in any page console:**
```javascript
chrome.storage.local.clear(() => {
  console.log('Storage cleared');
});
```

### 3. Close Chrome Completely
```
Close ALL Chrome windows
Wait 5 seconds
Reopen Chrome
```

### 4. Reload Extension
```
1. chrome://extensions
2. Enable Developer mode
3. Load unpacked
4. Select: /Users/moni/Shrimpin/extension/
```

### 5. Test Again
```
1. Open: google.com
2. Open console: Cmd+Option+J
3. Click extension icon
4. Toggle ON
5. Watch console for 🦐 messages
```

---

## Files to Check for Errors

### manifest.json
```bash
# Validate JSON syntax
cat /Users/moni/Shrimpin/extension/manifest.json | python3 -m json.tool
```

### Check all files are present
```bash
cd /Users/moni/Shrimpin/extension
ls -la manifest.json background.js content.js offscreen.html offscreen.js
ls -la popup/popup.html popup/popup.js popup/popup.css
ls -la assets/pose_landmarker_lite.task assets/shrimp1.png assets/shrimp2.png
```

---

## Expected Console Flow (When Working)

### Page Console (google.com):
```
🦐 Shrimpin' Detector: Loading...
🦐 Widget injected
🦐 Widget initialized
🦐 Loaded settings: {settings: {enabled: false, ...}}
🦐 Detection not auto-starting (disabled)

[User toggles ON]

🦐 Storage changed: {enabled: true, soundEnabled: true, volume: 0.5}
🦐 Detection state changing from false to true
🦐 Detection started
```

### Background Console (service worker):
```
🦐 Background received: startDetection
🦐 Background: Offscreen document created
```

### Offscreen Console (offscreen.html):
```
🦐 Offscreen: Initializing MediaPipe...
🦐 Offscreen: MediaPipe ready
🦐 Offscreen received: start
🦐 Offscreen: Starting webcam...
🦐 Offscreen: Webcam started, beginning calibration...
```

---

## Still Stuck?

Run the full diagnostic:

```javascript
// Copy and paste this entire block into console:

console.log('=== FULL DIAGNOSTIC ===\n');

// 1. Extension basics
console.log('1. Extension ID:', chrome.runtime.id);
console.log('2. Can access chrome.storage?', typeof chrome.storage !== 'undefined');
console.log('3. Can send messages?', typeof chrome.runtime.sendMessage !== 'undefined');

// 2. Content script
const widget = document.getElementById('shrimpin-root');
console.log('4. Widget element exists?', !!widget);
if (widget && widget.shadowRoot) {
  console.log('5. Shadow DOM exists?', true);
  console.log('6. Status text:', widget.shadowRoot.getElementById('status-text')?.textContent);
} else {
  console.log('5. Shadow DOM exists?', false);
}

// 3. Storage
chrome.storage.local.get(null, (all) => {
  console.log('7. All storage data:', all);
});

// 4. Background connection
chrome.runtime.sendMessage({ action: 'getStatus' }, (response) => {
  if (chrome.runtime.lastError) {
    console.log('8. Background connection:', 'ERROR -', chrome.runtime.lastError.message);
  } else {
    console.log('8. Background connection:', 'OK', response);
  }
});

console.log('\n=== END DIAGNOSTIC ===');
console.log('Copy and share this output if you need help!');
```

Share the output and we can debug further!
