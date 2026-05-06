#!/bin/bash
# Launch full Shrimpin' website as floating window

cd ~/Shrimpin

# Open posture.html in frameless Brave window (always on top)
/Applications/Brave\ Browser.app/Contents/MacOS/Brave\ Browser \
  --app="file://$(pwd)/posture.html" \
  --new-window \
  --disable-features=TranslateUI \
  --window-size=800,900 \
  --window-position=100,50 &

echo "🦐 Shrimpin' Website launched as floating window!"
echo "Close the window to stop."
