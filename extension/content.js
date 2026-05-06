/**
 * Shrimpin' Detector - Content Script
 *
 * This script injects a floating shrimp widget into every webpage.
 * Uses Shadow DOM to prevent CSS conflicts with the host page.
 */

(function() {
  'use strict';

  // Prevent multiple injections
  if (window.__shrimpinInjected) return;
  window.__shrimpinInjected = true;

  console.log('🦐 Shrimpin\' Detector: Loading...');

  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================

  const state = {
    enabled: false,
    pollInterval: null,
    lastHunching: false,
    settings: {
      volume: 0.5,
      soundEnabled: true
    },
    position: { bottom: 20, right: 20 },
    onBreak: false,
    breakEndTime: 0,
    breakInterval: null
  };

  // ============================================================================
  // CREATE SHADOW DOM CONTAINER
  // ============================================================================

  const shadowHost = document.createElement('div');
  shadowHost.id = 'shrimpin-root';
  shadowHost.style.cssText = 'all: initial; position: fixed !important; bottom: 20px !important; right: 20px !important; z-index: 2147483647 !important; pointer-events: auto !important;';

  const shadowRoot = shadowHost.attachShadow({ mode: 'open' });

  // ============================================================================
  // WIDGET HTML
  // ============================================================================

  const widgetHTML = `
    <div id="widget">
      <div class="shrimp-bowl">
        <img id="frame1" class="shrimp active" alt="Shrimp">
        <img id="frame2" class="shrimp" alt="Shrimp">
      </div>
      <div class="counter" id="counter">0</div>
      <div class="status">
        <div id="status-dot" class="dot"></div>
        <span id="status-text">Offline</span>
      </div>
      <button id="start-btn" class="start-button">START</button>
    </div>

    <!-- Radial Menu -->
    <div class="radial-menu" id="radial-menu">
      <button class="radial-main" id="radial-main" title="Controls">
        <span class="radial-main-icon">+</span>
      </button>

      <div class="radial-item active" id="ri-faah" title="FAAH alert sound">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
          <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
        </svg>
        <span>FAAH</span>
      </div>

      <div class="radial-item" id="ri-vine" title="Vine Boom alert sound">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
          <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
        </svg>
        <span>VINE</span>
      </div>

      <div class="radial-item" id="ri-sound" title="Toggle alert sound">
        <svg id="icon-snd-on" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
          <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
        </svg>
        <svg id="icon-snd-off" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display:none">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
          <line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/>
        </svg>
        <span>SOUND</span>
      </div>

      <div class="radial-item" id="ri-break" title="Take a break">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M17 8h1a4 4 0 0 1 0 8h-1"/>
          <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z"/>
        </svg>
        <span>BREAK</span>
      </div>
    </div>

    <!-- Break Duration Picker -->
    <div class="break-picker" id="break-picker">
      <span class="bp-label">How long?</span>
      <div class="bp-options">
        <button class="bp-btn" data-minutes="5">5m</button>
        <button class="bp-btn" data-minutes="10">10m</button>
        <button class="bp-btn" data-minutes="15">15m</button>
      </div>
    </div>

    <!-- Break Timer Display -->
    <div class="break-overlay" id="break-overlay">
      <div class="bo-timer" id="bo-timer">05:00</div>
      <button class="bo-end" id="bo-end" title="End break">✕</button>
    </div>
  `;

  // ============================================================================
  // WIDGET STYLES (ISOLATED IN SHADOW DOM)
  // ============================================================================

  const widgetStyles = `
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    #widget {
      width: 200px;
      background: linear-gradient(135deg, rgba(30, 49, 80, 0.98), rgba(21, 34, 56, 0.98));
      border-radius: 20px;
      padding: 20px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
      border: 1px solid rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(10px);
      cursor: grab;
      user-select: none;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    }

    #widget:active {
      cursor: grabbing;
    }

    .shrimp-bowl {
      width: 120px;
      height: 120px;
      margin: 0 auto 16px;
      border-radius: 50%;
      background: linear-gradient(135deg, rgba(30, 49, 80, 0.8), rgba(21, 34, 56, 0.6));
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      overflow: hidden;
    }

    .shrimp {
      position: absolute;
      width: 80%;
      height: 80%;
      object-fit: contain;
      opacity: 0;
      transition: opacity 0.4s ease;
    }

    .shrimp.active {
      opacity: 1;
    }

    .counter {
      font-size: 48px;
      font-weight: 800;
      text-align: center;
      color: #fff;
      margin-bottom: 12px;
      text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
    }

    .status {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      font-size: 13px;
      color: rgba(245, 240, 232, 0.7);
    }

    .dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #666;
      transition: all 0.3s ease;
    }

    .dot.good { background: #4CAF50; }
    .dot.bad { background: #E8734A; animation: pulse 0.5s ease 3; }
    .dot.error { background: #F44336; }

    @keyframes pulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.3); }
    }

    .start-button {
      width: 100%;
      padding: 12px;
      margin-top: 12px;
      background: #E8734A;
      color: white;
      border: none;
      border-radius: 8px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      font-size: 14px;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.2s;
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    .start-button:hover {
      background: #F09070;
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(232, 115, 74, 0.4);
    }

    .start-button:active {
      transform: translateY(0);
    }

    .start-button.active {
      background: #059669;
    }

    /* ──────────────────────────────────────────────────
       RADIAL MENU
    ────────────────────────────────────────────────── */
    .radial-menu {
      position: absolute;
      top: -10px;
      right: -10px;
      width: 50px;
      height: 50px;
      z-index: 200;
    }

    .radial-main {
      position: absolute;
      inset: 0;
      border-radius: 50%;
      background: #E8734A;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 16px rgba(232,115,74,0.4);
      color: white;
      transition: box-shadow 0.25s;
      z-index: 2;
    }

    .radial-main:hover {
      box-shadow: 0 6px 24px rgba(232,115,74,0.6);
    }

    .radial-main-icon {
      font-size: 22px;
      font-weight: 300;
      line-height: 1;
      transition: transform 0.35s cubic-bezier(0.34,1.56,0.64,1);
      pointer-events: none;
    }

    .radial-menu.open .radial-main-icon {
      transform: rotate(45deg);
    }

    .radial-item {
      position: absolute;
      width: 42px;
      height: 42px;
      border-radius: 50%;
      background: rgba(21,34,56,0.95);
      border: 1px solid rgba(255,255,255,0.14);
      cursor: pointer;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 2px;
      font-size: 8px;
      font-weight: 700;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      color: white;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      transform-origin: center;
      transform: scale(0);
      opacity: 0;
      pointer-events: none;
      transition: transform 0.35s cubic-bezier(0.34,1.56,0.64,1), opacity 0.22s, background 0.18s;
    }

    .radial-item svg {
      width: 14px;
      height: 14px;
    }

    /* Positions - arc from top-right, going down and left (more spacing) */
    #ri-faah  { left: 15px; top: 70px; }
    #ri-vine  { left: -30px; top: 85px; }
    #ri-sound { left: -70px; top: 70px; }
    #ri-break { left: -90px; top: 30px; }

    .radial-menu.open #ri-faah  { transform: scale(1); opacity: 1; pointer-events: all; transition-delay: 0ms; }
    .radial-menu.open #ri-vine  { transform: scale(1); opacity: 1; pointer-events: all; transition-delay: 40ms; }
    .radial-menu.open #ri-sound { transform: scale(1); opacity: 1; pointer-events: all; transition-delay: 80ms; }
    .radial-menu.open #ri-break { transform: scale(1); opacity: 1; pointer-events: all; transition-delay: 120ms; }

    .radial-item:hover {
      background: rgba(255,255,255,0.15);
      box-shadow: 0 6px 18px rgba(0,0,0,0.4);
    }

    .radial-item.active {
      background: #E8734A;
      border-color: #F09070;
      box-shadow: 0 4px 16px rgba(232,115,74,0.4);
    }

    .radial-item.dimmed {
      opacity: 0.4 !important;
    }

    .radial-item.on-break {
      background: #0ea5e9;
      border-color: #38bdf8;
      box-shadow: 0 4px 16px rgba(14,165,233,0.4);
    }

    /* ──────────────────────────────────────────────────
       BREAK PICKER
    ────────────────────────────────────────────────── */
    .break-picker {
      position: absolute;
      top: 60px;
      right: 0;
      z-index: 201;
      background: rgba(18,30,52,0.96);
      backdrop-filter: blur(20px);
      border: 1px solid rgba(255,255,255,0.11);
      border-radius: 16px;
      padding: 12px 14px 10px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      opacity: 0;
      pointer-events: none;
      transform: translateY(10px);
      transition: opacity 0.22s, transform 0.25s cubic-bezier(0.34,1.56,0.64,1);
      box-shadow: 0 10px 40px rgba(0,0,0,0.45);
    }

    .break-picker.visible {
      opacity: 1;
      pointer-events: all;
      transform: translateY(0);
    }

    .bp-label {
      font-size: 9px;
      font-weight: 600;
      letter-spacing: 1px;
      text-transform: uppercase;
      color: rgba(245,240,232,0.6);
    }

    .bp-options {
      display: flex;
      gap: 6px;
    }

    .bp-btn {
      font-weight: 700;
      font-size: 12px;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      border: 1px solid rgba(255,255,255,0.13);
      background: rgba(255,255,255,0.06);
      color: white;
      cursor: pointer;
      transition: background 0.18s, box-shadow 0.18s, transform 0.15s;
    }

    .bp-btn:hover {
      background: #E8734A;
      box-shadow: 0 4px 16px rgba(232,115,74,0.4);
      transform: scale(1.1);
    }

    /* ──────────────────────────────────────────────────
       BREAK OVERLAY
    ────────────────────────────────────────────────── */
    .break-overlay {
      position: absolute;
      top: -35px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 300;
      display: flex;
      align-items: center;
      gap: 8px;
      background: rgba(14,165,233,0.95);
      padding: 8px 16px;
      border-radius: 20px;
      box-shadow: 0 4px 20px rgba(14,165,233,0.4);
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.35s;
    }

    .break-overlay.visible {
      opacity: 1;
      pointer-events: all;
    }

    .bo-timer {
      font-weight: 800;
      font-size: 16px;
      letter-spacing: 2px;
      color: white;
      text-shadow: 0 2px 8px rgba(0,0,0,0.3);
    }

    .bo-end {
      background: none;
      border: none;
      cursor: pointer;
      color: rgba(255,255,255,0.6);
      font-size: 14px;
      line-height: 1;
      padding: 2px;
      transition: color 0.15s;
    }

    .bo-end:hover {
      color: white;
    }

    @media print {
      #widget { display: none !important; }
    }
  `;

  // ============================================================================
  // INJECT INTO SHADOW DOM
  // ============================================================================

  shadowRoot.innerHTML = `
    <style>${widgetStyles}</style>
    ${widgetHTML}
  `;

  // ============================================================================
  // WAIT FOR DOM AND INJECT
  // ============================================================================

  function injectWidget() {
    if (document.body) {
      document.body.appendChild(shadowHost);
      console.log('🦐 Widget injected');
      initWidget();
    } else {
      document.addEventListener('DOMContentLoaded', () => {
        document.body.appendChild(shadowHost);
        console.log('🦐 Widget injected');
        initWidget();
      });
    }
  }

  // ============================================================================
  // INITIALIZE WIDGET
  // ============================================================================

  function initWidget() {
    const widget = shadowRoot.getElementById('widget');
    const frame1 = shadowRoot.getElementById('frame1');
    const frame2 = shadowRoot.getElementById('frame2');
    const startBtn = shadowRoot.getElementById('start-btn');

    // Load images
    frame1.src = chrome.runtime.getURL('assets/shrimp1.png');
    frame2.src = chrome.runtime.getURL('assets/shrimp2.png');

    console.log('🦐 Widget initialized');

    // START/STOP BUTTON CLICK HANDLER
    startBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();

      console.log('🦐 Button clicked! Current enabled state:', state.enabled, 'Poll interval:', !!state.pollInterval);

      if (!state.enabled || !state.pollInterval) {
        // START detection
        console.log('🦐 Starting detection...');
        state.enabled = true;
        startBtn.textContent = 'STOP';
        startBtn.classList.add('active');
        chrome.storage.local.set({ settings: { ...state.settings, enabled: true } });
        startDetection();
      } else {
        // STOP detection
        console.log('🦐 Stopping detection...');
        state.enabled = false;
        startBtn.textContent = 'START';
        startBtn.classList.remove('active');
        chrome.storage.local.set({ settings: { ...state.settings, enabled: false } });
        stopDetection();
      }
    });

    // Load saved settings
    chrome.storage.local.get(['settings', 'position'], (result) => {
      console.log('🦐 Loaded settings:', result);

      if (result.settings) {
        state.settings = { ...state.settings, ...result.settings };
        state.enabled = result.settings.enabled || false;
      }
      if (result.position) {
        state.position = result.position;
      }
      applyPosition();

      // Auto-start if enabled
      if (state.enabled) {
        console.log('🦐 Auto-starting detection (was enabled)');
        startDetection();
      } else {
        console.log('🦐 Detection not auto-starting (disabled)');
      }
    });

    // Also listen for clicks on the widget to toggle (easy manual control)
    widget.addEventListener('click', () => {
      if (!state.enabled) {
        console.log('🦐 Widget clicked - enabling detection');
        state.enabled = true;
        chrome.storage.local.set({ settings: { ...state.settings, enabled: true } });
        startDetection();
      }
    });

    // Animate shrimp
    animateShrimp();

    // Make draggable
    makeDraggable(widget);

    // Setup radial menu
    setupRadialMenu();
  }

  // ============================================================================
  // POSITION MANAGEMENT
  // ============================================================================

  function applyPosition() {
    shadowHost.style.setProperty('bottom', state.position.bottom + 'px', 'important');
    shadowHost.style.setProperty('right', state.position.right + 'px', 'important');
  }

  function savePosition() {
    try {
      chrome.storage.local.set({ position: state.position });
    } catch (err) {
      // Extension context invalidated (happens when extension is reloaded)
      console.log('🦐 Cannot save position - extension reloaded. Refresh page.');
    }
  }

  // ============================================================================
  // DRAGGABLE
  // ============================================================================

  function makeDraggable(widget) {
    let isDragging = false;
    let startX, startY, initialBottom, initialRight;

    widget.addEventListener('mousedown', (e) => {
      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;
      initialBottom = state.position.bottom;
      initialRight = state.position.right;
      e.preventDefault();
    });

    document.addEventListener('mousemove', (e) => {
      if (!isDragging) return;

      const deltaX = startX - e.clientX;
      const deltaY = e.clientY - startY;

      state.position.right = initialRight + deltaX;
      state.position.bottom = initialBottom - deltaY;

      // Keep within bounds
      state.position.right = Math.max(0, Math.min(window.innerWidth - 200, state.position.right));
      state.position.bottom = Math.max(0, Math.min(window.innerHeight - 300, state.position.bottom));

      applyPosition();
    });

    document.addEventListener('mouseup', () => {
      if (isDragging) {
        isDragging = false;
        savePosition();
      }
    });
  }

  // ============================================================================
  // RADIAL MENU
  // ============================================================================

  function setupRadialMenu() {
    const radialMenu = shadowRoot.getElementById('radial-menu');
    const radialMainBtn = shadowRoot.getElementById('radial-main');
    const riFaah = shadowRoot.getElementById('ri-faah');
    const riVine = shadowRoot.getElementById('ri-vine');
    const riSound = shadowRoot.getElementById('ri-sound');
    const riBreak = shadowRoot.getElementById('ri-break');
    const iconSndOn = shadowRoot.getElementById('icon-snd-on');
    const iconSndOff = shadowRoot.getElementById('icon-snd-off');
    const breakPicker = shadowRoot.getElementById('break-picker');
    const breakOverlay = shadowRoot.getElementById('break-overlay');
    const boTimer = shadowRoot.getElementById('bo-timer');
    const boEnd = shadowRoot.getElementById('bo-end');

    let menuOpen = false;

    // Toggle menu
    radialMainBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      menuOpen = !menuOpen;
      if (menuOpen) {
        radialMenu.classList.add('open');
      } else {
        radialMenu.classList.remove('open');
      }
    });

    // Close menu when clicking outside
    document.addEventListener('click', () => {
      if (menuOpen) {
        menuOpen = false;
        radialMenu.classList.remove('open');
      }
    });

    // FAAH sound
    riFaah.addEventListener('click', (e) => {
      e.stopPropagation();
      selectedSound = 'faah';
      riFaah.classList.add('active');
      riVine.classList.remove('active');
      console.log('🦐 Sound changed to: FAAH');
    });

    // VINE sound
    riVine.addEventListener('click', (e) => {
      e.stopPropagation();
      selectedSound = 'vine';
      riVine.classList.add('active');
      riFaah.classList.remove('active');
      console.log('🦐 Sound changed to: VINE');
    });

    // Sound toggle
    riSound.addEventListener('click', (e) => {
      e.stopPropagation();
      state.settings.soundEnabled = !state.settings.soundEnabled;

      if (state.settings.soundEnabled) {
        iconSndOn.style.display = '';
        iconSndOff.style.display = 'none';
        riSound.classList.remove('dimmed');
        console.log('🦐 Sound enabled');
      } else {
        iconSndOn.style.display = 'none';
        iconSndOff.style.display = '';
        riSound.classList.add('dimmed');
        console.log('🦐 Sound disabled');
      }

      // Save to storage
      chrome.storage.local.set({ settings: state.settings });
    });

    // BREAK button
    riBreak.addEventListener('click', (e) => {
      e.stopPropagation();
      if (state.onBreak) {
        // End break
        endBreak();
        menuOpen = false;
        radialMenu.classList.remove('open');
      } else {
        // Show picker
        menuOpen = false;
        radialMenu.classList.remove('open');
        breakPicker.classList.add('visible');
      }
    });

    // Break duration picker buttons
    shadowRoot.querySelectorAll('.bp-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const minutes = parseInt(btn.dataset.minutes);
        startBreak(minutes);
        breakPicker.classList.remove('visible');
      });
    });

    // Close picker when clicking outside
    document.addEventListener('click', () => {
      if (breakPicker.classList.contains('visible')) {
        breakPicker.classList.remove('visible');
      }
    });

    // End break button
    boEnd.addEventListener('click', (e) => {
      e.stopPropagation();
      endBreak();
    });
  }

  // ============================================================================
  // BREAK TIMER
  // ============================================================================

  function startBreak(minutes) {
    console.log(`🦐 Starting ${minutes} minute break`);

    state.onBreak = true;
    state.breakEndTime = Date.now() + (minutes * 60 * 1000);

    // Stop detection during break
    if (state.pollInterval) {
      clearInterval(state.pollInterval);
      state.pollInterval = null;
    }

    // Update UI
    const text = shadowRoot.getElementById('status-text');
    const riBreak = shadowRoot.getElementById('ri-break');
    const breakOverlay = shadowRoot.getElementById('break-overlay');

    text.textContent = `Break: ${minutes}min`;
    riBreak.classList.add('on-break');
    breakOverlay.classList.add('visible');

    // Start countdown
    updateBreakTimer();
    state.breakInterval = setInterval(updateBreakTimer, 1000);
  }

  function updateBreakTimer() {
    const remaining = Math.max(0, state.breakEndTime - Date.now());
    const minutes = Math.floor(remaining / 60000);
    const seconds = Math.floor((remaining % 60000) / 1000);

    const boTimer = shadowRoot.getElementById('bo-timer');
    boTimer.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

    if (remaining === 0) {
      endBreak();
    }
  }

  function endBreak() {
    console.log('🦐 Break ended');

    state.onBreak = false;
    if (state.breakInterval) {
      clearInterval(state.breakInterval);
      state.breakInterval = null;
    }

    // Update UI
    const riBreak = shadowRoot.getElementById('ri-break');
    const breakOverlay = shadowRoot.getElementById('break-overlay');

    riBreak.classList.remove('on-break');
    breakOverlay.classList.remove('visible');

    // Resume detection if it was enabled
    if (state.enabled) {
      const text = shadowRoot.getElementById('status-text');
      text.textContent = 'Connecting...';
      state.pollInterval = setInterval(pollBackend, 500);
      pollBackend();
    }
  }

  // ============================================================================
  // ANIMATION
  // ============================================================================

  function animateShrimp() {
    const frame1 = shadowRoot.getElementById('frame1');
    const frame2 = shadowRoot.getElementById('frame2');
    let current = 1;

    setInterval(() => {
      if (current === 1) {
        frame1.classList.remove('active');
        frame2.classList.add('active');
        current = 2;
      } else {
        frame1.classList.add('active');
        frame2.classList.remove('active');
        current = 1;
      }
    }, 600);
  }

  // ============================================================================
  // AUDIO
  // ============================================================================

  const sounds = {
    faah: new Audio(chrome.runtime.getURL('assets/faah.mp3')),
    vine: new Audio(chrome.runtime.getURL('assets/vine-boom.mp3'))
  };

  let selectedSound = 'faah';

  function playAlert() {
    if (!state.settings.soundEnabled) return;
    const sound = sounds[selectedSound];
    sound.volume = state.settings.volume;
    sound.currentTime = 0;
    sound.play().catch(() => {});
  }

  // ============================================================================
  // DETECTION CONTROL
  // ============================================================================

  function updatePostureStatus(data) {
    const dot = shadowRoot.getElementById('status-dot');
    const text = shadowRoot.getElementById('status-text');
    const counter = shadowRoot.getElementById('counter');

    // Update counter
    counter.textContent = data.count || 0;

    // Update status
    if (!data.calibrated) {
      if (data.countdown > 0) {
        text.textContent = `Calibrating in ${Math.ceil(data.countdown)}s...`;
      } else {
        text.textContent = `Calibrating ${Math.round((data.cal_progress || 0) * 100)}%`;
      }
      dot.className = 'dot';
    } else if (data.is_hunching) {
      text.textContent = 'Straighten up!';
      dot.className = 'dot bad';
      if (!state.lastHunching) {
        playAlert();
      }
      state.lastHunching = true;
    } else {
      text.textContent = 'Good posture';
      dot.className = 'dot good';
      state.lastHunching = false;
    }
  }

  // ============================================================================
  // BACKEND POLLING (Using Python backend)
  // ============================================================================

  async function pollBackend() {
    // Don't poll during break
    if (state.onBreak) return;

    try {
      const response = await fetch('http://localhost:8765/status');
      const data = await response.json();

      updatePostureStatus(data);

    } catch (error) {
      const dot = shadowRoot.getElementById('status-dot');
      const text = shadowRoot.getElementById('status-text');
      dot.className = 'dot error';
      text.textContent = 'Backend offline';
    }
  }

  function startDetection() {
    if (state.pollInterval) {
      console.log('🦐 Detection already running');
      return;
    }

    state.enabled = true;
    state.pollInterval = setInterval(pollBackend, 500);
    pollBackend();

    // Update status immediately
    const dot = shadowRoot.getElementById('status-dot');
    const text = shadowRoot.getElementById('status-text');
    const btn = shadowRoot.getElementById('start-btn');

    dot.className = 'dot';
    text.textContent = 'Connecting...';
    btn.textContent = 'STOP';
    btn.classList.add('active');

    console.log('🦐 Detection started - polling localhost:8765');
  }

  function stopDetection() {
    if (state.pollInterval) {
      clearInterval(state.pollInterval);
      state.pollInterval = null;
    }
    state.enabled = false;

    // Update status immediately
    const dot = shadowRoot.getElementById('status-dot');
    const text = shadowRoot.getElementById('status-text');
    const btn = shadowRoot.getElementById('start-btn');

    dot.className = 'dot';
    text.textContent = 'Offline';
    btn.textContent = 'START';
    btn.classList.remove('active');

    console.log('🦐 Detection stopped');
  }

  // ============================================================================
  // MESSAGE HANDLER (from popup)
  // ============================================================================

  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('Content script received message:', request);

    if (request.action === 'setDetection') {
      if (request.enabled) {
        startDetection();
        sendResponse({ success: true, enabled: true });
      } else {
        stopDetection();
        sendResponse({ success: true, enabled: false });
      }
    } else if (request.action === 'getStatus') {
      sendResponse({ enabled: state.enabled });
    } else if (request.action === 'updateSettings') {
      state.settings = { ...state.settings, ...request.settings };
      chrome.storage.local.set({ settings: state.settings });
      sendResponse({ success: true });
    } else if (request.action === 'postureStatus') {
      // Receive status updates from offscreen document (via background)
      updatePostureStatus(request.status);
      sendResponse({ received: true });
    }
    return true;
  });

  // ============================================================================
  // STORAGE CHANGE LISTENER
  // ============================================================================

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && changes.settings) {
      const newSettings = changes.settings.newValue;
      console.log('🦐 Storage changed:', newSettings);

      if (newSettings) {
        // Get the old enabled state BEFORE updating
        const oldEnabled = state.enabled;

        // Update local state
        state.settings = { ...state.settings, ...newSettings };

        // Handle detection toggle
        if (newSettings.enabled !== undefined && newSettings.enabled !== oldEnabled) {
          console.log('🦐 Detection state changing from', oldEnabled, 'to', newSettings.enabled);

          // Update state.enabled before calling start/stop
          state.enabled = newSettings.enabled;

          if (newSettings.enabled) {
            startDetection();
          } else {
            stopDetection();
          }
        }
      }
    }
  });

  // ============================================================================
  // INITIALIZE
  // ============================================================================

  injectWidget();

})();
