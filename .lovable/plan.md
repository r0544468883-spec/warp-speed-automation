

# Implementation Plan: Auth + Onboarding + AI + Seed Data

## Overview
Four major additions: (1) Authentication with email/password + Google, (2) Onboarding flow, (3) AI-powered pattern analysis via Lovable AI edge function, (4) Seed data for the Automation Wiki.

---

## 1. Authentication System

### Auth Pages
- Create `src/pages/Auth.tsx` — login/signup form with email+password, toggle between modes, Google sign-in button using `lovable.auth.signInWithOAuth("google")`
- Configure Social Auth tool to generate the lovable module for Google OAuth
- Style: dark theme matching existing design, centered card with the 24.7 branding

### Auth Context & Route Protection
- Create `src/contexts/AuthContext.tsx` — wraps `supabase.auth.onAuthStateChange`, provides `user`, `session`, `loading`, `signOut`
- Create `src/components/ProtectedRoute.tsx` — redirects to `/auth` if not authenticated
- Wrap all dashboard routes in `ProtectedRoute`
- Add `/auth` route to App.tsx

### Profile Integration
- The `handle_new_user` trigger already creates profiles on signup
- Fetch profile data in AuthContext for display name, onboarding status

---

## 2. Onboarding Flow

- Create `src/pages/Onboarding.tsx` — multi-step wizard with Warp Speed transitions:
  - **Step 1**: Industry selection (tech, finance, marketing, sales, operations, etc.)
  - **Step 2**: Tool stack picker — grid of 20+ platform icons (Gmail, Monday, Priority, Claude, Fireberry, Airtable, ClickUp, Jira, etc.) with multi-select
  - **Step 3**: Inspiration screen — "See what companies like OpenAI & HubSpot automate" with benchmark previews
- On completion: update `profiles` table with `industry_type`, `tool_stack`, `onboarding_completed = true`
- Redirect logic: if `onboarding_completed === false`, redirect to `/onboarding` after login

---

## 3. AI-Powered Dashboard (Lovable AI)

### Edge Function: `analyze-patterns`
- Accepts user's captured events or manual difficulty description
- Uses Lovable AI Gateway (`google/gemini-3-flash-preview`) to:
  - Analyze repetitive patterns
  - Generate automation recommendations with tool pairs
  - Suggest platform (n8n/Make/Zapier)
- Returns structured suggestions via tool calling

### Dashboard Integration
- Replace mock suggestions on Index page with real AI-generated ones
- Add "Manual Mode" input on dashboard — user describes a difficulty, AI responds with recommendations
- Loading states with the existing Warp Speed animation

---

## 4. Seed Data for Automation Wiki

### Insert ~30 real entries into `automation_wiki` table
- **n8n**: Gmail→Monday sync, Claude→Priority reports, LinkedIn lead enrichment, Slack notifications, webhook chains
- **Make**: Fireberry→Priority invoicing, Airtable→Salesforce sync, HubSpot lead routing
- **Zapier**: ClickUp deadline alerts, Google Analytics reports, Notion→Slack updates
- **Israeli platforms**: Priority, Kaveret, Sensei, Fireberry, Koala integrations
- **AI tools**: Claude, GPT, Perplexity, Gemini agent workflows
- Each entry includes source URLs (Reddit, n8n community, X), proof counts, tags, categories

### Wiki Page Update
- Fetch data from `automation_wiki` table instead of mock data
- Real-time search across DB entries

---

## Technical Details

### Files to Create
- `src/pages/Auth.tsx`
- `src/pages/Onboarding.tsx`
- `src/contexts/AuthContext.tsx`
- `src/components/ProtectedRoute.tsx`
- `supabase/functions/analyze-patterns/index.ts`

### Files to Modify
- `src/App.tsx` — add AuthProvider, routes, ProtectedRoute
- `src/pages/Index.tsx` — integrate AI suggestions, manual mode
- `src/pages/Wiki.tsx` — fetch from DB instead of mock
- `src/components/DashboardLayout.tsx` — add user info + logout button

### Database Changes
- None needed (schema already exists)
- Insert seed data into `automation_wiki` table

### Tools/Config
- Configure Social Auth for Google OAuth
- Deploy `analyze-patterns` edge function
- `LOVABLE_API_KEY` already available

