// 24.7 AUTOMATION v2 - Popup Script

const SUPABASE_URL = 'https://fzzrvbgfwbtxbaxgvmfh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ6enJ2Ymdmd2J0eGJheGd2bWZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYzMjYxNjMsImV4cCI6MjA5MTkwMjE2M30.7TDpzXRl1uBYiBsWMqDxij9maf_K-uFeaT8GyvM4pqU';
const DASHBOARD_URL = 'https://id-preview--a4864d2a-1e61-41be-922b-cb1366d595f8.lovable.app';

const TRACKED_SITES = [
  'mail.google.com', 'monday.com', 'priority-software.com', 'fireberry.com',
  'claude.ai', 'airtable.com', 'clickup.com', 'atlassian.net', 'hubspot.com',
  'salesforce.com', 'slack.com', 'notion.so', 'linkedin.com', 'chat.openai.com',
  'perplexity.ai', 'n8n.io', 'make.com', 'zapier.com', 'kaveret.co.il', 'sensei.co.il'
];

// ── Init ────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', async () => {
  const { authSession } = await chrome.storage.local.get(['authSession']);
  if (authSession?.access_token) {
    showMainScreen();
  } else {
    showLoginScreen();
  }
});

// ── Auth ────────────────────────────────────────────────────────────

function showLoginScreen() {
  document.getElementById('loginScreen').style.display = 'block';
  document.getElementById('mainScreen').style.display = 'none';
}

function showMainScreen() {
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
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY
      },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();

    if (!res.ok) {
      errEl.textContent = data.error_description || data.msg || 'שגיאת התחברות';
      errEl.style.display = 'block';
      return;
    }

    await chrome.storage.local.set({
      authSession: {
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        user: data.user
      }
    });

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

document.getElementById('dashboardBtn').addEventListener('click', () => {
  window.open(DASHBOARD_URL, '_blank');
});

// ── Load Status ─────────────────────────────────────────────────────

function loadStatus() {
  chrome.runtime.sendMessage({ type: 'GET_STATUS' }, (response) => {
    if (!response) return;

    document.getElementById('patternCount').textContent = `${response.totalPatterns} דפוסים`;

    const appList = document.getElementById('appList');
    if (response.activeApps.length > 0) {
      appList.innerHTML = response.activeApps.map(app =>
        `<div class="app-item active"><span>${app}</span><div class="status-dot"></div></div>`
      ).join('');
    } else {
      appList.innerHTML = '<div class="app-item" style="color:#475569;text-align:center;justify-content:center">לא זוהו אפליקציות</div>';
    }

    if (response.patternAlerts.length > 0) {
      document.getElementById('alertsSection').style.display = 'block';
      document.getElementById('alertsList').innerHTML = response.patternAlerts.slice(-3).map(alert => {
        const steps = (alert.sequence || '').split(' → ').map(s => s.split(':').slice(0, 2).join(':')).join(' → ');
        return `<div class="alert-card">
          <div class="title">רצף חוזר (${alert.count || '?'}x)</div>
          <div class="desc" style="direction:ltr;text-align:left;font-family:monospace">${steps}</div>
          <div style="margin-top:8px;display:flex;gap:6px">
            <button class="btn btn-primary copy-payload" data-seq="${encodeURIComponent(alert.sequence || '')}">📋 העתק</button>
          </div>
        </div>`;
      }).join('');

      document.querySelectorAll('.copy-payload').forEach(btn => {
        btn.addEventListener('click', () => {
          const seq = decodeURIComponent(btn.dataset.seq);
          const payload = JSON.stringify({ trigger: 'pattern_detected', sequence: seq, source: '24.7 Extension' }, null, 2);
          navigator.clipboard.writeText(payload);
          btn.textContent = '✓ הועתק';
          setTimeout(() => btn.textContent = '📋 העתק', 2000);
        });
      });
    }
  });
}

// ── AI Recommendations ──────────────────────────────────────────────

document.getElementById('suggestBtn').addEventListener('click', async () => {
  const input = document.getElementById('manualInput').value.trim();
  if (!input) return;

  const btn = document.getElementById('suggestBtn');
  const resultDiv = document.getElementById('aiResult');
  btn.disabled = true;
  btn.textContent = '⏳ מנתח...';
  resultDiv.style.display = 'block';
  resultDiv.innerHTML = '<div style="color:#64748b;font-size:11px">שולח לניתוח AI...</div>';

  try {
    const { authSession } = await chrome.storage.local.get(['authSession']);
    const headers = {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_ANON_KEY
    };
    if (authSession?.access_token) {
      headers['Authorization'] = `Bearer ${authSession.access_token}`;
    }

    const res = await fetch(`${SUPABASE_URL}/functions/v1/analyze-patterns`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ description: input })
    });
    const data = await res.json();

    if (data.suggestions && data.suggestions.length > 0) {
      resultDiv.innerHTML = data.suggestions.map(s =>
        `<div class="ai-suggestion">
          <div class="tool">${s.toolFrom} → ${s.toolTo}</div>
          <div>${s.description}</div>
          <div class="platform">📤 ${s.platform} ${s.estimatedTimeSaved ? '| ⏱ ' + s.estimatedTimeSaved : ''}</div>
        </div>`
      ).join('');
    } else {
      resultDiv.innerHTML = '<div style="color:#64748b;font-size:11px">לא נמצאו המלצות</div>';
    }
  } catch (err) {
    resultDiv.innerHTML = `<div style="color:#ef4444;font-size:11px">שגיאה: ${err.message}</div>`;
  } finally {
    btn.disabled = false;
    btn.textContent = '💡 קבל המלצה';
  }
});

// ── Per-Site Toggles ────────────────────────────────────────────────

async function loadSiteToggles() {
  const { disabledSites } = await chrome.storage.sync.get(['disabledSites']);
  const disabled = disabledSites || [];
  const list = document.getElementById('sitesList');

  list.innerHTML = TRACKED_SITES.map(site => {
    const enabled = !disabled.includes(site);
    return `<div class="app-item">
      <span style="font-size:11px">${site}</span>
      <div class="toggle-switch ${enabled ? 'active' : ''}" data-site="${site}"></div>
    </div>`;
  }).join('');

  list.querySelectorAll('.toggle-switch').forEach(toggle => {
    toggle.addEventListener('click', async () => {
      const site = toggle.dataset.site;
      const { disabledSites: current } = await chrome.storage.sync.get(['disabledSites']);
      const arr = current || [];
      const idx = arr.indexOf(site);
      if (idx >= 0) {
        arr.splice(idx, 1);
        toggle.classList.add('active');
      } else {
        arr.push(site);
        toggle.classList.remove('active');
      }
      await chrome.storage.sync.set({ disabledSites: arr });
    });
  });
}
