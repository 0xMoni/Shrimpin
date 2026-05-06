/**
 * Shrimpin' Detector - Popup Controller
 */

(function() {
  'use strict';

  const elements = {
    toggleDetection: document.getElementById('toggle-detection'),
    toggleSound: document.getElementById('toggle-sound'),
    volumeSlider: document.getElementById('volume-slider'),
    volumeValue: document.getElementById('volume-value'),
    statusDot: document.getElementById('status-dot'),
    statusText: document.getElementById('status-text')
  };

  let state = {
    enabled: false,
    soundEnabled: true,
    volume: 0.5
  };

  // ============================================================================
  // INITIALIZATION
  // ============================================================================

  function init() {
    loadSettings();
    setupEventListeners();
  }

  // ============================================================================
  // LOAD SETTINGS
  // ============================================================================

  function loadSettings() {
    chrome.storage.local.get(['settings'], (result) => {
      if (result.settings) {
        state = { ...state, ...result.settings };

        // Update UI
        elements.toggleDetection.checked = state.enabled;
        elements.toggleSound.checked = state.soundEnabled;
        elements.volumeSlider.value = state.volume * 100;
        elements.volumeValue.textContent = Math.round(state.volume * 100) + '%';

        updateStatusUI();
      }
    });
  }

  // ============================================================================
  // EVENT LISTENERS
  // ============================================================================

  function setupEventListeners() {
    // Detection toggle
    elements.toggleDetection.addEventListener('change', (e) => {
      state.enabled = e.target.checked;
      console.log('🦐 Toggle clicked, enabled:', state.enabled);

      // Save and update UI
      saveSettings();
      updateStatusUI();

      // Force reload all tabs to pick up the change
      chrome.tabs.query({}, (tabs) => {
        tabs.forEach(tab => {
          chrome.tabs.reload(tab.id).catch(() => {});
        });
      });
    });

    // Sound toggle
    elements.toggleSound.addEventListener('change', (e) => {
      state.soundEnabled = e.target.checked;
      saveSettings();
      sendMessageToContent({
        action: 'updateSettings',
        settings: { soundEnabled: state.soundEnabled }
      });
    });

    // Volume slider
    elements.volumeSlider.addEventListener('input', (e) => {
      const volume = e.target.value / 100;
      state.volume = volume;
      elements.volumeValue.textContent = Math.round(volume * 100) + '%';
      saveSettings();
      sendMessageToContent({
        action: 'updateSettings',
        settings: { volume: state.volume }
      });
    });
  }

  // ============================================================================
  // SAVE SETTINGS
  // ============================================================================

  function saveSettings() {
    chrome.storage.local.set({ settings: state });
  }

  // ============================================================================
  // SEND MESSAGE TO CONTENT SCRIPT
  // ============================================================================

  function sendMessageToContent(message) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        console.log('Sending message to tab:', tabs[0].id, message);
        chrome.tabs.sendMessage(tabs[0].id, message, (response) => {
          if (chrome.runtime.lastError) {
            console.error('Content script error:', chrome.runtime.lastError.message);
          } else {
            console.log('Response from content script:', response);
          }
        });
      } else {
        console.error('No active tab found');
      }
    });
  }

  // ============================================================================
  // UPDATE STATUS UI
  // ============================================================================

  function updateStatusUI() {
    if (state.enabled) {
      elements.statusDot.className = 'dot active';
      elements.statusText.textContent = 'Detection Active';
    } else {
      elements.statusDot.className = 'dot inactive';
      elements.statusText.textContent = 'Detection Off';
    }
  }

  // ============================================================================
  // START
  // ============================================================================

  init();

})();
