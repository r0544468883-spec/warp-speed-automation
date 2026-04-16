// 24.7 AUTOMATION v2 - Content Script
// Throttled event tracking + per-site toggle + cross-tab events

(async function() {
  const APP_NAME = detectApp();
  const host = window.location.hostname;

  // ── Per-Site Toggle ─────────────────────────────────────────────
  const syncData = await chrome.storage.sync.get(['disabledSites']);
  const disabled = syncData.disabledSites || [];
  if (disabled.includes(host)) {
    console.log(`[24.7] Paused on ${host}`);
    return;
  }

  // ── Throttle & Write Queue ──────────────────────────────────────
  const lastEventTime = {};
  const THROTTLE_MS = 500;
  let writeQueue = [];
  let writeTimer = null;

  function flushWrites() {
    if (writeQueue.length === 0) return;
    chrome.storage.local.get(['events'], (result) => {
      const events = (result.events || []).concat(writeQueue);
      chrome.storage.local.set({ events: events.slice(-1000) });
      writeQueue = [];
    });
    writeTimer = null;
  }

  function scheduleWrite() {
    if (!writeTimer) {
      writeTimer = setTimeout(flushWrites, 1000);
    }
  }

  function detectApp() {
    const h = window.location.hostname;
    const appMap = {
      'mail.google.com': 'Gmail',
      'monday.com': 'Monday',
      'priority-software.com': 'Priority',
      'fireberry.com': 'Fireberry',
      'claude.ai': 'Claude',
      'airtable.com': 'Airtable',
      'clickup.com': 'ClickUp',
      'atlassian.net': 'Jira',
      'hubspot.com': 'HubSpot',
      'salesforce.com': 'Salesforce',
      'slack.com': 'Slack',
      'notion.so': 'Notion',
      'linkedin.com': 'LinkedIn',
      'chat.openai.com': 'ChatGPT',
      'perplexity.ai': 'Perplexity',
      'n8n.io': 'n8n',
      'make.com': 'Make',
      'zapier.com': 'Zapier',
      'kaveret.co.il': 'Kaveret',
      'sensei.co.il': 'Sensei'
    };
    for (const [domain, name] of Object.entries(appMap)) {
      if (h.includes(domain)) return name;
    }
    return 'Unknown';
  }

  function trackEvent(type, detail) {
    const key = `${type}:${detail}`;
    const now = Date.now();
    if (lastEventTime[key] && now - lastEventTime[key] < THROTTLE_MS) return;
    lastEventTime[key] = now;

    const event = {
      app: APP_NAME,
      type,
      target: detail,
      timestamp: now,
      url: window.location.href,
      hash: `${APP_NAME}:${type}:${detail || 'unknown'}`
    };

    // Send to background for cross-tab sequence detection
    chrome.runtime.sendMessage({ type: 'EVENT', data: event });

    // Queue for local storage
    writeQueue.push(event);
    scheduleWrite();
  }

  // ── Event Listeners ─────────────────────────────────────────────

  // Copy/Paste
  document.addEventListener('copy', () => trackEvent('copy', document.activeElement?.tagName));
  document.addEventListener('paste', () => trackEvent('paste', document.activeElement?.tagName));

  // Form submissions
  document.addEventListener('submit', (e) => trackEvent('form_submit', e.target?.action || 'form'));

  // Clicks (debounced via throttle)
  let lastClickTime = 0;
  document.addEventListener('click', (e) => {
    const now = Date.now();
    if (now - lastClickTime < 200) return;
    lastClickTime = now;
    const target = e.target.closest('button, a, [role="button"]');
    if (target) {
      trackEvent('click', target.textContent?.slice(0, 50)?.trim() || target.tagName);
    }
  });

  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'Enter')) {
      trackEvent('shortcut', `${e.ctrlKey ? 'Ctrl' : 'Cmd'}+${e.key}`);
    }
  });

  // Input changes (throttled heavily)
  document.addEventListener('change', (e) => {
    const tag = e.target?.tagName;
    if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') {
      trackEvent('field_change', `${tag}:${e.target.type || 'text'}`);
    }
  });

  // File input
  document.addEventListener('change', (e) => {
    if (e.target?.type === 'file') {
      trackEvent('file_upload', e.target.accept || 'any');
    }
  });

  // SPA navigation (replacing heavy MutationObserver)
  let lastUrl = window.location.href;
  const checkNav = () => {
    if (window.location.href !== lastUrl) {
      lastUrl = window.location.href;
      trackEvent('navigation', window.location.pathname);
    }
  };
  window.addEventListener('popstate', checkNav);
  window.addEventListener('hashchange', checkNav);
  // Fallback: lightweight interval for pushState changes
  setInterval(checkNav, 2000);

  // Report app detection
  chrome.runtime.sendMessage({ type: 'APP_DETECTED', data: { app: APP_NAME, url: window.location.href } });

  console.log(`[24.7 AUTOMATION] Monitoring ${APP_NAME}`);
})();
