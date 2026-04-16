
## תוכנית: Help Us Grow — מסך תרומות קהילה

### המטרה
מסך חדש שבו משתמשים תורמים תוכן לקהילה: אוטומציות שעשו, מומחים שכדאי לעקוב, דפי לינקדין, קייס סטאדיז ופורומים. כל ההמלצות נצברות, מקבלות לייקים, ואפשר לסנן לפי קטגוריה.

### חלק 1: סכמת DB

**טבלה חדשה `community_contributions`:**
- `id, user_id, type` (enum: `automation` / `expert` / `linkedin` / `case_study` / `forum` / `other`)
- `title, description, url, tags[], tools_related[]`
- `upvotes` (int, default 0)
- `status` (`pending` / `approved` — כל התרומות מוצגות מיידית, אדמין יכול לסמן approved להבלטה)
- `created_at, updated_at`

**טבלה חדשה `contribution_votes`:**
- `id, contribution_id, user_id, created_at`
- UNIQUE על `(contribution_id, user_id)` — מונע כפל הצבעות

**RLS:**
- `community_contributions`: SELECT לכולם המאומתים; INSERT — `auth.uid() = user_id`; UPDATE/DELETE — בעלים בלבד
- `contribution_votes`: SELECT לכולם; INSERT/DELETE — `auth.uid() = user_id`
- **טריגר** שמעדכן `upvotes` ב-`community_contributions` בכל insert/delete ב-`contribution_votes`

### חלק 2: Edge Function `submit-contribution` (אופציונלי)
ולידציה נוספת בשרת + בדיקת URL תקין. ניתן לדלג בשלב הראשון ולהשתמש בinsert ישיר עם zod client-side.

### חלק 3: UI — `src/pages/HelpUsGrow.tsx`

**Layout:**
```text
┌──── Help Us Grow 🌱 ────────────────────┐
│ "תרום לקהילה — שתף מה שעבד אצלך"        │
│                          [+ הוסף המלצה] │
├──────────────────────────────────────────┤
│ Tabs: [הכל] [אוטומציות] [מומחים]        │
│        [LinkedIn] [Case Studies] [פורומים]│
├──────────────────────────────────────────┤
│ ┌─────────────┐ ┌─────────────┐         │
│ │ type-icon   │ │ type-icon   │         │
│ │ כותרת       │ │ כותרת       │         │
│ │ תיאור קצר   │ │ תיאור קצר   │         │
│ │ #tags       │ │ #tags       │         │
│ │ ❤ 24  🔗   │ │ ❤ 12  🔗   │         │
│ │ by @user    │ │ by @user    │         │
│ └─────────────┘ └─────────────┘         │
└──────────────────────────────────────────┘
```

**דיאלוג "הוסף המלצה":**
- בחירת `type` (Select)
- כותרת (max 120), תיאור (max 500), URL (validation), תגיות (comma-separated → array), כלים קשורים (multi-select מתוך `tool_stack` של המשתמש + free input)
- Zod validation client-side
- שליחה ישירה ל-`community_contributions` עם `user_id = auth.uid()`

**אינטראקציות בכרטיס:**
- כפתור לב (toggle) — insert/delete ב-`contribution_votes`; UI אופטימיסטי
- כפתור 🔗 פותח URL בטאב חדש
- אם זה `automation` ויש `automation_json` בעתיד — כפתור SendToPlatformButton (גנרי, אבל בשלב הראשון לא חובה)
- האייקון לכל type שונה (Workflow / User / Linkedin / FileText / MessageSquare)
- מי שתרם רואה כפתור "מחק" משלו

**מיון/סינון:**
- ברירת מחדל: לפי `upvotes DESC, created_at DESC`
- חיפוש חופשי בכותרת/תיאור/tags
- סינון לפי tab של type

### חלק 4: ניווט
הוספת פריט חדש ב-`DashboardLayout.tsx`:
- path: `/help-us-grow`, icon: `Sprout` (או `Heart`), label: "תרום לקהילה"
- רישום ב-`App.tsx` עם `ProtectedRoute`

### Technical
- שימוש ב-zod לולידציה (להתקין אם אין: כבר יש בפרויקט דרך shadcn forms)
- ה-`upvotes` counter דרך טריגר Postgres — מונע race conditions
- realtime אופציונלי בעתיד (`ALTER PUBLICATION supabase_realtime ADD TABLE community_contributions`) — נשאיר לשיפור עתידי
- כל הטקסטים בעברית, RTL

### קבצים מושפעים
- **migration**: `community_contributions` + `contribution_votes` + טריגר upvotes + RLS
- **חדש**: `src/pages/HelpUsGrow.tsx`
- **חדש**: `src/components/ContributionCard.tsx` (לסדר את הקוד)
- **חדש**: `src/components/AddContributionDialog.tsx`
- **עריכה**: `src/App.tsx` (route חדש), `src/components/DashboardLayout.tsx` (פריט ניווט)
