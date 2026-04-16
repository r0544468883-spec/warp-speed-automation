

# Extension v2 — Upgrade Plan

## Overview
Six improvements to turn the extension from a basic event logger into a real automation detection engine connected to the dashboard.

## 1. Fix Manifest Permissions
Add missing `alarms` and `notifications` permissions. Update dashboard URL placeholder.

**File**: `extension/manifest.json`
- Add `"alarms"` to permissions array
- Add `"notifications"` to permissions array

## 2. Sequence Detection (Cross-Tab Patterns)
Replace the naive hash-count approach with a sliding-window sequence detector that tracks ordered chains of actions across tabs.

**File**: `extension/background.js`
- Collect all events from all tabs into a single ordered stream (not per-tab)
- Implement a sequence finder: look for repeated subsequences of 3-5 actions (e.g., "Gmail:copy → Monday:navigation → Monday:paste → Monday:click:Create")
- Store detected sequences with frequency count
- Alert only when a multi-step sequence repeats 3+ times

**File**: `extension/content.js`
- Send events to background with tab ID so background can build the cross-tab timeline
- Add throttling (max 1 event per type per 500ms) to reduce noise
- Track additional events: `input`/`change` on form fields, keyboard shortcuts (Ctrl+S, Ctrl+Enter), file input changes
- Replace the heavy `MutationObserver` on `document.body` with a focused `popstate` + `hashchange` listener for SPA navigation

## 3. Sync Events to Dashboard (Supabase)
Send captured events to the `captured_events` table so the dashboard can display real data.

**File**: `extension/background.js`
- On extension load, check `chrome.storage.local` for a saved auth token (set from popup login)
- Every 30 seconds, batch-upload new events to Supabase via REST API (`POST /rest/v1/captured_events`)
- Include user_id from the stored session
- On upload success, clear synced events from local storage

## 4. Popup Authentication + AI Integration
Connect the popup to the dashboard backend so the user can log in and get AI recommendations.

**File**: `extension/popup.html`
- Add a login form (email+password) that calls Supabase Auth REST API
- Store session token in `chrome.storage.local`
- After login, show the current UI (apps, alerts, manual mode)
- Wire "קבל המלצה" button to call the `analyze-patterns` edge function with the manual input text
- Display AI response inline in the popup instead of alert()
- Update dashboard link to point to the real preview URL
- Wire the n8n/Make/Zapier buttons in alerts to copy payload (same logic as dashboard cards)

## 5. Per-Site Toggle (Privacy)
Let users enable/disable tracking per domain.

**File**: `extension/popup.html`
- Add a "Sites" section showing tracked domains with on/off toggles
- Store preferences in `chrome.storage.sync`

**File**: `extension/content.js`
- On load, check if current domain is disabled — if so, skip all event listeners
- Show "[24.7] Paused" in console instead of "Monitoring"

## 6. Content Script Optimization
- Debounce click events (ignore rapid clicks within 200ms)
- Limit MutationObserver scope or replace with `popstate`/`hashchange`
- Cap `chrome.storage.local.set` calls to max 1 per second using a write queue

## Technical Details

### Files to modify
- `extension/manifest.json` — add permissions
- `extension/background.js` — sequence detection, Supabase sync, cross-tab event stream
- `extension/content.js` — new events, throttling, per-site toggle, optimized observer
- `extension/popup.html` — login form, AI call, real dashboard URL, site toggles

### No database changes needed
Events go into existing `captured_events` table. Auth uses existing Supabase Auth.

### Re-package
After all changes, re-zip the extension to `public/24-7-extension.zip`.

