// 24.7 AUTOMATION v2.1 - Popup Script
// Onboarding, visual sequences, quick actions, dark/light mode, privacy

const SUPABASE_URL = 'https://fzzrvbgfwbtxbaxgvmfh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ6enJ2Ymdmd2J0eGJheGd2bWZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYzMjYxNjMsImV4cCI6MjA5MTkwMjE2M30.7TDpzXRl1uBYiBsWMqDxij9maf_K-uFeaT8GyvM4pqU';
const DASHBOARD_URL = 'https://id-preview--a4864d2a-1e61-41be-922b-cb1366d595f8.lovable.app';

const APP_ICONS = {
  Gmail: '📧', Monday: '📋', Priority: '🏢', Fireberry: '🔥', Claude: '🤖',
  Airtable: '📊', ClickUp: '✅', Jira: '🐛', HubSpot: '🧲', Salesforce: '☁️',
  Slack: '💬', Notion: '📝', LinkedIn: '💼', ChatGPT: '🧠', Perplexity: '🔍',
  'n8n': '⚡', Make: '🔧', Zapier: '⚡', Kaveret: '🐝', Sensei: '🥋'
};

const TRACKED_SITES = [
  'mail.google.com', 'monday.com', 'priority-software.com', 'fireberry.com',
  'claude.ai', 'airtable.com', 'clickup.com', 'atlassian.net', 'hubspot.com',
  'salesforce.com', 'slack.com', 'notion.so', 'linkedin.com', 'chat.openai.com',
  'perplexity.ai', 'n8n.io', 'make.com', 'zapier.com', 'kaveret.co.il', 'sensei.co.il'
];

let currentSlide = 0;

// ── Onboarding ──────────────────────────────────────────────────────

window.nextSlide = function() {
  currentSlide++;
  document.querySelectorAll('.onboarding-slide').forEach((s, i) => {
    s.classList.toggle('active', i === currentSlide);
  });
};

window.skipOnboarding = async function() {
  await chrome.storage.local.set({ onboardingDone: true });
  document.getElementById('onboardingScreen').style.display = 'none';
  showLoginScreen();
};

// ── Theme Toggle ────────────────────────────────────────────────────

async function initTheme() {
  const { theme } = await chrome.storage.local.get(['theme']);
  if (theme === 'light') {
    document.body.classList.add('light');
    const btn = document.getElementById('themeToggle');
    if (btn) btn.textContent = '☀️';
  }
}

function toggleTheme() {
  const isLight = document.body.classList.toggle('light');
  chrome.storage.local.set({ theme: isLight ? 'light' : 'dark' });
  const btn = document.getElementById('themeToggle');
  if (btn) btn.textContent = isLight ? '☀️' : '🌙';
}

// ── Init ────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', async () => {
  await initTheme();
  const { authSession, onboardingDone } = await chrome.storage.local.get(['authSession', 'onboardingDone']);

  if (!onboardingDone) {
    document.getElementById('onboardingScreen').style.display = 'block';
  } else if (authSession?.access_token) {
    showMainScreen();
  } else {
    showLoginScreen();
  }
});

// ── Auth ────────────────────────────────────────────────────────────

function showLoginScreen() {
  document.getElementById('onboardingScreen').style.display = 'none';
  document.getElementById('loginScreen').style.display = 'block';
  document.getElementById('mainScreen').style.display = 'none';
}

function showMainScreen() {
  document.getElementById('onboardingScreen').style.display = 'none';
  document.getElementById('loginScreen').style.display = 'none';
  document.getElementById('mainScreen').style.display = 'block';
  loadStatus();
  loadSiteToggles();
}

document.getElementById('loginBtn').addEventListener('click', async () => {
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;
  const errEl = document.getElementById('loginError');
  errEl.style.display = 'none';

  if (!email || !password) {
    errEl.textContent = 'נא למלא אימייל וסיסמה';
    errEl.style.display = 'block';
    return;
  }
  document.getElementById('loginBtn').disabled = true;

  try {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'apikey': SUPABASE_ANON_KEY },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok) {
      errEl.textContent = data.error_description || data.msg || 'שגיאת התחברות';
      errEl.style.display = 'block';
      return;
    }
    await chrome.storage.local.set({ authSession: { access_token: data.access_token, refresh_token: data.refresh_token, user: data.user } });
    chrome.runtime.sendMessage({ type: 'AUTH_TOKEN_SAVED' });
    showMainScreen();
  } catch (err) {
    errEl.textContent = 'שגיאת רשת';
    errEl.style.display = 'block';
  } finally {
    document.getElementById('loginBtn').disabled = false;
  }
});

document.getElementById('logoutBtn').addEventListener('click', async () => {
  await chrome.storage.local.remove(['authSession']);
  showLoginScreen();
});

document.getElementById('themeToggle').addEventListener('click', toggleTheme);
document.getElementById('dashboardBtn').addEventListener('click', () => window.open(DASHBOARD_URL, '_blank'));

// ── Load Status with Visual Sequences ───────────────────────────────

function loadStatus() {
  chrome.runtime.sendMessage({ type: 'GET_STATUS' }, (response) => {
    if (!response) return;

    document.getElementById('patternCount').textContent = `${response.totalPatterns} דפוסים`;

    // Active apps with icons
    const appList = document.getElementById('appList');
    if (response.activeApps.length > 0) {
      appList.innerHTML = response.activeApps.map(app =>
        `<div class="app-item active">
          <div style="display:flex;align-items:center;gap:6px">
            <span class="app-icon">${APP_ICONS[app] || '📱'}</span>
            <span style="font-size:12px;font-weight:500">${app}</span>
          </div>
          <div class="status-dot"></div>
        </div>`
      ).join('');
    } else {
      appList.innerHTML = '<div class="app-item" style="color:var(--text-dim);text-align:center;justify-content:center;font-size:12px">לא זוהו אפליקציות פעילות</div>';
    }

    // Visual sequence alerts
    if (response.patternAlerts.length > 0) {
      document.getElementById('alertsSection').style.display = 'block';
      document.getElementById('alertsList').innerHTML = response.patternAlerts.slice(-3).map(alert => {
        const steps = (alert.sequence || alert.hash || '').split(' → ');
        const stepsHtml = steps.map(s => {
          const parts = s.split(':');
          const app = parts[0] || '';
          const action = parts.slice(1).join(':') || s;
          const icon = APP_ICONS[app] || '📱';
          return `<span class="seq-step"><span class="step-icon">${icon}</span>${action}</span>`;
        }).join('<span class="seq-arrow">→</span>');

        return `<div class="alert-card">
          <div style="display:flex;align-items:center;justify-content:space-between">
            <div class="title">רצף חוזר</div>
            <span style="font-size:10px;color:var(--cyan);font-weight:700">${alert.count || '?'}x</span>
          </div>
          <div class="seq-visual">${stepsHtml}</div>
          <div style="display:flex;gap:4px">
            <button class="btn btn-primary copy-payload" data-seq="${encodeURIComponent(JSON.stringify({ trigger: 'pattern', sequence: alert.sequence, source: '24.7' }))}">📋 העתק JSON</button>
            <button class="btn btn-primary" onclick="window.open('${DASHBOARD_URL}', '_blank')">📊 פתח בדשבורד</button>
          </div>
        </div>`;
      }).join('');

      document.querySelectorAll('.copy-payload').forEach(btn => {
        btn.addEventListener('click', () => {
          navigator.clipboard.writeText(decodeURIComponent(btn.dataset.seq));
          btn.textContent = '✓ הועתק!';
          setTimeout(() => btn.textContent = '📋 העתק JSON', 2000);
        });
      });
    }
  });
}

// ── AI Recommendations with Quick Actions ───────────────────────────

document.getElementById('suggestBtn').addEventListener('click', async () => {
  const input = document.getElementById('manualInput').value.trim();
  if (!input) return;

  const btn = document.getElementById('suggestBtn');
  const resultDiv = document.getElementById('aiResult');
  btn.disabled = true;
  btn.textContent = '⏳ מנתח...';
  resultDiv.style.display = 'block';
  resultDiv.innerHTML = `<div class="skeleton skeleton-line"></div><div class="skeleton skeleton-line"></div><div class="skeleton skeleton-line" style="width:60%"></div>`;

  try {
    const { authSession } = await chrome.storage.local.get(['authSession']);
    const headers = { 'Content-Type': 'application/json', 'apikey': SUPABASE_ANON_KEY };
    if (authSession?.access_token) headers['Authorization'] = `Bearer ${authSession.access_token}`;

    const res = await fetch(`${SUPABASE_URL}/functions/v1/analyze-patterns`, {
      method: 'POST', headers, body: JSON.stringify({ description: input })
    });
    const data = await res.json();

    if (data.suggestions && data.suggestions.length > 0) {
      resultDiv.innerHTML = data.suggestions.map(s => {
        const payload = JSON.stringify({ trigger: s.toolFrom, action: s.toolTo, description: s.description, platform: s.platform, source: '24.7' }, null, 2);
        return `<div class="ai-suggestion">
          <div class="tool">${APP_ICONS[s.toolFrom] || '📱'} ${s.toolFrom} → ${APP_ICONS[s.toolTo] || '📱'} ${s.toolTo}</div>
          <div style="margin:4px 0;color:var(--text)">${s.description}</div>
          <div class="platform">📤 ${s.platform} ${s.estimatedTimeSaved ? '| ⏱ ' + s.estimatedTimeSaved : ''}</div>
          <div class="ai-actions">
            <button class="btn btn-primary copy-ai" data-payload="${encodeURIComponent(payload)}">📋 העתק</button>
            <button class="btn btn-primary" onclick="window.open('${DASHBOARD_URL}', '_blank')">🚀 דשבורד</button>
          </div>
        </div>`;
      }).join('');

      resultDiv.querySelectorAll('.copy-ai').forEach(btn => {
        btn.addEventListener('click', () => {
          navigator.clipboard.writeText(decodeURIComponent(btn.dataset.payload));
          btn.textContent = '✓ הועתק!';
          setTimeout(() => btn.textContent = '📋 העתק', 2000);
        });
      });
    } else {
      resultDiv.innerHTML = '<div style="color:var(--text-dim);font-size:11px;text-align:center;padding:10px">לא נמצאו המלצות — נסה תיאור מפורט יותר</div>';
    }
  } catch (err) {
    resultDiv.innerHTML = `<div style="color:var(--red);font-size:11px">שגיאה: ${err.message}</div>`;
  } finally {
    btn.disabled = false;
    btn.textContent = '💡 קבל המלצה';
  }
});

// ── Per-Site Toggles (Collapsible, only visited sites first) ────────

let sitesOpen = false;
document.getElementById('sitesToggleBtn').addEventListener('click', () => {
  sitesOpen = !sitesOpen;
  document.getElementById('sitesList').classList.toggle('open', sitesOpen);
  document.getElementById('sitesChevron').classList.toggle('open', sitesOpen);
});

async function loadSiteToggles() {
  const { disabledSites, events } = await chrome.storage.local.get(['disabledSites', 'events']);
  const disabled = disabledSites || [];
  const evts = events || [];

  // Count events per site
  const siteCounts = {};
  evts.forEach(e => {
    const app = e.app || 'Unknown';
    siteCounts[app] = (siteCounts[app] || 0) + 1;
  });

  // Sort: visited sites first, then alphabetical
  const sorted = [...TRACKED_SITES].sort((a, b) => {
    const appA = Object.entries(APP_ICONS).find(([, ]) => a.includes(Object.keys(APP_ICONS).find(k => a.includes(k.toLowerCase()))))?.[0];
    const appB = Object.entries(APP_ICONS).find(([, ]) => b.includes(Object.keys(APP_ICONS).find(k => b.includes(k.toLowerCase()))))?.[0];
    const cA = siteCounts[appA] || 0;
    const cB = siteCounts[appB] || 0;
    return cB - cA;
  });

  const list = document.getElementById('sitesList');
  list.innerHTML = sorted.map(site => {
    const enabled = !disabled.includes(site);
    const appName = Object.keys(APP_ICONS).find(k => site.includes(k.toLowerCase())) || site;
    const icon = APP_ICONS[appName] || '📱';
    const count = siteCounts[appName] || 0;
    return `<div class="app-item" style="margin-bottom:4px">
      <div style="display:flex;align-items:center;gap:6px">
        <span style="font-size:14px">${icon}</span>
        <div>
          <span style="font-size:11px">${site}</span>
          ${count > 0 ? `<div class="site-stats">${count} אירועים</div>` : ''}
        </div>
      </div>
      <div class="toggle-switch ${enabled ? 'active' : ''}" data-site="${site}"></div>
    </div>`;
  }).join('');

  list.querySelectorAll('.toggle-switch').forEach(toggle => {
    toggle.addEventListener('click', async () => {
      const site = toggle.dataset.site;
      const { disabledSites: current } = await chrome.storage.sync.get(['disabledSites']);
      const arr = current || [];
      const idx = arr.indexOf(site);
      if (idx >= 0) { arr.splice(idx, 1); toggle.classList.add('active'); }
      else { arr.push(site); toggle.classList.remove('active'); }
      await chrome.storage.sync.set({ disabledSites: arr });
    });
  });
}
