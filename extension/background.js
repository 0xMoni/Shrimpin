/**
 * Shrimpin' Detector - Background Service Worker
 *
 * Manages offscreen document lifecycle and relays messages
 */

let offscreenDocumentCreated = false;

// ============================================================================
// INITIALIZATION
// ============================================================================

chrome.runtime.onInstalled.addListener(() => {
  console.log('🦐 Shrimpin\' Detector installed');

  // Set default settings
  chrome.storage.local.get(['settings'], (result) => {
    if (!result.settings) {
      chrome.storage.local.set({
        settings: {
          enabled: false,
          volume: 0.5,
          soundEnabled: true
        }
      });
    }
  });
});

// ============================================================================
// OFFSCREEN DOCUMENT MANAGEMENT
// ============================================================================

async function createOffscreenDocument() {
  if (offscreenDocumentCreated) {
    console.log('🦐 Background: Offscreen document already exists');
    return;
  }

  try {
    await chrome.offscreen.createDocument({
      url: 'offscreen.html',
      reasons: ['USER_MEDIA'],
      justification: 'Webcam access for posture detection using MediaPipe'
    });
    offscreenDocumentCreated = true;
    console.log('🦐 Background: Offscreen document created');
  } catch (error) {
    if (error.message.includes('Only a single offscreen document')) {
      offscreenDocumentCreated = true;
      console.log('🦐 Background: Offscreen document already exists (caught error)');
    } else {
      console.error('🦐 Background: Failed to create offscreen document:', error);
      throw error;
    }
  }
}

async function closeOffscreenDocument() {
  if (!offscreenDocumentCreated) return;

  try {
    await chrome.offscreen.closeDocument();
    offscreenDocumentCreated = false;
    console.log('🦐 Background: Offscreen document closed');
  } catch (error) {
    console.error('🦐 Background: Failed to close offscreen document:', error);
  }
}

// ============================================================================
// MESSAGE HANDLING
// ============================================================================

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('🦐 Background received:', request.action);

  // Status updates from offscreen → broadcast to all tabs
  if (request.action === 'statusUpdate') {
    chrome.tabs.query({}, (tabs) => {
      tabs.forEach(tab => {
        chrome.tabs.sendMessage(tab.id, {
          action: 'postureStatus',
          status: request.status
        }).catch(() => {
          // Tab might not have content script, ignore
        });
      });
    });
    return false;
  }

  // Start detection
  if (request.action === 'startDetection') {
    console.log('🦐 Background: Creating offscreen document...');
    createOffscreenDocument().then(() => {
      console.log('🦐 Background: Offscreen created, sending start message...');
      // Send message to offscreen document
      return chrome.runtime.sendMessage({ action: 'start' });
    }).then(() => {
      console.log('🦐 Background: Start message sent successfully');
      sendResponse({ success: true });
    }).catch(error => {
      console.error('🦐 Background: Error:', error);
      sendResponse({ success: false, error: error.message });
    });
    return true; // async response
  }

  // Stop detection
  if (request.action === 'stopDetection') {
    chrome.runtime.sendMessage({ action: 'stop' }).then(() => {
      sendResponse({ success: true });
    }).catch(error => {
      sendResponse({ success: false, error: error.message });
    });
    return true; // async response
  }

  // Echo for connection testing
  sendResponse({ received: true });
  return false;
});
