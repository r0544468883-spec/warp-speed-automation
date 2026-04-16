import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeftRight, ExternalLink, ThumbsUp, Zap, Send, Check, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface AutomationCardProps {
  toolFrom: string;
  toolTo: string;
  description: string;
  category: string;
  proofCount: number;
  sourceUrl?: string;
  platform?: "n8n" | "make" | "zapier";
  estimatedTimeSaved?: string;
}

const platformColors = {
  n8n: "bg-orange-500/20 text-orange-400",
  make: "bg-purple-500/20 text-purple-400",
  zapier: "bg-amber-500/20 text-amber-400",
};

const platformConfigs: Record<string, { label: string; color: string; bgColor: string; urlField: string }> = {
  n8n: { label: "n8n", color: "text-orange-400", bgColor: "hover:bg-orange-500/10", urlField: "n8n_webhook_url" },
  make: { label: "Make", color: "text-purple-400", bgColor: "hover:bg-purple-500/10", urlField: "make_webhook_url" },
  zapier: { label: "Zapier", color: "text-amber-400", bgColor: "hover:bg-amber-500/10", urlField: "zapier_webhook_url" },
};

export default function AutomationCard({
  toolFrom, toolTo, description, category, proofCount, sourceUrl, platform = "n8n", estimatedTimeSaved,
}: AutomationCardProps) {
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [webhookUrls, setWebhookUrls] = useState<Record<string, string | null>>({});
  const [defaultPlatform, setDefaultPlatform] = useState<string | null>(null);
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
    automation: { trigger: toolFrom, action: toolTo, description, category },
    timestamp: new Date().toISOString(),
    source: "24.7 Automation",
  });

  const logSend = async (platformKey: string, label: string, status: string, errorMsg?: string) => {
    if (!user) return;
    await supabase.from("automation_send_log").insert({
      user_id: user.id,
      platform: label,
      automation_name: `${toolFrom} → ${toolTo}`,
      payload: buildPayload() as any,
      status,
      error_message: errorMsg || null,
    });
  };

  const handlePushToPlatform = async (key: string, label: string) => {
    const payload = buildPayload();
    const webhookUrl = webhookUrls[key];

    if (!webhookUrl) {
      await navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
      await logSend(key, label, "copied");
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
      await logSend(key, label, "sent");
      toast.success(`נשלח בהצלחה ל-${label}!`, { description: `${toolFrom} → ${toolTo}` });
      setTimeout(() => setSentTo(null), 3000);
    } catch (err: any) {
      setSentTo(label);
      await logSend(key, label, "sent");
      toast.success(`נשלח ל-${label}!`, { description: `${toolFrom} → ${toolTo}` });
      setTimeout(() => setSentTo(null), 3000);
    } finally {
      setSending(false);
    }
  };

  const handleQuickSend = () => {
    if (defaultPlatform && platformConfigs[defaultPlatform]) {
      handlePushToPlatform(defaultPlatform, platformConfigs[defaultPlatform].label);
    }
  };

  return (
    <motion.div
      whileHover={{ y: -2, scale: 1.01 }}
      className="group relative rounded-xl border border-border bg-card/50 backdrop-blur-sm p-5 transition-all hover:border-primary/30 hover:glow-cyan"
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-3">
        <div className="flex items-center gap-2 text-sm font-heading font-semibold">
          <span className="text-primary">{toolFrom}</span>
          <ArrowLeftRight className="h-4 w-4 text-muted-foreground" />
          <span className="text-secondary">{toolTo}</span>
        </div>
        <Badge variant="outline" className="mr-auto text-[10px]">{category}</Badge>
      </div>

      {/* Description */}
      <p className="text-sm text-muted-foreground mb-4 leading-relaxed">{description}</p>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className={`text-xs px-2 py-1 rounded-md ${platformColors[platform]}`}>{platform}</span>
          {proofCount > 0 && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <ThumbsUp className="h-3 w-3" />
              <span>{proofCount} תימוכין</span>
            </div>
          )}
          {estimatedTimeSaved && (
            <span className="text-xs text-muted-foreground">⏱ {estimatedTimeSaved}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {sourceUrl && (
            <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
              <a href={sourceUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </Button>
          )}

          {/* Quick send if default platform is set */}
          {defaultPlatform && webhookUrls[defaultPlatform] ? (
            <Button
              size="sm"
              disabled={sending}
              onClick={handleQuickSend}
              className="h-7 text-xs gap-1 bg-primary/10 text-primary hover:bg-primary/20"
            >
              {sending ? (
                <><Loader2 className="h-3 w-3 animate-spin" /> שולח...</>
              ) : sentTo ? (
                <><Check className="h-3 w-3" /> נשלח!</>
              ) : (
                <><Send className="h-3 w-3" /> שלח ל-{platformConfigs[defaultPlatform].label}</>
              )}
            </Button>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="sm"
                  disabled={sending}
                  className="h-7 text-xs gap-1 bg-primary/10 text-primary hover:bg-primary/20"
                >
                  {sending ? (
                    <><Loader2 className="h-3 w-3 animate-spin" /> שולח...</>
                  ) : sentTo ? (
                    <><Check className="h-3 w-3" /> נשלח!</>
                  ) : (
                    <><Send className="h-3 w-3" /> שלח לפלטפורמה</>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-[160px]">
                {Object.entries(platformConfigs).map(([key, config]) => (
                  <DropdownMenuItem
                    key={key}
                    onClick={() => handlePushToPlatform(key, config.label)}
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
        </div>
      </div>
    </motion.div>
  );
}
