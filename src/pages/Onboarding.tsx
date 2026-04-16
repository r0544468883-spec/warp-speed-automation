import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, ArrowLeft, Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import WarpSpeedOverlay from "@/components/WarpSpeedOverlay";

const industries = [
  { id: "tech", label: "טכנולוגיה", emoji: "💻" },
  { id: "finance", label: "פיננסים", emoji: "💰" },
  { id: "marketing", label: "שיווק", emoji: "📣" },
  { id: "sales", label: "מכירות", emoji: "🤝" },
  { id: "operations", label: "תפעול", emoji: "⚙️" },
  { id: "hr", label: "משאבי אנוש", emoji: "👥" },
  { id: "legal", label: "משפטים", emoji: "⚖️" },
  { id: "education", label: "חינוך", emoji: "🎓" },
  { id: "healthcare", label: "בריאות", emoji: "🏥" },
  { id: "ecommerce", label: "מסחר אלקטרוני", emoji: "🛒" },
  { id: "real-estate", label: "נדל\"ן", emoji: "🏠" },
  { id: "other", label: "אחר", emoji: "🌐" },
];

const tools = [
  "Gmail", "Monday", "Priority", "Claude", "Fireberry", "Airtable",
  "ClickUp", "Jira", "HubSpot", "Salesforce", "Slack", "Notion",
  "Google Sheets", "Zapier", "n8n", "Make", "Asana", "Trello",
  "LinkedIn", "WhatsApp Business", "Kaveret", "Sensei", "Koala",
  "ChatGPT", "Perplexity", "Gemini",
];

const benchmarks = [
  { company: "OpenAI", desc: "אוטומציה של onboarding + ניתוח תמיכה", tools: ["Slack", "Notion", "n8n"] },
  { company: "HubSpot", desc: "ניהול לידים אוטומטי מקצה לקצה", tools: ["Gmail", "Salesforce", "Make"] },
  { company: "Monday.com", desc: "CI/CD + דוחות אוטומטיים", tools: ["Jira", "Slack", "n8n"] },
];

export default function Onboarding() {
  const [step, setStep] = useState(0);
  const [industry, setIndustry] = useState("");
  const [selectedTools, setSelectedTools] = useState<string[]>([]);
  const [warpActive, setWarpActive] = useState(false);
  const [saving, setSaving] = useState(false);
  const { user, refreshProfile } = useAuth();
  const navigate = useNavigate();

  const toggleTool = (tool: string) => {
    setSelectedTools((prev) =>
      prev.includes(tool) ? prev.filter((t) => t !== tool) : [...prev, tool]
    );
  };

  const nextStep = () => {
    setWarpActive(true);
    setTimeout(() => setStep((s) => s + 1), 600);
  };

  const finish = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          industry_type: industry,
          tool_stack: selectedTools,
          onboarding_completed: true,
        })
        .eq("user_id", user.id);
      if (error) throw error;
      await refreshProfile();
      setWarpActive(true);
      setTimeout(() => navigate("/"), 800);
    } catch {
      toast.error("שגיאה בשמירת הפרופיל");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4" dir="rtl">
      <WarpSpeedOverlay active={warpActive} onComplete={() => setWarpActive(false)} />

      <div className="w-full max-w-2xl">
        {/* Progress */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={`h-2 rounded-full transition-all ${
                i <= step ? "w-12 bg-primary" : "w-8 bg-muted"
              }`}
            />
          ))}
        </div>

        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div key="step0" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }}>
              <h2 className="text-2xl font-heading font-bold text-gradient text-center mb-2">באיזה תחום אתה עובד?</h2>
              <p className="text-muted-foreground text-center text-sm mb-8">זה יעזור לנו להתאים המלצות אוטומציה בדיוק עבורך</p>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {industries.map((ind) => (
                  <Card
                    key={ind.id}
                    onClick={() => setIndustry(ind.id)}
                    className={`p-4 text-center cursor-pointer transition-all hover:border-primary/30 ${
                      industry === ind.id ? "border-primary bg-primary/10" : "bg-card/50 border-border"
                    }`}
                  >
                    <span className="text-2xl block mb-1">{ind.emoji}</span>
                    <span className="text-xs font-medium">{ind.label}</span>
                  </Card>
                ))}
              </div>
              <Button
                onClick={nextStep}
                disabled={!industry}
                className="w-full mt-6 bg-gradient-to-l from-primary to-secondary text-primary-foreground"
              >
                המשך <ArrowLeft className="h-4 w-4 mr-2" />
              </Button>
            </motion.div>
          )}

          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }}>
              <h2 className="text-2xl font-heading font-bold text-gradient text-center mb-2">באילו כלים אתה משתמש?</h2>
              <p className="text-muted-foreground text-center text-sm mb-8">בחר את הכלים שאתה עובד איתם יום-יום</p>
              <div className="flex flex-wrap gap-2 justify-center">
                {tools.map((tool) => (
                  <Button
                    key={tool}
                    variant={selectedTools.includes(tool) ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleTool(tool)}
                    className={selectedTools.includes(tool)
                      ? "bg-primary text-primary-foreground"
                      : "border-border text-muted-foreground hover:text-foreground"
                    }
                  >
                    {selectedTools.includes(tool) && <Check className="h-3 w-3 ml-1" />}
                    {tool}
                  </Button>
                ))}
              </div>
              <Button
                onClick={nextStep}
                disabled={selectedTools.length === 0}
                className="w-full mt-6 bg-gradient-to-l from-primary to-secondary text-primary-foreground"
              >
                המשך <ArrowLeft className="h-4 w-4 mr-2" />
              </Button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }}>
              <h2 className="text-2xl font-heading font-bold text-gradient text-center mb-2">
                <Sparkles className="inline h-6 w-6 text-primary ml-2" />
                ראה מה חברות מובילות מאוטמטות
              </h2>
              <p className="text-muted-foreground text-center text-sm mb-8">אלו הארכיטקטורות שלהם — ואנחנו נעזור לך להגיע לשם</p>
              <div className="space-y-4">
                {benchmarks.map((b) => (
                  <Card key={b.company} className="bg-card/50 border-border p-5">
                    <h3 className="font-heading font-bold text-lg mb-1">{b.company}</h3>
                    <p className="text-sm text-muted-foreground mb-3">{b.desc}</p>
                    <div className="flex gap-2">
                      {b.tools.map((t) => (
                        <span key={t} className="text-[10px] px-2 py-1 bg-primary/10 text-primary rounded-full">{t}</span>
                      ))}
                    </div>
                  </Card>
                ))}
              </div>
              <Button
                onClick={finish}
                disabled={saving}
                className="w-full mt-6 bg-gradient-to-l from-primary to-secondary text-primary-foreground gap-2"
              >
                <Zap className="h-4 w-4" />
                {saving ? "שומר..." : "בוא נתחיל! 🚀"}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
