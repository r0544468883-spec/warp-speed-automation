// 24.7 AUTOMATION - Background Service Worker

let activeApps = new Set();
let patternAlerts = [];

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'APP_DETECTED') {
    activeApps.add(message.data.app);
    updateBadge();
  }

  if (message.type === 'PATTERN_DETECTED') {
    patternAlerts.push({
      ...message.data,
      timestamp: Date.now()
    });
    // Keep last 50 alerts
    if (patternAlerts.length > 50) patternAlerts = patternAlerts.slice(-50);
    chrome.storage.local.set({ patternAlerts });
    updateBadge();

    // Show notification for high-confidence patterns
    if (message.data.count >= 3) {
      chrome.action.setBadgeBackgroundColor({ color: '#00F0FF' });
    }
  }

  if (message.type === 'GET_STATUS') {
    sendResponse({
      activeApps: Array.from(activeApps),
      patternAlerts: patternAlerts.slice(-10),
      totalPatterns: patternAlerts.length
    });
    return true;
  }
});

function updateBadge() {
  const count = patternAlerts.filter(a => Date.now() - a.timestamp < 3600000).length;
  chrome.action.setBadgeText({ text: count > 0 ? String(count) : '' });
  chrome.action.setBadgeBackgroundColor({ color: count > 5 ? '#7000FF' : '#00F0FF' });
}

// Clean up old data periodically
chrome.alarms.create('cleanup', { periodInMinutes: 60 });
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'cleanup') {
    const oneHourAgo = Date.now() - 3600000;
    patternAlerts = patternAlerts.filter(a => a.timestamp > oneHourAgo);
    chrome.storage.local.set({ patternAlerts });
    updateBadge();
  }
});
