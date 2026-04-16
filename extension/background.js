// 24.7 AUTOMATION v2 - Background Service Worker
// Cross-tab sequence detection + Supabase sync

const SUPABASE_URL = 'https://fzzrvbgfwbtxbaxgvmfh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ6enJ2Ymdmd2J0eGJheGd2bWZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYzMjYxNjMsImV4cCI6MjA5MTkwMjE2M30.7TDpzXRl1uBYiBsWMqDxij9maf_K-uFeaT8GyvM4pqU';

// Global event stream (cross-tab)
let eventStream = [];
let detectedSequences = {};
let patternAlerts = [];
let activeApps = new Set();
let pendingSyncEvents = [];

// ── Sequence Detection ──────────────────────────────────────────────

function findRepeatedSequences(stream, minLen = 3, maxLen = 5) {
  if (stream.length < minLen * 2) return [];
  const found = [];
  const recent = stream.slice(-60); // analyze last 60 events

  for (let len = minLen; len <= maxLen; len++) {
    const seqCounts = {};
    for (let i = 0; i <= recent.length - len; i++) {
      const seq = recent.slice(i, i + len).map(e => e.hash).join(' → ');
      seqCounts[seq] = (seqCounts[seq] || 0) + 1;
    }
    for (const [seq, count] of Object.entries(seqCounts)) {
      if (count >= 3) {
        found.push({ sequence: seq, count, length: len });
      }
    }
  }
  return found;
}

function processEvent(event) {
  eventStream.push(event);
  if (eventStream.length > 200) eventStream = eventStream.slice(-100);

  // Add to pending sync queue
  pendingSyncEvents.push(event);

  // Run sequence detection
  const sequences = findRepeatedSequences(eventStream);
  sequences.forEach(seq => {
    const prev = detectedSequences[seq.sequence];
    if (!prev || seq.count > prev.count) {
      detectedSequences[seq.sequence] = seq;

      if (!prev) {
        const alert = {
          type: 'sequence',
          sequence: seq.sequence,
          count: seq.count,
          length: seq.length,
          timestamp: Date.now()
        };
        patternAlerts.push(alert);
        if (patternAlerts.length > 50) patternAlerts = patternAlerts.slice(-50);
        chrome.storage.local.set({ patternAlerts });

        if (seq.count >= 3) {
          chrome.action.setBadgeBackgroundColor({ color: '#00F0FF' });
        }
      }
    }
  });

  updateBadge();
}

// ── Message Handling ────────────────────────────────────────────────

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'APP_DETECTED') {
    activeApps.add(message.data.app);
    updateBadge();
  }

  if (message.type === 'EVENT') {
    processEvent(message.data);
  }

  if (message.type === 'GET_STATUS') {
    sendResponse({
      activeApps: Array.from(activeApps),
      patternAlerts: patternAlerts.slice(-10),
      totalPatterns: patternAlerts.length,
      sequences: Object.values(detectedSequences).slice(0, 10)
    });
    return true;
  }

  if (message.type === 'AUTH_TOKEN_SAVED') {
    // Trigger immediate sync when user logs in
    syncToSupabase();
  }
});

// ── Badge ───────────────────────────────────────────────────────────

function updateBadge() {
  const count = patternAlerts.filter(a => Date.now() - a.timestamp < 3600000).length;
  chrome.action.setBadgeText({ text: count > 0 ? String(count) : '' });
  chrome.action.setBadgeBackgroundColor({ color: count > 5 ? '#7000FF' : '#00F0FF' });
}

// ── Supabase Sync ───────────────────────────────────────────────────

async function syncToSupabase() {
  if (pendingSyncEvents.length === 0) return;

  const stored = await chrome.storage.local.get(['authSession']);
  const session = stored.authSession;
  if (!session?.access_token || !session?.user?.id) return;

  const eventsToSync = pendingSyncEvents.splice(0, 50); // batch of 50
  const rows = eventsToSync.map(e => ({
    user_id: session.user.id,
    app_name: e.app,
    action_type: e.type,
    event_data: { target: e.target, url: e.url, tabId: e.tabId },
    fingerprint_hash: e.hash
  }));

  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/captured_events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${session.access_token}`,
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify(rows)
    });
    if (!res.ok) {
      // Put events back on failure
      pendingSyncEvents.unshift(...eventsToSync);
      console.warn('[24.7] Sync failed:', res.status);
    } else {
      console.log(`[24.7] Synced ${rows.length} events`);
    }
  } catch (err) {
    pendingSyncEvents.unshift(...eventsToSync);
    console.warn('[24.7] Sync error:', err);
  }
}

// ── Alarms ──────────────────────────────────────────────────────────

chrome.alarms.create('sync', { periodInMinutes: 0.5 }); // every 30s
chrome.alarms.create('cleanup', { periodInMinutes: 60 });

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'sync') {
    syncToSupabase();
  }
  if (alarm.name === 'cleanup') {
    const oneHourAgo = Date.now() - 3600000;
    patternAlerts = patternAlerts.filter(a => a.timestamp > oneHourAgo);
    detectedSequences = {};
    chrome.storage.local.set({ patternAlerts });
    updateBadge();
  }
});
