import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ArrowLeft, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import OnboardingProgress from "@/components/onboarding/OnboardingProgress";
import WelcomeStep from "@/components/onboarding/WelcomeStep";
import AvatarStep from "@/components/onboarding/AvatarStep";
import IndustryStep from "@/components/onboarding/IndustryStep";
import ToolsStep from "@/components/onboarding/ToolsStep";
import FeaturesTourStep from "@/components/onboarding/FeaturesTourStep";
import ExtensionStep from "@/components/onboarding/ExtensionStep";
import CompleteStep from "@/components/onboarding/CompleteStep";

const TOTAL_STEPS = 7;

export default function Onboarding() {
  const [step, setStep] = useState(1);
  const [transitioning, setTransitioning] = useState(false);
  const [nickname, setNickname] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [industry, setIndustry] = useState("");
  const [tools, setTools] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const { user, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (profile) {
      setNickname(profile.display_name || "");
      setIndustry(profile.industry_type || "");
      setTools(profile.tool_stack || []);
      setAvatarUrl((profile as any).avatar_url || "");
    }
  }, [profile]);

  const triggerTransition = (target: number) => {
    if (transitioning) return;
    setTransitioning(true);
    setTimeout(() => {
      setStep(target);
      setTimeout(() => setTransitioning(false), 50);
    }, 350);
  };

  const next = () => triggerTransition(Math.min(step + 1, TOTAL_STEPS));
  const back = () => triggerTransition(Math.max(step - 1, 1));

  const finish = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          nickname: nickname || null,
          bio: bio || null,
          avatar_url: avatarUrl || null,
          industry_type: industry || null,
          tool_stack: tools,
          onboarding_completed: true,
        })
        .eq("user_id", user.id);
      if (error) throw error;
      await supabase.from("ai_recommendations_cache").delete().eq("user_id", user.id);
      await refreshProfile();
      toast.success("ברוך הבא! 🚀");
      navigate("/");
    } catch (e) {
      toast.error("שגיאה בשמירת הפרופיל");
    } finally {
      setSaving(false);
    }
  };

  const canProceed = () => {
    if (step === 3) return !!industry;
    if (step === 4) return tools.length > 0;
    return true;
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden" dir="rtl">
      {/* Step transition warp speed overlay */}
      <AnimatePresence>
        {transitioning && (
          <motion.div
            className="fixed inset-0 z-50 pointer-events-none overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="absolute inset-0"
              animate={{ opacity: [0, 0.5, 0] }}
              transition={{ duration: 0.4 }}
              style={{
                background:
                  "radial-gradient(circle at center, hsl(var(--primary) / 0.15), hsl(var(--secondary) / 0.08), transparent 70%)",
              }}
            />
            {Array.from({ length: 22 }).map((_, i) => (
              <motion.div
                key={i}
                className="absolute h-px"
                style={{
                  top: `${(i * 4.5) % 100}%`,
                  right: "-10%",
                  width: `${25 + (i * 11) % 50}%`,
                  background: `linear-gradient(to left, transparent, hsl(var(--${i % 2 ? "secondary" : "primary"}) / 0.7), transparent)`,
                }}
                initial={{ x: "100%", opacity: 0 }}
                animate={{ x: "-200%", opacity: [0, 1, 0] }}
                transition={{ duration: 0.5, delay: (i * 0.02) % 0.2, ease: "easeOut" }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="w-full max-w-3xl">
        <div className="flex items-center justify-center gap-2 mb-6">
          <Zap className="h-5 w-5 text-primary" />
          <span className="font-heading font-bold tracking-wider text-sm">24.7 AUTOMATION</span>
        </div>

        <OnboardingProgress current={step} total={TOTAL_STEPS} />

        <div className="bg-card/30 border border-border rounded-2xl p-6 sm:p-10 backdrop-blur-sm min-h-[480px] flex flex-col">
          <div className="flex-1">
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 30, filter: "blur(8px)" }}
                animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, x: -30, filter: "blur(8px)" }}
                transition={{ duration: 0.35 }}
              >
                {step === 1 && (
                  <WelcomeStep
                    nickname={nickname}
                    bio={bio}
                    onChange={(d) => { setNickname(d.nickname); setBio(d.bio); }}
                  />
                )}
                {step === 2 && <AvatarStep avatarUrl={avatarUrl} onChange={setAvatarUrl} />}
                {step === 3 && <IndustryStep value={industry} onChange={setIndustry} />}
                {step === 4 && <ToolsStep value={tools} onChange={setTools} />}
                {step === 5 && <FeaturesTourStep />}
                {step === 6 && <ExtensionStep />}
                {step === 7 && <CompleteStep />}
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
            <Button
              variant="ghost"
              onClick={back}
              disabled={step === 1}
              className="text-muted-foreground"
            >
              <ArrowRight className="h-4 w-4 ml-1" /> חזור
            </Button>

            <div className="flex gap-2">
              {step < TOTAL_STEPS && step > 1 && (
                <Button variant="ghost" onClick={next} className="text-muted-foreground text-xs">
                  דלג
                </Button>
              )}
              {step < TOTAL_STEPS ? (
                <Button
                  onClick={next}
                  disabled={!canProceed()}
                  className="bg-gradient-to-l from-primary to-secondary text-primary-foreground"
                >
                  הבא <ArrowLeft className="h-4 w-4 mr-1" />
                </Button>
              ) : (
                <Button
                  onClick={finish}
                  disabled={saving}
                  className="bg-gradient-to-l from-primary to-secondary text-primary-foreground gap-2"
                >
                  <Zap className="h-4 w-4" />
                  {saving ? "שומר..." : "כנס לדשבורד"}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
