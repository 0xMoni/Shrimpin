#!/bin/bash
# Launch Shrimpin' Desktop Widget as a floating window

cd ~/Shrimpin

# Open in Chrome app mode (frameless, always on top)
/Applications/Brave\ Browser.app/Contents/MacOS/Brave\ Browser \
  --app="file://$(pwd)/desktop_widget.html" \
  --window-size=260,360 \
  --window-position=100,100 \
  --new-window \
  --disable-features=TranslateUI \
  --class=ShrimpinWidget &

echo "🦐 Shrimpin' Widget launched!"
echo "Make sure posture_detector.py is running!"
