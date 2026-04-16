import { Zap } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface Props {
  nickname: string;
  bio: string;
  onChange: (data: { nickname: string; bio: string }) => void;
}

export default function WelcomeStep({ nickname, bio, onChange }: Props) {
  return (
    <div className="text-center relative">
      {/* Warp speed background */}
      <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none rounded-2xl">
        {Array.from({ length: 14 }).map((_, i) => (
          <div
            key={i}
            className="absolute h-px animate-speed-lines"
            style={{
              top: `${(i * 7) % 100}%`,
              width: `${30 + (i * 13) % 50}%`,
              right: 0,
              background: `linear-gradient(to left, transparent, hsl(var(--${i % 2 ? "secondary" : "primary"}) / 0.5), transparent)`,
              animationDelay: `${(i * 0.15) % 1.5}s`,
              animationDuration: `${1.2 + (i % 4) * 0.3}s`,
            }}
          />
        ))}
      </div>

      <div className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 border border-primary/30 mb-6 animate-pulse-glow">
        <Zap className="h-10 w-10 text-primary" />
      </div>
      <h2 className="text-3xl font-heading font-bold text-gradient mb-2">ברוך הבא ל-24.7 AUTOMATION 👋</h2>
      <p className="text-muted-foreground text-sm mb-8">בוא נכיר אותך — זה ייקח דקה</p>

      <div className="space-y-4 text-right max-w-md mx-auto">
        <div>
          <Label className="text-sm mb-1 block">כינוי (אופציונלי)</Label>
          <Input
            value={nickname}
            onChange={(e) => onChange({ nickname: e.target.value, bio })}
            placeholder="איך תרצה שיקראו לך בקהילה?"
            className="bg-muted/50 border-border"
          />
        </div>
        <div>
          <Label className="text-sm mb-1 block">ביו קצר (אופציונלי)</Label>
          <Textarea
            value={bio}
            onChange={(e) => onChange({ nickname, bio: e.target.value.slice(0, 200) })}
            placeholder="ספר על עצמך ב-2 משפטים..."
            className="bg-muted/50 border-border min-h-[80px]"
            maxLength={200}
          />
          <div className="text-xs text-muted-foreground mt-1">{bio.length}/200</div>
        </div>
      </div>
    </div>
  );
}
