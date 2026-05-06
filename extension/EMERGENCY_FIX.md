# 🚨 EMERGENCY FIX - Get It Working NOW

## Step 1: Reload Extension

```bash
# Run in terminal:
open -a "Google Chrome" "chrome://extensions"
```

Find "Shrimpin' Detector" → Click the **circular arrow** (refresh)

---

## Step 2: Go to Google

Open a new tab: `google.com`

---

## Step 3: CLICK THE WIDGET

**Just click on the shrimp widget in the bottom-right corner!**

I just added code so clicking the widget will enable detection automatically.

---

## Expected Result

After clicking the widget:
1. Console will show: "🦐 Widget clicked - enabling detection"
2. Chrome asks for camera permission → Click "Allow"
3. Widget shows: "Starting..." then "Calibrating..."
4. Done!

---

## If That Doesn't Work - Nuclear Option

Run this in terminal to completely reset and reload:

```bash
cd /Users/moni/Shrimpin/extension

# Force reload Chrome
osascript -e 'tell application "Google Chrome" to reload active tab of window 1'
```

Then click the widget again.

---

## Still Not Working? - Direct Enable

Open console on google.com (Cmd+Option+J) and paste:

```javascript
document.getElementById('shrimpin-root').__vue__ = { enabled: true };
chrome.runtime.sendMessage({ action: 'startDetection' });
```

This forces it to start.
