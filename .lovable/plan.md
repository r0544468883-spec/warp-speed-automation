
## תוכנית: שדרוג דיאלוג שליחה + הפיכת הוויקי לפיד אישי

### חלק 1: שדרוג SendToPlatformButton
**בחירת פלטפורמה בתוך הדיאלוג + עריכת JSON:**
- הסרת לוגיקת ה-quick send לפי `defaultPlatform` — כפתור יחיד תמיד פותח דיאלוג
- בדיאלוג יתווספו 3 טאבים/כפתורי בחירה: n8n / Make / Zapier (עם סטטוס webhook configured/missing לכל אחד)
- ה-JSON יוצג ב-`<Textarea>` הניתן לעריכה במקום `<pre>` קריא בלבד
- ולידציה: לפני שליחה — `JSON.parse` עם הצגת toast שגיאה אם לא תקין
- כפתור "Reset" להחזרת ה-JSON המקורי
- שליחה משתמשת ב-JSON שנערך + בפלטפורמה שנבחרה

### חלק 2: הפיכת הוויקי לפיד המלצות אישי

**הרעיון החדש:** במקום ויקי סטטי מהDB → פיד דינמי שמצליב את ה-`tool_stack` של המשתמש (מ-`profiles`) עם חיפוש חי ברשת ומחזיר מאמרים + תהליכי אוטומציה רלוונטיים.

**שינויים נדרשים:**

1. **טבלה חדשה `saved_articles`** (migration):
   - `id, user_id, title, url, snippet, source, tools_matched (text[]), saved_at`
   - RLS: רק הבעלים רואה/מוסיף/מוחק

2. **Edge Function חדש `discover-automations`**:
   - קלט: `tool_stack` של המשתמש (למשל `["whatsapp","monday"]`)
   - יוצר combinations של זוגות כלים
   - משתמש ב-**Lovable AI** (`google/gemini-3-flash-preview`) עם web grounding/חיפוש כדי להחזיר 8-12 המלצות מאמרים אמיתיים מהרשת (כותרת, URL, תקציר, רשימת trigger/action, פלטפורמה מומלצת)
   - מחזיר JSON מובנה דרך tool calling
   - cache פנימי לפי tool_stack hash + timestamp (כדי שריענון יביא תוצאות חדשות)

3. **שכתוב `src/pages/Wiki.tsx`**:
   - שינוי שם תצוגתי: "פיד אוטומציות מותאם אישית" 
   - בעת טעינה: מושך `tool_stack` מ-`profiles`, אם ריק → מציג CTA לעדכון בהגדרות
   - כפתור **"רענן המלצות"** (מפעיל edge function שוב)
   - כל כרטיס: כותרת + תקציר + tags של הכלים שתואמים + 3 כפתורים:
     - "שמור לאחר כך" (saved_articles insert/delete + אייקון bookmark מתמלא)
     - "צפה במקור" (פתיחת URL)
     - "שלח לפלטפורמה" (אם יש automation_json מובנה)
   - **טאב "שמורים"** — מציג רק את המאמרים מ-`saved_articles`
   - מחיקה משמורים בלחיצה על bookmark מלא

```text
┌──────────────── פיד אוטומציות ────────────────┐
│ Tabs: [המלצות לי] [שמורים]      [🔄 רענן]     │
│                                                │
│ הכלים שלך: WhatsApp · Monday · Gmail          │
├────────────────────────────────────────────────┤
│ ┌─────────────┐ ┌─────────────┐               │
│ │ מאמר n8n    │ │ Make tutorial│               │
│ │ WA→Monday   │ │ Gmail→Monday │               │
│ │ #whatsapp   │ │ #gmail       │               │
│ │ 🔖 🔗 ⚡    │ │ 🔖 🔗 ⚡     │               │
│ └─────────────┘ └─────────────┘               │
└────────────────────────────────────────────────┘
```

### Technical Details
- Edge function: `verify_jwt = true` (זקוק ל-user.id לבדיקת tool_stack)
- ניצול `LOVABLE_API_KEY` הקיים — אין צורך בסודות חדשים
- prompt ל-AI: דרישה מפורשת להחזיר URLs אמיתיים מ-n8n.io/community, make.com/templates, zapier.com/apps, medium, dev.to
- Tool calling schema: `recommendations: [{title, url, source, snippet, platform, tools_used[], trigger, action}]`
- שימור ה-`automation_wiki` הקיים כ-fallback אם ה-AI לא מחזיר תוצאות

### קבצים מושפעים
- **migration**: יצירת `saved_articles` + RLS
- **edge function חדשה**: `supabase/functions/discover-automations/index.ts` + רישום ב-`config.toml`
- **`src/components/SendToPlatformButton.tsx`**: בחירת פלטפורמה + Textarea לעריכת JSON
- **`src/pages/Wiki.tsx`**: שכתוב מלא לפיד דינמי עם טאבים ושמורים

### הערה
אם ה-`tool_stack` של המשתמש ריק (לא השלים onboarding) → במקום פיד נציג כרטיס הזמנה לעדכן את הכלים שלו בהגדרות, עם קישור ישיר.
