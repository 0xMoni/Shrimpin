# 🦐 Shrimpin' Extension Architecture

## How It Works (Browser-Only)

```
┌─────────────────────────────────────────────────────────────────┐
│                        CHROME BROWSER                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌─────────────────┐         ┌──────────────────┐              │
│  │   POPUP.HTML    │         │  BACKGROUND.JS   │              │
│  │  (Extension UI) │◄────────│ (Service Worker) │              │
│  │                 │         │                  │              │
│  │  • Toggle ON/OFF│         │  • Manages       │              │
│  │  • Volume       │         │    offscreen doc │              │
│  │  • Sound        │         │  • Relays msgs   │              │
│  └─────────────────┘         └────────┬─────────┘              │
│                                       │                          │
│                                       │                          │
│  ┌────────────────────────────────────▼──────────────────────┐  │
│  │              OFFSCREEN.HTML (Hidden)                      │  │
│  │  ┌──────────────────────────────────────────────────┐    │  │
│  │  │  OFFSCREEN.JS                                    │    │  │
│  │  │                                                  │    │  │
│  │  │  • MediaPipe Pose Detection                     │    │  │
│  │  │  • Webcam access                                │    │  │
│  │  │  • Calculates posture metrics:                  │    │  │
│  │  │    - Shrimp ratio (nose/shoulder/eye angles)    │    │  │
│  │  │    - Head forward lean                          │    │  │
│  │  │    - Shoulder drop                              │    │  │
│  │  │    - Sideways tilt                              │    │  │
│  │  │  • Calibration (3s wait + 45 frames)            │    │  │
│  │  │  • Broadcasts status updates                    │    │  │
│  │  └──────────────────────────────────────────────────┘    │  │
│  │                                                            │  │
│  │  <video id="webcam"> (streams camera)                     │  │
│  │  📹                                                        │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                ▲                                 │
│                                │                                 │
│                         Status Updates                           │
│                                │                                 │
│  ┌─────────────────────────────┴──────────────────────────┐    │
│  │              CONTENT.JS (Injected in every tab)         │    │
│  │                                                          │    │
│  │  • Injects floating widget (Shadow DOM)                │    │
│  │  • Receives posture status from offscreen              │    │
│  │  • Plays alert sounds (faah.mp3 / vine-boom.mp3)       │    │
│  │  • Animates shrimp when bad posture detected           │    │
│  │  • Draggable widget                                     │    │
│  │                                                          │    │
│  │  ┌────────────────────────────────────────┐            │    │
│  │  │  🦐 FLOATING WIDGET (Shadow DOM)       │            │    │
│  │  │                                         │            │    │
│  │  │     [Shrimp Animation]                 │            │    │
│  │  │        Counter: 03                     │            │    │
│  │  │     ● Good posture / ● Shrimping!      │            │    │
│  │  └────────────────────────────────────────┘            │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow

### 1. User Enables Detection (in popup)

```
User clicks toggle → popup.js → chrome.storage.local.set({ enabled: true })
                              → sendMessage to content.js
                              → content.js sends 'startDetection' to background.js
```

### 2. Background Starts Offscreen Document

```
background.js → chrome.offscreen.createDocument('offscreen.html')
              → offscreen.js initializes MediaPipe
              → Requests webcam access
              → Starts calibration (3s countdown + 45 frames)
```

### 3. Calibration Phase

```
offscreen.js:
  1. Waits 3 seconds (user sits in good posture)
  2. Collects 45 frames of pose landmarks
  3. Calculates baseline metrics:
     - baseline_ratio
     - baseline_fwd
     - baseline_drop
     - baseline_tilt
  4. Sets entry/exit thresholds (based on sensitivity)
  5. Broadcasts: { calibrated: true }
```

### 4. Detection Phase (Every Frame)

```
offscreen.js:
  1. MediaPipe detects 33 pose landmarks
  2. Calculates current metrics:
     - ratio = (eyes→nose) / (nose→shoulder)
     - fwd = abs(ears.x - shoulders.x)
     - drop = shoulders.y / hips.y
     - tilt = abs(left_ear.y - right_ear.y)
  3. Compares to thresholds
  4. Updates sliding window (15 frames)
  5. If bad_posture_ratio > 0.55 → is_shrimping = true
  6. Broadcasts: { is_hunching: true, count: X }
```

### 5. Widget Updates

```
offscreen.js → background.js → content.js (all tabs)

content.js receives status:
  - Updates counter
  - Changes dot color (green/red)
  - Plays alert sound (if first bad posture frame)
  - Shows "Straighten up!" message
```

## Key Files

| File | Purpose |
|------|---------|
| `manifest.json` | Extension config (permissions, entry points) |
| `background.js` | Service worker, manages offscreen document lifecycle |
| `offscreen.html` | Hidden page that runs MediaPipe |
| `offscreen.js` | **Core detection logic** (Python ported to JS) |
| `content.js` | Injects widget into pages, handles UI updates |
| `popup/popup.html` | Extension popup (toggle, settings) |
| `popup/popup.js` | Popup controls |
| `assets/pose_landmarker_lite.task` | MediaPipe model (5.5MB) |
| `assets/shrimp1.png`, `shrimp2.png` | Shrimp animation frames |
| `assets/faah.mp3`, `vine-boom.mp3` | Alert sounds |

## Posture Metrics (How Shrimping is Detected)

### 1. Shrimp Ratio
```
ratio = (eyes→nose distance) / (nose→shoulder distance)
```
When you hunch forward, your nose gets closer to your shoulders → ratio increases.

### 2. Head Forward Lean
```
fwd = abs(ears.x - shoulders.x)
```
Forward head posture → ears shift horizontally away from shoulders.

### 3. Shoulder Drop
```
drop = shoulders.y / hips.y
```
Slouching → shoulders drop relative to hips.

### 4. Sideways Tilt
```
tilt = abs(left_ear.y - right_ear.y)
```
Leaning to one side → ears at different heights.

### Detection Logic (Sliding Window)

```
window = [bad, bad, good, bad, bad, bad, ...] (15 frames)

if not_shrimping and (bad_count / 15) > 0.55:
    → ENTER shrimping state
    → count++
    → play alert

if shrimping and (bad_count / 15) < 0.25:
    → EXIT shrimping state
```

**Hysteresis** (entry 0.55, exit 0.25) prevents flickering.

## MediaPipe vs Python Backend

| Feature | Python Backend | Browser Extension |
|---------|----------------|-------------------|
| Setup | `pip install`, run script | Just load extension |
| Webcam | OpenCV | `navigator.mediaDevices.getUserMedia()` |
| Pose Detection | `mediapipe` Python | `@mediapipe/tasks-vision` JS |
| Model | `pose_landmarker_lite.task` | Same file, bundled |
| Detection Logic | Python functions | JS functions (ported 1:1) |
| Video Stream | MJPEG over HTTP | Hidden `<video>` element |
| Status API | `http://localhost:8765/status` | `chrome.runtime.sendMessage()` |

---

**Result:** Same detection algorithm, zero external dependencies! 🦐✨
