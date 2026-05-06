/**
 * Shrimpin' Detector - Offscreen Document
 *
 * This hidden page runs MediaPipe pose detection in the browser.
 * Replaces the Python backend entirely.
 */

import { PoseLandmarker, FilesetResolver } from 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14';

// ============================================================================
// LANDMARK INDICES (same as Python)
// ============================================================================

const NOSE = 0;
const LEFT_EYE = 2;
const RIGHT_EYE = 5;
const LEFT_EAR = 7;
const RIGHT_EAR = 8;
const LEFT_SHOULDER = 11;
const RIGHT_SHOULDER = 12;
const LEFT_HIP = 23;
const RIGHT_HIP = 24;

// ============================================================================
// SENSITIVITY (same as Python "normal" preset)
// ============================================================================

const SENSITIVITY = {
  ratio_offset: 0.06,
  fwd_offset: 0.020,
  drop_offset: 0.020,
  tilt_offset: 0.020,
  required_frames: 15,
  bad_threshold: 0.55,
  good_threshold: 0.25
};

// ============================================================================
// STATE
// ============================================================================

const state = {
  // Calibration
  calibrated: false,
  calibrating: false,
  calibration_wait_start: null,
  calibration_data_ratio: [],
  calibration_data_fwd: [],
  calibration_data_drop: [],
  calibration_data_tilt: [],

  // Baselines
  baseline_ratio: null,
  baseline_fwd: null,
  baseline_drop: null,
  baseline_tilt: null,

  // Thresholds
  entry_ratio: 999,
  exit_ratio: 999,
  entry_fwd: 999,
  exit_fwd: 999,
  entry_drop: 999,
  exit_drop: 999,
  entry_tilt: 999,
  exit_tilt: 999,

  // Detection
  is_shrimping: false,
  shrimp_count: 0,
  window: [],
  window_size: 15,

  // MediaPipe
  poseLandmarker: null,
  stream: null,
  video: null,
  canvas: null,
  ctx: null,
  detecting: false,
  lastVideoTime: -1
};

const CALIBRATION_WAIT = 3.0; // seconds
const CALIBRATION_FRAMES = 45;

// ============================================================================
// INITIALIZATION
// ============================================================================

async function init() {
  console.log('🦐 Offscreen: Initializing MediaPipe...');

  try {
    // Initialize MediaPipe
    const vision = await FilesetResolver.forVisionTasks(
      'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm'
    );

    state.poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: chrome.runtime.getURL('assets/pose_landmarker_lite.task'),
        delegate: 'GPU'
      },
      runningMode: 'VIDEO',
      numPoses: 1
    });

    console.log('🦐 Offscreen: MediaPipe ready');

    // Setup video elements
    state.video = document.getElementById('webcam');
    state.canvas = document.getElementById('canvas');
    state.ctx = state.canvas.getContext('2d');

    // Listen for messages from background script
    chrome.runtime.onMessage.addListener(handleMessage);

    console.log('🦐 Offscreen: Ready and waiting for start command');

  } catch (error) {
    console.error('🦐 Offscreen: Failed to initialize:', error);
  }
}

// ============================================================================
// MESSAGE HANDLER
// ============================================================================

function handleMessage(request, sender, sendResponse) {
  console.log('🦐 Offscreen received:', request.action);

  if (request.action === 'start') {
    startDetection().then(() => {
      sendResponse({ success: true });
    }).catch(err => {
      sendResponse({ success: false, error: err.message });
    });
    return true; // async response
  }

  if (request.action === 'stop') {
    stopDetection();
    sendResponse({ success: true });
    return false;
  }

  if (request.action === 'recalibrate') {
    resetCalibration();
    sendResponse({ success: true });
    return false;
  }

  if (request.action === 'getStatus') {
    sendResponse({
      calibrated: state.calibrated,
      is_hunching: state.is_shrimping,
      count: state.shrimp_count,
      detecting: state.detecting
    });
    return false;
  }
}

// ============================================================================
// START / STOP DETECTION
// ============================================================================

async function startDetection() {
  if (state.detecting) {
    console.log('🦐 Offscreen: Already detecting');
    return;
  }

  console.log('🦐 Offscreen: Starting webcam...');

  try {
    state.stream = await navigator.mediaDevices.getUserMedia({
      video: {
        width: { ideal: 640 },
        height: { ideal: 480 },
        facingMode: 'user'
      }
    });

    state.video.srcObject = state.stream;
    await state.video.play();

    state.detecting = true;
    state.calibrating = true;
    resetCalibration();

    console.log('🦐 Offscreen: Webcam started, beginning calibration...');

    // Start detection loop
    detectLoop();

  } catch (error) {
    console.error('🦐 Offscreen: Failed to start webcam:', error);
    throw error;
  }
}

function stopDetection() {
  console.log('🦐 Offscreen: Stopping detection');

  state.detecting = false;

  if (state.stream) {
    state.stream.getTracks().forEach(track => track.stop());
    state.stream = null;
  }

  if (state.video) {
    state.video.srcObject = null;
  }

  resetCalibration();
}

// ============================================================================
// DETECTION LOOP
// ============================================================================

async function detectLoop() {
  if (!state.detecting) return;

  const now = state.video.currentTime;

  // Only process if video has new frame
  if (now !== state.lastVideoTime && !state.video.paused && !state.video.ended) {
    state.lastVideoTime = now;

    const results = state.poseLandmarker.detectForVideo(state.video, performance.now());

    if (results.landmarks && results.landmarks.length > 0) {
      const landmarks = results.landmarks[0];

      if (state.calibrating) {
        processCalibrationFrame(landmarks);
      } else {
        processDetectionFrame(landmarks);
      }
    }
  }

  // Continue loop
  requestAnimationFrame(detectLoop);
}

// ============================================================================
// CALIBRATION
// ============================================================================

function resetCalibration() {
  state.calibrated = false;
  state.calibrating = true;
  state.calibration_wait_start = null;
  state.calibration_data_ratio = [];
  state.calibration_data_fwd = [];
  state.calibration_data_drop = [];
  state.calibration_data_tilt = [];
  state.baseline_ratio = null;
  state.baseline_fwd = null;
  state.baseline_drop = null;
  state.baseline_tilt = null;
  state.is_shrimping = false;
  state.window = [];
  console.log('🦐 Offscreen: Calibration reset');
}

function processCalibrationFrame(landmarks) {
  const now = performance.now() / 1000;

  // Start countdown
  if (state.calibration_wait_start === null) {
    state.calibration_wait_start = now;
  }

  const elapsed = now - state.calibration_wait_start;

  // Wait 3 seconds before collecting samples
  if (elapsed < CALIBRATION_WAIT) {
    broadcastStatus({
      calibrated: false,
      countdown: Math.max(0, CALIBRATION_WAIT - elapsed),
      cal_progress: 0,
      is_hunching: false,
      count: state.shrimp_count
    });
    return;
  }

  // Collect calibration samples
  state.calibration_data_ratio.push(calcShrimpRatio(landmarks));
  state.calibration_data_fwd.push(calcHeadForward(landmarks));
  state.calibration_data_drop.push(calcShoulderDrop(landmarks));
  state.calibration_data_tilt.push(calcSidewaysTilt(landmarks));

  const progress = state.calibration_data_ratio.length / CALIBRATION_FRAMES;

  broadcastStatus({
    calibrated: false,
    countdown: 0,
    cal_progress: progress,
    is_hunching: false,
    count: state.shrimp_count
  });

  // Done calibrating
  if (state.calibration_data_ratio.length >= CALIBRATION_FRAMES) {
    const avg = arr => arr.reduce((a, b) => a + b, 0) / arr.length;

    state.baseline_ratio = avg(state.calibration_data_ratio);
    state.baseline_fwd = avg(state.calibration_data_fwd);
    state.baseline_drop = avg(state.calibration_data_drop);
    state.baseline_tilt = avg(state.calibration_data_tilt);

    state.entry_ratio = state.baseline_ratio + SENSITIVITY.ratio_offset;
    state.exit_ratio = state.baseline_ratio + SENSITIVITY.ratio_offset * 0.5;
    state.entry_fwd = state.baseline_fwd + SENSITIVITY.fwd_offset;
    state.exit_fwd = state.baseline_fwd + SENSITIVITY.fwd_offset * 0.5;
    state.entry_drop = state.baseline_drop + SENSITIVITY.drop_offset;
    state.exit_drop = state.baseline_drop + SENSITIVITY.drop_offset * 0.5;
    state.entry_tilt = state.baseline_tilt + SENSITIVITY.tilt_offset;
    state.exit_tilt = state.baseline_tilt + SENSITIVITY.tilt_offset * 0.5;

    state.calibrated = true;
    state.calibrating = false;

    console.log('🦐 Offscreen: Calibration complete!', {
      baseline_ratio: state.baseline_ratio.toFixed(3),
      baseline_fwd: state.baseline_fwd.toFixed(3),
      baseline_drop: state.baseline_drop.toFixed(3),
      baseline_tilt: state.baseline_tilt.toFixed(3)
    });
  }
}

// ============================================================================
// DETECTION
// ============================================================================

function processDetectionFrame(landmarks) {
  const ratio = calcShrimpRatio(landmarks);
  const fwd = calcHeadForward(landmarks);
  const drop = calcShoulderDrop(landmarks);
  const tilt = calcSidewaysTilt(landmarks);

  let is_bad;

  if (state.is_shrimping) {
    // Use exit thresholds (tighter)
    is_bad = (ratio > state.exit_ratio ||
              fwd > state.exit_fwd ||
              drop > state.exit_drop ||
              tilt > state.exit_tilt);
  } else {
    // Use entry thresholds
    is_bad = (ratio > state.entry_ratio ||
              fwd > state.entry_fwd ||
              drop > state.entry_drop ||
              tilt > state.entry_tilt);
  }

  state.window.push(is_bad);
  if (state.window.length > state.window_size) {
    state.window.shift();
  }

  if (state.window.length >= state.window_size) {
    const bad_count = state.window.filter(x => x).length;
    const bad_frac = bad_count / state.window.length;

    // Enter shrimping state
    if (!state.is_shrimping && bad_frac >= SENSITIVITY.bad_threshold) {
      state.is_shrimping = true;
      state.shrimp_count++;
      console.log('🦐 Offscreen: SHRIMPIN\' DETECTED! Count:', state.shrimp_count);
    }
    // Exit shrimping state
    else if (state.is_shrimping && bad_frac < SENSITIVITY.good_threshold) {
      state.is_shrimping = false;
      console.log('🦐 Offscreen: Good posture restored');
    }
  }

  broadcastStatus({
    calibrated: true,
    countdown: 0,
    cal_progress: 1.0,
    is_hunching: state.is_shrimping,
    count: state.shrimp_count,
    ratio: ratio,
    threshold: state.entry_ratio,
    baseline: state.baseline_ratio
  });
}

// ============================================================================
// POSTURE CALCULATIONS (ported from Python)
// ============================================================================

function calcShrimpRatio(landmarks) {
  const nose_y = landmarks[NOSE].y;
  const eye_avg_y = (landmarks[LEFT_EYE].y + landmarks[RIGHT_EYE].y) / 2.0;
  const shoulder_avg_y = (landmarks[LEFT_SHOULDER].y + landmarks[RIGHT_SHOULDER].y) / 2.0;

  const eyes_to_nose = nose_y - eye_avg_y;
  const nose_to_shoulder = shoulder_avg_y - nose_y;

  if (nose_to_shoulder <= 0.001) return 999.0;
  return eyes_to_nose / nose_to_shoulder;
}

function calcHeadForward(landmarks) {
  const avg_ear = (landmarks[LEFT_EAR].x + landmarks[RIGHT_EAR].x) / 2;
  const avg_shoulder = (landmarks[LEFT_SHOULDER].x + landmarks[RIGHT_SHOULDER].x) / 2;
  return Math.abs(avg_ear - avg_shoulder);
}

function calcShoulderDrop(landmarks) {
  const shoulder_mid_y = (landmarks[LEFT_SHOULDER].y + landmarks[RIGHT_SHOULDER].y) / 2.0;
  const hip_mid_y = (landmarks[LEFT_HIP].y + landmarks[RIGHT_HIP].y) / 2.0;

  if (hip_mid_y <= 0.001) return 0.0;
  return shoulder_mid_y / hip_mid_y;
}

function calcSidewaysTilt(landmarks) {
  return Math.abs(landmarks[LEFT_EAR].y - landmarks[RIGHT_EAR].y);
}

// ============================================================================
// BROADCAST STATUS TO ALL TABS
// ============================================================================

function broadcastStatus(status) {
  chrome.runtime.sendMessage({
    action: 'statusUpdate',
    status: status
  }).catch(() => {
    // Background might not be listening, that's ok
  });
}

// ============================================================================
// START
// ============================================================================

init();
