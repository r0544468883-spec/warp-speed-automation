import { Briefcase } from "lucide-react";
import { Card } from "@/components/ui/card";

const industries = [
  { id: "marketing", label: "שיווק", emoji: "📣" },
  { id: "sales", label: "מכירות", emoji: "🤝" },
  { id: "operations", label: "תפעול", emoji: "⚙️" },
  { id: "tech", label: "טכנולוגיה", emoji: "💻" },
  { id: "hr", label: "משאבי אנוש", emoji: "👥" },
  { id: "finance", label: "פיננסים", emoji: "💰" },
  { id: "ecommerce", label: "מסחר אלקטרוני", emoji: "🛒" },
  { id: "consulting", label: "ייעוץ", emoji: "🎯" },
  { id: "other", label: "אחר", emoji: "🌐" },
];

interface Props {
  value: string;
  onChange: (industry: string) => void;
}

export default function IndustryStep({ value, onChange }: Props) {
  return (
    <div className="text-center">
      <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-primary/10 border border-primary/30 mb-4">
        <Briefcase className="h-8 w-8 text-primary" />
      </div>
      <h2 className="text-2xl font-heading font-bold text-gradient mb-2">באיזה תחום אתה עובד?</h2>
      <p className="text-muted-foreground text-sm mb-8">נתאים את ההמלצות בדיוק לתעשייה שלך</p>

      <div className="grid grid-cols-3 gap-3 max-w-2xl mx-auto">
        {industries.map((ind) => (
          <Card
            key={ind.id}
            onClick={() => onChange(ind.id)}
            className={`p-5 text-center cursor-pointer transition-all hover:border-primary/40 hover:scale-105 ${
              value === ind.id ? "border-primary bg-primary/10 shadow-lg shadow-primary/20" : "bg-card/50 border-border"
            }`}
          >
            <span className="text-3xl block mb-2">{ind.emoji}</span>
            <span className="text-sm font-medium">{ind.label}</span>
          </Card>
        ))}
      </div>
    </div>
  );
}
