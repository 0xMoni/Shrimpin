# 🐛 Debug Toggle Button

Follow these steps to find where the toggle is failing:

## Step 1: Check Popup Console

1. Click the 🦐 extension icon to open popup
2. **Right-click inside the popup** → **Inspect**
3. Go to **Console** tab
4. Click the toggle switch
5. Look for messages like:
   ```
   Toggle clicked, enabled: true
   Sending message to tab: ...
   Response from content script: ...
   ```

**What to look for:**
- ❌ If you see **"No active tab found"** → Open a normal webpage first (not chrome:// pages)
- ❌ If you see **"Content script error"** → Content script not loaded, refresh the page
- ✅ If you see the messages → Popup is working, issue is elsewhere

---

## Step 2: Check Page Console (Content Script)

1. Open any normal webpage (e.g., `google.com`)
2. Press `Cmd+Option+J` (or `F12`)
3. Go to **Console** tab
4. Click the extension toggle again
5. Look for messages starting with **🦐**:
   ```
   🦐 Content script received message: {action: "setDetection", enabled: true}
   🦐 Detection started
   ```

**What to look for:**
- ❌ **No messages at all** → Content script not injected, refresh page
- ❌ **"Detection already running"** → It's already on, try toggling OFF then ON
- ❌ **"Failed to start detection: ..."** → Background/offscreen issue, check next step
- ✅ **"Detection started"** → Content script working, check background next

---

## Step 3: Check Background Service Worker

1. Go to `chrome://extensions`
2. Find **Shrimpin' Detector**
3. Click **"service worker"** link (blue text)
4. Console will open
5. Toggle the switch again
6. Look for:
   ```
   🦐 Background received: startDetection
   🦐 Background: Offscreen document created
   ```

**What to look for:**
- ❌ **"Offscreen document already exists"** → Try step 4 to reset
- ❌ **"Failed to create offscreen document"** → Restart Chrome completely
- ❌ **No messages** → Background not receiving message, issue in content script
- ✅ **Messages appear** → Background working, check offscreen next

---

## Step 4: Check Offscreen Document

1. Go to `chrome://extensions`
2. Find **Shrimpin' Detector**
3. Look for **"Inspect views: offscreen.html"** (appears after you toggle ON)
4. Click it to open console
5. Look for:
   ```
   🦐 Offscreen: Initializing MediaPipe...
   🦐 Offscreen: MediaPipe ready
   🦐 Offscreen received: start
   🦐 Offscreen: Starting webcam...
   ```

**What to look for:**
- ❌ **"Failed to initialize"** → Model file missing or corrupt
- ❌ **"Failed to start webcam"** → Camera permission denied
- ❌ **Import errors** → Check if offscreen.js has syntax errors
- ✅ **All messages appear** → Everything is working!

---

## Quick Fixes

### Fix 1: Refresh Everything
```bash
1. Go to chrome://extensions
2. Click refresh icon on Shrimpin' extension
3. Close all tabs
4. Open a new tab to google.com
5. Try toggle again
```

### Fix 2: Check Permissions
```bash
1. Go to chrome://settings/content/camera
2. Find Shrimpin' extension
3. Ensure it's set to "Allow"
4. Go to chrome://extensions
5. Click "Details" on Shrimpin'
6. Check "Site access" is set to "On all sites"
```

### Fix 3: Reset Extension
```bash
1. Go to chrome://extensions
2. Click "Remove" on Shrimpin'
3. Load it again: "Load unpacked"
4. Select /Users/moni/Shrimpin/extension/
5. Try toggle
```

### Fix 4: Clear Storage
```bash
# In browser console (Cmd+Option+J):
chrome.storage.local.clear()
# Then refresh page and try again
```

---

## Common Issues & Solutions

### Issue: "No active tab found"
**Solution:** Don't try to toggle while on `chrome://` pages. Open a regular website first.

### Issue: Toggle switches but nothing happens
**Solution:** Check if content script loaded. Look for widget on the page. If not there, refresh the page.

### Issue: "Offscreen document failed to create"
**Solution:** Restart Chrome completely (close all windows, reopen).

### Issue: Widget appears but stays grey/offline
**Solution:** Check offscreen console for webcam errors. Grant camera permission.

### Issue: Toggle works once, then stops working
**Solution:** Background service worker might have gone to sleep. Refresh the extension.

---

## Expected Complete Flow

When toggle works correctly, you should see:

1. **Popup Console:**
   ```
   Toggle clicked, enabled: true
   Sending message to tab: ...
   ```

2. **Page Console:**
   ```
   🦐 Content script received message: {action: "setDetection"}
   🦐 Detection started
   ```

3. **Background Console:**
   ```
   🦐 Background received: startDetection
   🦐 Background: Offscreen document created
   ```

4. **Offscreen Console:**
   ```
   🦐 Offscreen: Initializing MediaPipe...
   🦐 Offscreen: MediaPipe ready
   🦐 Offscreen received: start
   🦐 Offscreen: Starting webcam...
   🦐 Offscreen: Webcam started, beginning calibration...
   ```

5. **Page (Widget):**
   - Widget appears in bottom-right
   - Status shows "Calibrating in 3s..."
   - After calibration: Green dot + "Good posture"

---

## Still Not Working?

Run this diagnostic script in the page console:

```javascript
// Check if content script loaded
console.log('Widget exists?', !!document.getElementById('shrimpin-root'));

// Check storage
chrome.storage.local.get(['settings'], (result) => {
  console.log('Settings:', result);
});

// Try to start detection manually
chrome.runtime.sendMessage({ action: 'startDetection' }, (response) => {
  console.log('Manual start response:', response);
});
```

Share the output and I can help debug further!
