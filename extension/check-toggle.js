// 🦐 SHRIMPIN' TOGGLE DEBUG SCRIPT
// Run this in the browser console (Cmd+Option+J) to diagnose toggle issues

console.log('🦐 === SHRIMPIN\' DEBUG START ===\n');

// 1. Check if content script is loaded
const widgetExists = !!document.getElementById('shrimpin-root');
console.log('1️⃣ Content script loaded:', widgetExists ? '✅ YES' : '❌ NO');
if (!widgetExists) {
  console.log('   → SOLUTION: Refresh the page (Cmd+R)');
}

// 2. Check current settings
chrome.storage.local.get(['settings'], (result) => {
  console.log('\n2️⃣ Current settings:', result.settings || 'None');

  if (result.settings) {
    console.log('   - Detection enabled:', result.settings.enabled ? '✅ ON' : '❌ OFF');
    console.log('   - Sound enabled:', result.settings.soundEnabled ? '✅ ON' : '❌ OFF');
    console.log('   - Volume:', Math.round((result.settings.volume || 0.5) * 100) + '%');
  } else {
    console.log('   → No settings found, extension may not be initialized');
  }
});

// 3. Check if extension can send messages
setTimeout(() => {
  console.log('\n3️⃣ Testing message to background...');
  chrome.runtime.sendMessage({ action: 'getStatus' }, (response) => {
    if (chrome.runtime.lastError) {
      console.log('   ❌ ERROR:', chrome.runtime.lastError.message);
    } else {
      console.log('   ✅ Background responded:', response);
    }
  });
}, 100);

// 4. Try to manually enable detection
setTimeout(() => {
  console.log('\n4️⃣ Attempting to enable detection via storage...');
  chrome.storage.local.set({
    settings: {
      enabled: true,
      volume: 0.5,
      soundEnabled: true
    }
  }, () => {
    console.log('   ✅ Storage updated! Check if widget appears.');
    console.log('   → Wait 2 seconds and look for the widget in bottom-right corner');
  });
}, 200);

// 5. Final check after 3 seconds
setTimeout(() => {
  console.log('\n5️⃣ Final status check...');

  const widget = document.getElementById('shrimpin-root');
  if (widget) {
    console.log('   ✅ Widget found!');
    const shadowRoot = widget.shadowRoot;
    if (shadowRoot) {
      const statusText = shadowRoot.getElementById('status-text');
      const statusDot = shadowRoot.getElementById('status-dot');
      console.log('   - Status:', statusText?.textContent || 'Unknown');
      console.log('   - Dot color:', statusDot?.className || 'Unknown');
    }
  } else {
    console.log('   ❌ Widget still not found');
    console.log('\n🔍 DIAGNOSIS:');
    console.log('   The extension loaded but the widget isn\'t appearing.');
    console.log('   Possible causes:');
    console.log('   1. Content script not injected → Refresh page');
    console.log('   2. Extension not loaded → Check chrome://extensions');
    console.log('   3. JavaScript error → Check console for red errors');
  }

  console.log('\n🦐 === DEBUG END ===\n');
  console.log('📝 Next steps:');
  console.log('1. If widget appeared → It\'s working! Try hunching forward.');
  console.log('2. If no widget → Open chrome://extensions and check for errors');
  console.log('3. Still issues? Read DEBUG_TOGGLE.md for detailed troubleshooting');
}, 3000);
