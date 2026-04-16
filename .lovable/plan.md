
## תוכנית: מסך Onboarding מלא (6 שלבים)

### טריגרים
1. משתמש מאומת חדש עם `onboarding_completed=false` → ניתוב אוטומטי ל-`/onboarding`.
2. כפתור חדש בהגדרות "הצג סיור מחדש" שמאפס `onboarding_completed=false` ושולח ל-`/onboarding`.

### מבנה (6 שלבים, עמוד ייעודי `/onboarding` עם progress bar וניווט הבא/חזור/דלג)

**שלב 1 — ברוך הבא 👋**
- כותרת גדולה, לוגו 24.7 AUTOMATION, אנימציית warp speed קצרה ברקע
- שדה nickname (אופציונלי) + bio קצר (textarea, 200 תווים)
- שמירה ל-`profiles.nickname` + `profiles.bio`

**שלב 2 — תחום העיסוק**
- בחירת `industry_type` מתוך select (Marketing, Sales, Operations, Tech, HR, Finance, E-commerce, Consulting, Other)
- שמירה ל-`profiles.industry_type`

**שלב 3 — בחירת tool stack**
- שימוש ב-`ToolStackEditor` הקיים (Autocomplete של 70+ כלים)
- שמירה ל-`profiles.tool_stack`
- הסבר קצר: "הכלים שלך מזינים את פיד ההמלצות החכם"

**שלב 4 — סיור על המסכים הראשיים**
כרטיסים אינטראקטיביים (קליק = הסבר מורחב) של 4 הפיצ'רים העיקריים, כל אחד עם אייקון,<lov-plan>
## תוכנית: מסך Onboarding מלא (6 שלבים)

### טריגרים
1. משתמש מאומת חדש עם `onboarding_completed=false` → ניתוב אוטומטי ל-`/onboarding`.
2. כפתור חדש בהגדרות "הצג סיור מחדש" שמאפס `onboarding_completed=false` ושולח ל-`/onboarding`.

### מבנה (6 שלבים, עמוד ייעודי `/onboarding` עם progress bar וניווט הבא/חזור/דלג)

**שלב 1 — ברוך הבא 👋**
- כותרת גדולה, לוגו 24.7 AUTOMATION, אנימציית warp speed קצרה ברקע
- שדה nickname (אופציונלי) + bio קצר (textarea, 200 תווים)
- שמירה ל-`profiles.nickname` + `profiles.bio`

**שלב 2 — תחום העיסוק**
- בחירת `industry_type` מתוך Select (Marketing, Sales, Operations, Tech, HR, Finance, E-commerce, Consulting, Other)
- שמירה ל-`profiles.industry_type`

**שלב 3 — בחירת tool stack**
- שימוש ב-`ToolStackEditor` הקיים (Autocomplete של 70+ כלים)
- שמירה ל-`profiles.tool_stack`
- הסבר: "הכלים שלך מזינים את פיד ההמלצות החכם"

**שלב 4 — סיור על המסכים הראשיים**
כרטיסי הסבר עם אייקון + תיאור קצר + צילום מיני:
- **Wiki** — פיד אוטומציות מותאם
- **Help Us Grow** — תרומות קהילה
- **ROI / Smart Audit** — מדידת חיסכון בזמן
- **Send History** — היסטוריית שליחות לפלטפורמות

**שלב 5 — תוסף Chrome 🧩**
- הסבר מה התוסף עושה (לכידת אוטומציות אוטומטית מ-20+ פלטפורמות)
- כפתור "הורד עכשיו" → `/extension-download`
- כפתור "המשך בלי תוסף"

**שלב 6 — סיום 🎉**
- אנימציית הצלחה
- סיכום: "הפרופיל שלך מוכן! המלצות AI יופיעו ברגע שתפתח את הוויקי"
- כפתור "כנס לדשבורד" → `/` (`onboarding_completed=true`)

### Routing & Guards
- `/onboarding` — public-protected (דורש auth, אבל לא דורש onboarding completed)
- ב-`ProtectedRoute`: אם `profile.onboarding_completed=false` ו-route ≠ `/onboarding` → redirect ל-`/onboarding`
- ב-`Onboarding.tsx`: אם `onboarding_completed=true` ולא הגיעו דרך "הצג שוב" → redirect ל-`/`

### UI/UX
- Progress bar עליון (1/6, 2/6...) עם step dots
- כפתורי "חזור" / "דלג" / "הבא" בתחתית
- שלב אחרון: "סיים" במקום "הבא"
- אנימציות framer-motion בין שלבים (slide-x)
- RTL מלא, עיצוב dark space בהתאם ל-design tokens

### קבצים מושפעים
- **שכתוב מלא**: `src/pages/Onboarding.tsx` (קיים אבל מינימלי)
- **חדש**: `src/components/onboarding/` — `WelcomeStep.tsx`, `IndustryStep.tsx`, `ToolsStep.tsx`, `FeaturesTourStep.tsx`, `ExtensionStep.tsx`, `CompleteStep.tsx`, `OnboardingProgress.tsx`
- **עריכה**: `src/components/ProtectedRoute.tsx` (guard לפי `onboarding_completed`)
- **עריכה**: `src/pages/SettingsPage.tsx` (הוספת כפתור "הצג סיור מחדש")
- **אין שינויי DB** — כל השדות קיימים בטבלת `profiles` (`nickname`, `bio`, `industry_type`, `tool_stack`, `onboarding_completed`)
