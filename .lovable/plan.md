

# 24.7 AUTOMATION — Implementation Plan

## Vision
Chrome Extension + Dashboard that monitors browser activity, detects repetitive patterns, and recommends automations using AI — backed by a massive "Wikipedia of Automation" knowledge base.

## Design System
- **Primary**: #00F0FF (Electric Cyan)
- **Secondary**: #7000FF (Deep Purple)  
- **Background**: #020617 (Deep Space Black)
- **"Warp Speed" effect**: Radial blur animation on automation detection
- **Dark theme throughout**, neon accents, speed-oriented UI

## Phase 1: Foundation & Dashboard

### 1. Database Schema (Supabase)
- `profiles` — user info, subscription tier, industry, total saved time
- `captured_events` — app name, action type, timestamps, user_id
- `automation_wiki` — tool name, use case, source URL, category
- `benchmarks` — company name, architecture JSON, department
- `smart_audits` — video URL, AI analysis JSON, ROI projection
- `user_roles` — role-based access control

### 2. Auth & Onboarding
- Email/password + Google sign-in
- Onboarding flow: industry selection → tool stack picker (20+ platforms) → "See what companies like OpenAI & HubSpot automate" inspiration screen
- "Warp Speed" animation during onboarding transitions

### 3. Dashboard Pages
- **Home**: Activity overview, automation suggestions, "Speedometer" widget showing detected patterns
- **Automation Wiki**: Searchable knowledge base with filters by tool, source, category
- **Smart Audit**: Upload screen recording → AI analyzes → outputs JSON blueprint for n8n/Make
- **ROI Calculator**: Visual savings tracker with formula: SavedTime = (Frequency × TaskDuration) - MaintenanceCost
- **Settings**: Connected tools, notification preferences, subscription management

## Phase 2: Chrome Extension

### 4. Manifest V3 Extension
- Content scripts monitoring activity on whitelisted URLs (Priority, Monday, Gmail, Claude, Fireberry, Airtable, etc.)
- Event fingerprinting: detect repetitive copy/paste, navigation, and data entry patterns
- Subtle overlay "Speedometer" that fills as repetitive tasks are detected
- "Warp Speed" animation trigger on high-confidence detection
- Popup with latest suggestions + "Push to n8n/Make/Zapier" buttons
- Manual mode: describe a difficulty, get AI recommendations

### 5. Platform Detection (MVP: 5 core)
- Gmail, Monday, Priority, Claude, Fireberry
- Expandable to 20+ (Kaveret, Sensei, Airtable, ClickUp, Jira, HubSpot, Salesforce, etc.)

## Phase 3: AI & Knowledge Engine

### 6. AI Edge Functions
- Pattern analysis using Lovable AI (Gemini)
- Semantic search across automation wiki
- Smart Audit video analysis → structured JSON output
- Reference validation: cross-check suggestions against forum sources, append proof links

### 7. Automation Wiki Data
- Seed data from n8n, Zapier, Make, Reddit communities
- Categories for Israeli platforms (Priority, Kaveret, Sensei, Fireberry, Koala, etc.)
- AI tool integrations database (Claude, GPT, Gemini, Perplexity, OpenClaw, Kolbo.AI)
- Company benchmark data (OpenAI, HubSpot, Salesforce, Monday workflows)

## Phase 4: Integrations & Payments

### 8. Webhook Hub
- "Push to n8n" / "Push to Make" / "Push to Zapier" buttons on every recommendation
- Structured payload output matching each platform's webhook format

### 9. Payments (Stripe)
- **Free**: Basic activity tracking, limited suggestions
- **Pro**: Smart Audit, full Wiki access, benchmark data, unlimited suggestions

## Key UI Components
- **Automation Cards**: "Tool A ➔ Tool B" with proof badges and source links
- **Speedometer Widget**: Real-time pattern detection indicator
- **Warp Speed Overlay**: Framer Motion radial blur animation
- **Smart Audit Dropzone**: Drag & drop video upload with neon pulse processing indicator
- **ROI Dashboard**: Visual charts showing time/money saved

