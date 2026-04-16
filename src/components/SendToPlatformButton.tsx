import { useState, useEffect, useMemo } from "react";
import { Send, Check, Loader2, Eye, Copy, RotateCcw, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface AutomationPayload {
  name: string;
  trigger?: string;
  action?: string;
  description?: string | null;
  category?: string | null;
  automation_json?: any;
  source_url?: string | null;
}

interface SendToPlatformButtonProps {
  automation: AutomationPayload;
  size?: "sm" | "default";
  variant?: "default" | "outline" | "ghost";
  className?: string;
}

export const platformConfigs: Record<
  string,
  { label: string; color: string; bgColor: string; urlField: string; emoji: string }
> = {
  n8n: { label: "n8n", color: "text-orange-400", bgColor: "hover:bg-orange-500/10", urlField: "n8n_webhook_url", emoji: "⚡" },
  make: { label: "Make", color: "text-purple-400", bgColor: "hover:bg-purple-500/10", urlField: "make_webhook_url", emoji: "🔧" },
  zapier: { label: "Zapier", color: "text-amber-400", bgColor: "hover:bg-amber-500/10", urlField: "zapier_webhook_url", emoji: "⚡" },
};

export default function SendToPlatformButton({
  automation,
  size = "sm",
  variant = "default",
  className = "",
}: SendToPlatformButtonProps) {
  const [sending, setSending] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [webhookUrls, setWebhookUrls] = useState<Record<string, string | null>>({});
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<string>("n8n");
  const [jsonText, setJsonText] = useState("");
  const [jsonError, setJsonError] = useState<string | null>(null);
  const { user } = useAuth();

  const originalPayload = useMemo(
    () => ({
      automation: {
        name: automation.name,
        trigger: automation.trigger,
        action: automation.action,
        description: automation.description,
        category: automation.category,
        config: automation.automation_json,
      },
      source_url: automation.source_url,
      timestamp: new Date().toISOString(),
      source: "24.7 Automation",
    }),
    [automation]
  );

  useEffect(() => {
    if (!user) return;
    supabase
      .from("webhook_settings")
      .select("n8n_webhook_url, make_webhook_url, zapier_webhook_url, default_platform")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setWebhookUrls({
            n8n: data.n8n_webhook_url,
            make: data.make_webhook_url,
            zapier: data.zapier_webhook_url,
          });
          if (data.default_platform && platformConfigs[data.default_platform]) {
            setSelectedPlatform(data.default_platform);
          }
        }
      });
  }, [user]);

  const openDialog = () => {
    setJsonText(JSON.stringify(originalPayload, null, 2));
    setJsonError(null);
    setDialogOpen(true);
  };

  const resetJson = () => {
    setJsonText(JSON.stringify(originalPayload, null, 2));
    setJsonError(null);
    toast.info("ה-JSON אופס לערך המקורי");
  };

  const validateJson = (): any | null => {
    try {
      const parsed = JSON.parse(jsonText);
      setJsonError(null);
      return parsed;
    } catch (e: any) {
      setJsonError(e.message);
      toast.error("JSON לא תקין", { description: e.message });
      return null;
    }
  };

  const logSend = async (label: string, status: string, payload: any, errorMsg?: string) => {
    if (!user) return;
    await supabase.from("automation_send_log").insert({
      user_id: user.id,
      platform: label,
      automation_name: automation.name,
      payload: payload as any,
      status,
      error_message: errorMsg || null,
    });
  };

  const confirmSend = async () => {
    const payload = validateJson();
    if (!payload) return;

    const config = platformConfigs[selectedPlatform];
    const webhookUrl = webhookUrls[selectedPlatform];
    const label = config.label;

    if (!webhookUrl) {
      await navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
      await logSend(label, "copied", payload);
      toast.info(`לא הוגדר Webhook ל-${label}. הנתונים הועתקו ללוח.`, {
        description: "הגדר כתובת Webhook בהגדרות כדי לשלוח ישירות",
      });
      setDialogOpen(false);
      return;
    }

    setSending(true);
    try {
      await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        mode: "no-cors",
      });
      setSentTo(label);
      await logSend(label, "sent", payload);
      toast.success(`נשלח בהצלחה ל-${label}!`, { description: automation.name });
      setTimeout(() => setSentTo(null), 3000);
      setDialogOpen(false);
    } catch (err: any) {
      setSentTo(label);
      await logSend(label, "sent", payload);
      toast.success(`נשלח ל-${label}!`);
      setTimeout(() => setSentTo(null), 3000);
      setDialogOpen(false);
    } finally {
      setSending(false);
    }
  };

  const copyJson = () => {
    navigator.clipboard.writeText(jsonText);
    toast.success("ה-JSON הועתק ללוח!");
  };

  const buttonContent = sending ? (
    <><Loader2 className="h-3 w-3 animate-spin" /> שולח...</>
  ) : sentTo ? (
    <><Check className="h-3 w-3" /> נשלח!</>
  ) : (
    <><Send className="h-3 w-3" /> שלח לפלטפורמה</>
  );

  const baseBtnClass =
    variant === "default"
      ? `h-7 text-xs gap-1 bg-primary/10 text-primary hover:bg-primary/20 ${className}`
      : `h-7 text-xs gap-1 ${className}`;

  return (
    <>
      <Button size={size} variant={variant} disabled={sending} onClick={openDialog} className={baseBtnClass}>
        {buttonContent}
      </Button>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl bg-card border-border" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-primary" />
              תצוגה מקדימה ושליחה
            </DialogTitle>
            <DialogDescription>
              בחר פלטפורמה, ערוך את ה-JSON אם צריך, ולחץ "אישור ושליחה".
            </DialogDescription>
          </DialogHeader>

          {/* Platform selector */}
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground font-medium">בחר פלטפורמה:</p>
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(platformConfigs).map(([key, config]) => {
                const isActive = selectedPlatform === key;
                const hasWebhook = !!webhookUrls[key];
                return (
                  <button
                    key={key}
                    onClick={() => setSelectedPlatform(key)}
                    className={`relative p-3 rounded-lg border transition-all text-right ${
                      isActive
                        ? "border-primary bg-primary/10"
                        : "border-border bg-background/50 hover:border-primary/40"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-lg ${config.color}`}>{config.emoji}</span>
                      <span
                        className={`h-2 w-2 rounded-full ${
                          hasWebhook ? "bg-success" : "bg-muted-foreground/40"
                        }`}
                        title={hasWebhook ? "Webhook הוגדר" : "לא הוגדר"}
                      />
                    </div>
                    <p className={`text-sm font-medium ${isActive ? "text-primary" : "text-foreground"}`}>
                      {config.label}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {hasWebhook ? "מוכן לשליחה" : "לא הוגדר Webhook"}
                    </p>
                  </button>
                );
              })}
            </div>
            {!webhookUrls[selectedPlatform] && (
              <div className="flex items-center gap-2 text-xs text-amber-400 bg-amber-500/10 px-3 py-2 rounded">
                <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
                <span>לא הוגדר Webhook ל-{platformConfigs[selectedPlatform].label} — ה-JSON יועתק ללוח במקום להישלח.</span>
              </div>
            )}
          </div>

          {/* Editable JSON */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground font-medium">JSON Payload (ניתן לעריכה):</p>
              {jsonError && (
                <span className="text-[10px] text-destructive">⚠ JSON לא תקין</span>
              )}
            </div>
            <Textarea
              value={jsonText}
              onChange={(e) => {
                setJsonText(e.target.value);
                setJsonError(null);
              }}
              className={`font-mono text-xs min-h-[280px] max-h-[360px] bg-background/80 ${
                jsonError ? "border-destructive" : "border-border"
              }`}
              dir="ltr"
              spellCheck={false}
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={resetJson} className="gap-1.5">
              <RotateCcw className="h-3.5 w-3.5" /> איפוס
            </Button>
            <Button variant="outline" size="sm" onClick={copyJson} className="gap-1.5">
              <Copy className="h-3.5 w-3.5" /> העתק
            </Button>
            <Button variant="outline" size="sm" onClick={() => setDialogOpen(false)}>
              ביטול
            </Button>
            <Button
              size="sm"
              onClick={confirmSend}
              disabled={sending}
              className="gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Send className="h-3.5 w-3.5" />
              {sending ? "שולח..." : `שלח ל-${platformConfigs[selectedPlatform].label}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
