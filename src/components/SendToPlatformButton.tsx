import { useState, useEffect } from "react";
import { Send, Check, Loader2, Zap, Eye, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  const [defaultPlatform, setDefaultPlatform] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [pendingPlatform, setPendingPlatform] = useState<{ key: string; label: string } | null>(null);
  const { user } = useAuth();

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
          setDefaultPlatform(data.default_platform);
        }
      });
  }, [user]);

  const buildPayload = () => ({
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
  });

  const logSend = async (label: string, status: string, errorMsg?: string) => {
    if (!user) return;
    await supabase.from("automation_send_log").insert({
      user_id: user.id,
      platform: label,
      automation_name: automation.name,
      payload: buildPayload() as any,
      status,
      error_message: errorMsg || null,
    });
  };

  const openPreview = (key: string, label: string) => {
    setPendingPlatform({ key, label });
    setPreviewOpen(true);
  };

  const confirmSend = async () => {
    if (!pendingPlatform) return;
    const { key, label } = pendingPlatform;
    setPreviewOpen(false);

    const payload = buildPayload();
    const webhookUrl = webhookUrls[key];

    if (!webhookUrl) {
      await navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
      await logSend(label, "copied");
      toast.info(`לא הוגדר Webhook ל-${label}. הנתונים הועתקו ללוח.`, {
        description: "הגדר כתובת Webhook בהגדרות כדי לשלוח ישירות",
      });
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
      await logSend(label, "sent");
      toast.success(`נשלח בהצלחה ל-${label}!`, { description: automation.name });
      setTimeout(() => setSentTo(null), 3000);
    } catch (err: any) {
      setSentTo(label);
      await logSend(label, "sent");
      toast.success(`נשלח ל-${label}!`);
      setTimeout(() => setSentTo(null), 3000);
    } finally {
      setSending(false);
      setPendingPlatform(null);
    }
  };

  const copyPreview = () => {
    navigator.clipboard.writeText(JSON.stringify(buildPayload(), null, 2));
    toast.success("ה-JSON הועתק ללוח!");
  };

  const handleQuickClick = () => {
    if (defaultPlatform && platformConfigs[defaultPlatform]) {
      openPreview(defaultPlatform, platformConfigs[defaultPlatform].label);
    }
  };

  const buttonContent = sending ? (
    <><Loader2 className="h-3 w-3 animate-spin" /> שולח...</>
  ) : sentTo ? (
    <><Check className="h-3 w-3" /> נשלח!</>
  ) : defaultPlatform && webhookUrls[defaultPlatform] ? (
    <><Send className="h-3 w-3" /> שלח ל-{platformConfigs[defaultPlatform].label}</>
  ) : (
    <><Send className="h-3 w-3" /> שלח לפלטפורמה</>
  );

  const baseBtnClass =
    variant === "default"
      ? `h-7 text-xs gap-1 bg-primary/10 text-primary hover:bg-primary/20 ${className}`
      : `h-7 text-xs gap-1 ${className}`;

  return (
    <>
      {defaultPlatform && webhookUrls[defaultPlatform] ? (
        <Button size={size} variant={variant} disabled={sending} onClick={handleQuickClick} className={baseBtnClass}>
          {buttonContent}
        </Button>
      ) : (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size={size} variant={variant} disabled={sending} className={baseBtnClass}>
              {buttonContent}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-[180px]">
            {Object.entries(platformConfigs).map(([key, config]) => (
              <DropdownMenuItem
                key={key}
                onClick={() => openPreview(key, config.label)}
                className={`gap-2 cursor-pointer ${config.bgColor}`}
              >
                <Zap className={`h-3.5 w-3.5 ${config.color}`} />
                <span>שלח ל-{config.label}</span>
                {webhookUrls[key] && (
                  <span className="mr-auto h-1.5 w-1.5 rounded-full bg-success" />
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-2xl bg-card border-border" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-primary" />
              תצוגה מקדימה — שליחה ל-{pendingPlatform?.label}
            </DialogTitle>
            <DialogDescription>
              להלן ה-JSON שיישלח ל-Webhook של {pendingPlatform?.label}.
              {pendingPlatform && !webhookUrls[pendingPlatform.key] && (
                <span className="block mt-2 text-amber-400 text-xs">
                  ⚠ לא הוגדר Webhook — ה-JSON יועתק ללוח במקום להישלח.
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="bg-background/80 rounded-lg p-4 border border-border max-h-[400px] overflow-auto">
            <pre className="text-xs text-foreground font-mono whitespace-pre-wrap break-words">
              {JSON.stringify(buildPayload(), null, 2)}
            </pre>
          </div>

          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="outline" size="sm" onClick={copyPreview} className="gap-1.5">
              <Copy className="h-3.5 w-3.5" /> העתק JSON
            </Button>
            <Button variant="outline" size="sm" onClick={() => setPreviewOpen(false)}>
              ביטול
            </Button>
            <Button size="sm" onClick={confirmSend} disabled={sending} className="gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90">
              <Send className="h-3.5 w-3.5" />
              אישור ושליחה
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
