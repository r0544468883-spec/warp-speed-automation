// 24.7 AUTOMATION v2.1 - Content Script
// Floating widget, toast notifications, throttled tracking, per-site toggle

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
  let sessionPatternCount = 0;
  let lastToastTime = 0;

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
    if (!writeTimer) writeTimer = setTimeout(flushWrites, 1000);
  }

  function detectApp() {
    const h = window.location.hostname;
    const appMap = {
      'mail.google.com': 'Gmail', 'monday.com': 'Monday', 'priority-software.com': 'Priority',
      'fireberry.com': 'Fireberry', 'claude.ai': 'Claude', 'airtable.com': 'Airtable',
      'clickup.com': 'ClickUp', 'atlassian.net': 'Jira', 'hubspot.com': 'HubSpot',
      'salesforce.com': 'Salesforce', 'slack.com': 'Slack', 'notion.so': 'Notion',
      'linkedin.com': 'LinkedIn', 'chat.openai.com': 'ChatGPT', 'perplexity.ai': 'Perplexity',
      'n8n.io': 'n8n', 'make.com': 'Make', 'zapier.com': 'Zapier',
      'kaveret.co.il': 'Kaveret', 'sensei.co.il': 'Sensei'
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
      app: APP_NAME, type, target: detail, timestamp: now,
      url: window.location.href, hash: `${APP_NAME}:${type}:${detail || 'unknown'}`
    };
    chrome.runtime.sendMessage({ type: 'EVENT', data: event });
    writeQueue.push(event);
    scheduleWrite();
  }

  // ── APP ICONS ───────────────────────────────────────────────────
  const APP_ICONS = {
    Gmail: '📧', Monday: '📋', Priority: '🏢', Fireberry: '🔥', Claude: '🤖',
    Airtable: '📊', ClickUp: '✅', Jira: '🐛', HubSpot: '🧲', Salesforce: '☁️',
    Slack: '💬', Notion: '📝', LinkedIn: '💼', ChatGPT: '🧠', Perplexity: '🔍',
    'n8n': '⚡', Make: '🔧', Zapier: '⚡', Kaveret: '🐝', Sensei: '🥋'
  };

  // ── FLOATING WIDGET (FAB) ──────────────────────────────────────
  const fabContainer = document.createElement('div');
  fabContainer.id = '_247_fab';
  fabContainer.innerHTML = `
    <style>
      #_247_fab { position: fixed; bottom: 20px; left: 20px; z-index: 2147483647; font-family: 'Segoe UI', system-ui, sans-serif; direction: rtl; }
      #_247_fab * { box-sizing: border-box; margin: 0; padding: 0; }
      ._247_btn {
        width: 48px; height: 48px; border-radius: 50%; border: none; cursor: pointer;
        background: linear-gradient(135deg, #00F0FF, #7000FF); color: white;
        font-size: 18px; display: flex; align-items: center; justify-content: center;
        box-shadow: 0 4px 20px rgba(0,240,255,0.3); transition: all 0.3s ease;
        position: relative;
      }
      ._247_btn:hover { transform: scale(1.1); box-shadow: 0 6px 30px rgba(0,240,255,0.5); }
      ._247_btn._247_scanning::after {
        content: ''; position: absolute; inset: -3px; border-radius: 50%;
        border: 2px solid transparent; border-top-color: #00F0FF;
        animation: _247_spin 1.5s linear infinite;
      }
      @keyframes _247_spin { to { transform: rotate(360deg); } }
      ._247_badge {
        position: absolute; top: -4px; right: -4px; min-width: 18px; height: 18px;
        background: #7000FF; color: white; border-radius: 9px; font-size: 10px;
        font-weight: 700; display: flex; align-items: center; justify-content: center;
        padding: 0 4px; border: 2px solid #020617; animation: _247_pop 0.3s ease;
      }
      @keyframes _247_pop { 0% { transform: scale(0); } 50% { transform: scale(1.3); } 100% { transform: scale(1); } }
      ._247_panel {
        position: absolute; bottom: 58px; left: 0; width: 300px;
        background: #0f172a; border: 1px solid rgba(0,240,255,0.2);
        border-radius: 12px; overflow: hidden; opacity: 0; transform: translateY(10px) scale(0.95);
        transition: all 0.25s ease; pointer-events: none;
        box-shadow: 0 10px 40px rgba(0,0,0,0.5);
      }
      ._247_panel._247_open { opacity: 1; transform: translateY(0) scale(1); pointer-events: all; }
      ._247_panel_header {
        padding: 12px 14px; border-bottom: 1px solid #1e293b;
        display: flex; align-items: center; justify-content: space-between;
      }
      ._247_panel_title {
        font-size: 13px; font-weight: 700;
        background: linear-gradient(135deg, #00F0FF, #7000FF);
        -webkit-background-clip: text; -webkit-text-fill-color: transparent;
      }
      ._247_panel_app { font-size: 10px; color: #64748b; display: flex; align-items: center; gap: 4px; }
      ._247_panel_body { padding: 10px 14px; max-height: 250px; overflow-y: auto; }
      ._247_seq_item {
        padding: 10px; background: rgba(0,240,255,0.05); border: 1px solid rgba(0,240,255,0.1);
        border-radius: 8px; margin-bottom: 8px; color: #e2e8f0;
      }
      ._247_seq_steps { display: flex; flex-wrap: wrap; align-items: center; gap: 4px; margin: 6px 0; direction: ltr; }
      ._247_step {
        display: inline-flex; align-items: center; gap: 2px; padding: 2px 6px;
        background: #1e293b; border-radius: 4px; font-size: 10px; color: #94a3b8;
      }
      ._247_arrow { color: #00F0FF; font-size: 10px; }
      ._247_seq_count { font-size: 10px; color: #00F0FF; font-weight: 600; }
      ._247_empty { text-align: center; padding: 20px; color: #475569; font-size: 12px; }
      ._247_scan_line {
        height: 2px; background: linear-gradient(90deg, transparent, #00F0FF, transparent);
        animation: _247_scanmove 2s ease-in-out infinite;
      }
      @keyframes _247_scanmove { 0%,100% { transform: translateX(-100%); } 50% { transform: translateX(100%); } }
    </style>
    <div class="_247_panel" id="_247_panel">
      <div class="_247_scan_line"></div>
      <div class="_247_panel_header">
        <span class="_247_panel_title">24.7 AUTOMATION</span>
        <span class="_247_panel_app">${APP_ICONS[APP_NAME] || '📱'} ${APP_NAME}</span>
      </div>
      <div class="_247_panel_body" id="_247_panel_body">
        <div class="_247_empty">סורק דפוסים חוזרים...</div>
      </div>
    </div>
    <button class="_247_btn _247_scanning" id="_247_fab_btn">⚡</button>
  `;
  document.body.appendChild(fabContainer);

  const fabBtn = document.getElementById('_247_fab_btn');
  const panel = document.getElementById('_247_panel');
  let panelOpen = false;

  fabBtn.addEventListener('click', () => {
    panelOpen = !panelOpen;
    panel.classList.toggle('_247_open', panelOpen);
    if (panelOpen) updatePanel();
  });

  // Close panel on outside click
  document.addEventListener('click', (e) => {
    if (panelOpen && !fabContainer.contains(e.target)) {
      panelOpen = false;
      panel.classList.remove('_247_open');
    }
  });

  function updatePanel() {
    chrome.runtime.sendMessage({ type: 'GET_STATUS' }, (res) => {
      if (!res) return;
      const body = document.getElementById('_247_panel_body');
      if (!res.patternAlerts || res.patternAlerts.length === 0) {
        body.innerHTML = '<div class="_247_empty">עדיין לא זוהו דפוסים חוזרים.<br>המשך לעבוד — נעדכן אותך! 🚀</div>';
        return;
      }
      body.innerHTML = res.patternAlerts.slice(-5).reverse().map(a => {
        const steps = (a.sequence || a.hash || '').split(' → ');
        const stepsHtml = steps.map(s => {
          const parts = s.split(':');
          const app = parts[0] || '';
          const action = parts.slice(1).join(':') || s;
          return `<span class="_247_step">${APP_ICONS[app] || '📱'} ${action}</span>`;
        }).join('<span class="_247_arrow">→</span>');
        return `<div class="_247_seq_item">
          <div class="_247_seq_count">${a.count || '?'}x חזרות</div>
          <div class="_247_seq_steps">${stepsHtml}</div>
        </div>`;
      }).join('');
    });
  }

  // Update badge on FAB
  function updateFabBadge() {
    chrome.runtime.sendMessage({ type: 'GET_STATUS' }, (res) => {
      if (!res) return;
      const existing = fabContainer.querySelector('._247_badge');
      if (existing) existing.remove();
      const count = res.totalPatterns || 0;
      sessionPatternCount = count;
      if (count > 0) {
        const badge = document.createElement('div');
        badge.className = '_247_badge';
        badge.textContent = count > 99 ? '99+' : String(count);
        fabBtn.appendChild(badge);
      }
      // Stop scanning animation after first detection
      if (count > 0) fabBtn.classList.remove('_247_scanning');
    });
  }
  setInterval(updateFabBadge, 5000);
  setTimeout(updateFabBadge, 2000);

  // ── CONTEXT-AWARE TOAST NOTIFICATIONS ──────────────────────────
  function showToast(message, actionLabel, onAction) {
    const now = Date.now();
    if (now - lastToastTime < 30000) return; // Max one toast per 30s
    lastToastTime = now;

    const toast = document.createElement('div');
    toast.id = '_247_toast';
    toast.innerHTML = `
      <style>
        #_247_toast {
          position: fixed; top: 20px; left: 50%; transform: translateX(-50%) translateY(-100px);
          z-index: 2147483647; background: #0f172a; border: 1px solid rgba(0,240,255,0.3);
          border-radius: 12px; padding: 12px 16px; display: flex; align-items: center; gap: 10px;
          box-shadow: 0 10px 40px rgba(0,0,0,0.4); font-family: 'Segoe UI', system-ui, sans-serif;
          animation: _247_toast_in 0.4s ease forwards; max-width: 420px; direction: rtl;
        }
        @keyframes _247_toast_in { to { transform: translateX(-50%) translateY(0); } }
        @keyframes _247_toast_out { to { transform: translateX(-50%) translateY(-100px); opacity: 0; } }
        ._247_toast_icon { font-size: 20px; flex-shrink: 0; }
        ._247_toast_text { color: #e2e8f0; font-size: 12px; line-height: 1.4; flex: 1; }
        ._247_toast_action {
          padding: 5px 12px; border-radius: 6px; border: 1px solid rgba(0,240,255,0.3);
          background: rgba(0,240,255,0.1); color: #00F0FF; font-size: 11px; font-weight: 600;
          cursor: pointer; white-space: nowrap; flex-shrink: 0; transition: background 0.2s;
        }
        ._247_toast_action:hover { background: rgba(0,240,255,0.2); }
        ._247_toast_close {
          background: none; border: none; color: #475569; font-size: 16px; cursor: pointer;
          padding: 0 2px; flex-shrink: 0;
        }
      </style>
      <span class="_247_toast_icon">⚡</span>
      <span class="_247_toast_text">${message}</span>
      ${actionLabel ? `<button class="_247_toast_action" id="_247_toast_act">${actionLabel}</button>` : ''}
      <button class="_247_toast_close" id="_247_toast_close">✕</button>
    `;
    document.body.appendChild(toast);

    const dismiss = () => {
      toast.style.animation = '_247_toast_out 0.3s ease forwards';
      setTimeout(() => toast.remove(), 300);
    };

    document.getElementById('_247_toast_close').addEventListener('click', dismiss);
    if (actionLabel && onAction) {
      document.getElementById('_247_toast_act').addEventListener('click', () => { onAction(); dismiss(); });
    }
    setTimeout(dismiss, 8000);
  }

  // Listen for pattern detections from background
  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.type === 'PATTERN_NOTIFICATION') {
      const { sequence, count } = msg.data;
      const steps = (sequence || '').split(' → ');
      const apps = [...new Set(steps.map(s => s.split(':')[0]))];
      const appNames = apps.map(a => APP_ICONS[a] ? `${APP_ICONS[a]} ${a}` : a).join(' ← ');
      showToast(
        `שמת לב? ביצעת את אותו רצף ${count} פעמים: ${appNames}. רוצה להפוך את זה לאוטומציה?`,
        '🚀 בוא נחבר',
        () => { chrome.runtime.sendMessage({ type: 'OPEN_POPUP' }); }
      );
      // Update FAB
      updateFabBadge();
      if (panelOpen) updatePanel();
    }
  });

  // ── Event Listeners ─────────────────────────────────────────────
  document.addEventListener('copy', () => trackEvent('copy', document.activeElement?.tagName));
  document.addEventListener('paste', () => trackEvent('paste', document.activeElement?.tagName));
  document.addEventListener('submit', (e) => trackEvent('form_submit', e.target?.action || 'form'));

  let lastClickTime = 0;
  document.addEventListener('click', (e) => {
    if (fabContainer.contains(e.target)) return;
    const now = Date.now();
    if (now - lastClickTime < 200) return;
    lastClickTime = now;
    const target = e.target.closest('button, a, [role="button"]');
    if (target) trackEvent('click', target.textContent?.slice(0, 50)?.trim() || target.tagName);
  });

  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'Enter')) {
      trackEvent('shortcut', `${e.ctrlKey ? 'Ctrl' : 'Cmd'}+${e.key}`);
    }
  });

  document.addEventListener('change', (e) => {
    const tag = e.target?.tagName;
    if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') {
      trackEvent('field_change', `${tag}:${e.target.type || 'text'}`);
    }
    if (e.target?.type === 'file') trackEvent('file_upload', e.target.accept || 'any');
  });

  let lastUrl = window.location.href;
  const checkNav = () => {
    if (window.location.href !== lastUrl) {
      lastUrl = window.location.href;
      trackEvent('navigation', window.location.pathname);
    }
  };
  window.addEventListener('popstate', checkNav);
  window.addEventListener('hashchange', checkNav);
  setInterval(checkNav, 2000);

  chrome.runtime.sendMessage({ type: 'APP_DETECTED', data: { app: APP_NAME, url: window.location.href } });
  console.log(`[24.7 AUTOMATION] Monitoring ${APP_NAME}`);
})();
