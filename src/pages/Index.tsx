import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Zap, TrendingUp, Clock, Activity, Sparkles, Send } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import SpeedometerWidget from "@/components/SpeedometerWidget";
import AutomationCard from "@/components/AutomationCard";
import WarpSpeedOverlay from "@/components/WarpSpeedOverlay";
import DashboardLayout from "@/components/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface Suggestion {
  toolFrom: string;
  toolTo: string;
  description: string;
  category: string;
  platform: "n8n" | "make" | "zapier";
  estimatedTimeSaved?: string;
}

const stats = [
  { icon: Clock, label: "זמן שנחסך", value: "12.5 שעות", color: "text-primary" },
  { icon: TrendingUp, label: "אוטומציות פעילות", value: "8", color: "text-success" },
  { icon: Activity, label: "דפוסים שזוהו", value: "23", color: "text-secondary" },
  { icon: Sparkles, label: "המלצות חדשות", value: "5", color: "text-primary" },
];

export default function Index() {
  const [warpActive, setWarpActive] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [manualInput, setManualInput] = useState("");
  const { profile } = useAuth();

  const fetchAISuggestions = async (description?: string) => {
    setLoading(true);
    setWarpActive(true);
    try {
      const { data, error } = await supabase.functions.invoke("analyze-patterns", {
        body: { description: description || undefined },
      });
      if (error) throw error;
      if (data?.suggestions) {
        setSuggestions(data.suggestions);
        // Trigger global speed flash when AI detects patterns
        const { triggerSpeedFlash } = await import("@/components/SpeedFlash");
        triggerSpeedFlash();
      }
    } catch (err: any) {
      console.error(err);
      toast.error("שגיאה בטעינת המלצות AI");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAISuggestions();
  }, []);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualInput.trim()) return;
    fetchAISuggestions(manualInput);
    setManualInput("");
  };

  return (
    <DashboardLayout>
      <WarpSpeedOverlay active={warpActive} onComplete={() => setWarpActive(false)} />

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-heading font-bold text-gradient mb-1">
            שלום{profile?.display_name ? `, ${profile.display_name}` : ""}! 👋
          </h1>
          <p className="text-muted-foreground text-sm">הנה הסיכום היומי שלך</p>
        </div>
        <Button
          onClick={() => fetchAISuggestions()}
          disabled={loading}
          className="gap-2 bg-gradient-to-l from-primary to-secondary text-primary-foreground hover:opacity-90"
        >
          <Zap className="h-4 w-4" /> {loading ? "מנתח..." : "נתח דפוסים"}
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

      {/* Manual Mode */}
      <Card className="bg-card/50 backdrop-blur-sm border-border p-4 mb-8">
        <form onSubmit={handleManualSubmit} className="flex gap-3">
          <Input
            value={manualInput}
            onChange={(e) => setManualInput(e.target.value)}
            placeholder="תאר קושי או משימה חוזרת... (למשל: ״אני מעתיק לידים מלינקדאין לאקסל כל יום״)"
            className="bg-background/50 border-border flex-1"
          />
          <Button type="submit" disabled={loading || !manualInput.trim()} className="bg-primary text-primary-foreground gap-2">
            <Send className="h-4 w-4" /> שלח
          </Button>
        </form>
      </Card>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Suggestions */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-heading font-semibold flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" /> המלצות אוטומציה {loading && <span className="text-xs text-muted-foreground">(מנתח...)</span>}
          </h2>
          {suggestions.length > 0
            ? suggestions.map((s, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 + i * 0.1 }}>
                  <AutomationCard {...s} proofCount={Math.floor(Math.random() * 100) + 10} />
                </motion.div>
              ))
            : !loading && (
                <Card className="bg-card/50 border-border p-8 text-center">
                  <Sparkles className="h-8 w-8 text-primary mx-auto mb-3 opacity-50" />
                  <p className="text-muted-foreground text-sm">תאר קושי או לחץ "נתח דפוסים" לקבלת המלצות</p>
                </Card>
              )}
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
            {(profile?.tool_stack?.length ? profile.tool_stack.slice(0, 5) : ["Gmail", "Monday", "Claude", "Priority", "Fireberry"]).map((app) => (
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
