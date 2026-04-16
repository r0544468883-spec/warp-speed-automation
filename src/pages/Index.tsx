import { useState } from "react";
import { motion } from "framer-motion";
import { Zap, TrendingUp, Clock, Activity, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import SpeedometerWidget from "@/components/SpeedometerWidget";
import AutomationCard from "@/components/AutomationCard";
import WarpSpeedOverlay from "@/components/WarpSpeedOverlay";
import DashboardLayout from "@/components/DashboardLayout";

const mockSuggestions = [
  { toolFrom: "Gmail", toolTo: "Monday", description: "זוהה שאתה מעביר משימות מג'ימייל למאנדיי באופן ידני. אוטומציה זו תעשה זאת אוטומטית.", category: "ניהול משימות", proofCount: 47, platform: "n8n" as const },
  { toolFrom: "LinkedIn", toolTo: "Fireberry", description: "העתקת פרטי לידים מלינקדאין ל-Fireberry. Agent AI יכול לעשות את המחקר הזה עבורך.", category: "מכירות", proofCount: 23, platform: "make" as const },
  { toolFrom: "Claude", toolTo: "Priority", description: "שימוש בפרומפטים חוזרים ב-Claude לצורך הפקת דוחות לפריוריטי. ניתן לאוטומט דרך n8n.", category: "פיננסי", proofCount: 12, platform: "n8n" as const },
];

const stats = [
  { icon: Clock, label: "זמן שנחסך", value: "12.5 שעות", color: "text-primary" },
  { icon: TrendingUp, label: "אוטומציות פעילות", value: "8", color: "text-success" },
  { icon: Activity, label: "דפוסים שזוהו", value: "23", color: "text-secondary" },
  { icon: Sparkles, label: "המלצות חדשות", value: "5", color: "text-primary" },
];

export default function Index() {
  const [warpActive, setWarpActive] = useState(false);

  return (
    <DashboardLayout>
      <WarpSpeedOverlay active={warpActive} onComplete={() => setWarpActive(false)} />

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-heading font-bold text-gradient mb-1">שלום! 👋</h1>
          <p className="text-muted-foreground text-sm">הנה הסיכום היומי שלך</p>
        </div>
        <Button
          onClick={() => setWarpActive(true)}
          className="gap-2 bg-gradient-to-l from-primary to-secondary text-primary-foreground hover:opacity-90"
        >
          <Zap className="h-4 w-4" /> מהירות אור
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
            <Card className="bg-card/50 backdrop-blur-sm border-border hover:border-primary/20 transition-colors">
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`p-2 rounded-lg bg-muted ${stat.color}`}>
                  <stat.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                  <p className="text-xl font-heading font-bold">{stat.value}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Suggestions */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-heading font-semibold flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" /> המלצות אוטומציה
          </h2>
          {mockSuggestions.map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 + i * 0.1 }}>
              <AutomationCard {...s} />
            </motion.div>
          ))}
        </div>

        {/* Speedometer */}
        <div className="space-y-4">
          <h2 className="text-lg font-heading font-semibold">מד דפוסים</h2>
          <Card className="bg-card/50 backdrop-blur-sm border-border p-6 flex flex-col items-center">
            <SpeedometerWidget value={67} />
            <p className="text-xs text-muted-foreground mt-4 text-center">
              זוהו 23 דפוסים חוזרים בשעה האחרונה
            </p>
            <Button variant="outline" size="sm" className="mt-4 w-full border-primary/30 text-primary hover:bg-primary/10">
              צפה בכולם
            </Button>
          </Card>

          <Card className="bg-card/50 backdrop-blur-sm border-border p-6">
            <h3 className="text-sm font-heading font-semibold mb-3">אפליקציות פעילות</h3>
            {["Gmail", "Monday", "Claude", "Priority", "Fireberry"].map((app) => (
              <div key={app} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <span className="text-sm">{app}</span>
                <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
              </div>
            ))}
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
