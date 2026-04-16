// 24.7 AUTOMATION - Content Script
// Monitors user activity on whitelisted platforms

(function() {
  const APP_NAME = detectApp();
  let eventBuffer = [];
  let patternCount = 0;

  function detectApp() {
    const host = window.location.hostname;
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
      if (host.includes(domain)) return name;
    }
    return 'Unknown';
  }

  function hashEvent(event) {
    return `${APP_NAME}:${event.type}:${event.target || 'unknown'}`;
  }

  function trackEvent(type, detail) {
    const event = {
      app: APP_NAME,
      type: type,
      target: detail,
      timestamp: Date.now(),
      url: window.location.href
    };
    const hash = hashEvent(event);
    eventBuffer.push({ ...event, hash });

    // Detect repetitive patterns
    const recent = eventBuffer.slice(-20);
    const hashCounts = {};
    recent.forEach(e => { hashCounts[e.hash] = (hashCounts[e.hash] || 0) + 1; });
    const maxRepeat = Math.max(...Object.values(hashCounts));

    if (maxRepeat >= 3) {
      patternCount++;
      chrome.runtime.sendMessage({
        type: 'PATTERN_DETECTED',
        data: { app: APP_NAME, count: maxRepeat, patternCount, hash: Object.keys(hashCounts).find(k => hashCounts[k] === maxRepeat) }
      });
    }

    // Store events
    chrome.storage.local.get(['events'], (result) => {
      const events = result.events || [];
      events.push(event);
      // Keep last 1000 events
      chrome.storage.local.set({ events: events.slice(-1000) });
    });

    // Keep buffer manageable
    if (eventBuffer.length > 100) eventBuffer = eventBuffer.slice(-50);
  }

  // Monitor copy events
  document.addEventListener('copy', () => trackEvent('copy', document.activeElement?.tagName));

  // Monitor paste events
  document.addEventListener('paste', () => trackEvent('paste', document.activeElement?.tagName));

  // Monitor form submissions
  document.addEventListener('submit', (e) => trackEvent('form_submit', e.target?.action || 'form'));

  // Monitor clicks on buttons and links
  document.addEventListener('click', (e) => {
    const target = e.target.closest('button, a, [role="button"]');
    if (target) {
      trackEvent('click', target.textContent?.slice(0, 50) || target.tagName);
    }
  });

  // Monitor navigation within the app
  let lastUrl = window.location.href;
  const observer = new MutationObserver(() => {
    if (window.location.href !== lastUrl) {
      lastUrl = window.location.href;
      trackEvent('navigation', window.location.pathname);
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });

  // Report app detection
  chrome.runtime.sendMessage({ type: 'APP_DETECTED', data: { app: APP_NAME, url: window.location.href } });

  console.log(`[24.7 AUTOMATION] Monitoring ${APP_NAME}`);
})();
