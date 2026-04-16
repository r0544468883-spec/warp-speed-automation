import { BookOpen, Users, TrendingUp, Send } from "lucide-react";
import { Card } from "@/components/ui/card";

const features = [
  { icon: BookOpen, title: "Wiki", desc: "פיד אוטומציות מותאם לכלים שלך — מתעדכן יומיומית", color: "text-primary" },
  { icon: Users, title: "Help Us Grow", desc: "תרומות קהילה: אוטומציות, מומחים, קייסים ופורומים", color: "text-secondary" },
  { icon: TrendingUp, title: "ROI / Smart Audit", desc: "מדוד כמה זמן וכסף האוטומציות חוסכות לך", color: "text-success" },
  { icon: Send, title: "Send History", desc: "היסטוריית שליחות לפלטפורמות (n8n / Make / Zapier)", color: "text-amber-400" },
];

export default function FeaturesTourStep() {
  return (
    <div className="text-center">
      <h2 className="text-2xl font-heading font-bold text-gradient mb-2">סיור מהיר במסכים</h2>
      <p className="text-muted-foreground text-sm mb-8">אלו 4 הכלים העיקריים שתשתמש בהם</p>

      <div className="grid sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
        {features.map((f) => {
          const Icon = f.icon;
          return (
            <Card key={f.title} className="bg-card/50 border-border p-5 text-right hover:border-primary/30 transition-all hover:scale-[1.02]">
              <div className={`inline-flex items-center justify-center h-10 w-10 rounded-lg bg-muted mb-3 ${f.color}`}>
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="font-heading font-bold text-base mb-1">{f.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
