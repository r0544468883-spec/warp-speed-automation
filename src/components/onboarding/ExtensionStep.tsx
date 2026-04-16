import { Puzzle, Download, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";

const benefits = [
  "לכידה אוטומטית של אוטומציות מ-20+ פלטפורמות",
  "זיהוי דפוסים חוזרים בזמן אמת",
  "סנכרון מיידי עם הוויקי שלך",
];

export default function ExtensionStep() {
  const navigate = useNavigate();
  return (
    <div className="text-center">
      <div className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 border border-primary/30 mb-4">
        <Puzzle className="h-10 w-10 text-primary" />
      </div>
      <h2 className="text-2xl font-heading font-bold text-gradient mb-2">תוסף Chrome 🧩</h2>
      <p className="text-muted-foreground text-sm mb-6">הסוד שמאפשר ל-24.7 לזהות אוטומציות מבלי שתרים אצבע</p>

      <Card className="bg-card/50 border-border p-5 max-w-md mx-auto text-right mb-6">
        <ul className="space-y-2.5">
          {benefits.map((b) => (
            <li key={b} className="flex items-start gap-2 text-sm">
              <Check className="h-4 w-4 text-success shrink-0 mt-0.5" />
              <span>{b}</span>
            </li>
          ))}
        </ul>
      </Card>

      <Button
        onClick={() => navigate("/extension")}
        className="bg-gradient-to-l from-primary to-secondary text-primary-foreground gap-2"
      >
        <Download className="h-4 w-4" /> הורד את התוסף עכשיו
      </Button>
      <p className="text-xs text-muted-foreground mt-3">תוכל להתקין מאוחר יותר — לחץ "הבא" כדי להמשיך</p>
    </div>
  );
}
