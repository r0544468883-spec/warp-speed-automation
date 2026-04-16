import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeftRight, ExternalLink, ThumbsUp, Zap, Send, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

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

const platformConfigs = {
  n8n: { label: "n8n", color: "text-orange-400", bgColor: "hover:bg-orange-500/10" },
  make: { label: "Make", color: "text-purple-400", bgColor: "hover:bg-purple-500/10" },
  zapier: { label: "Zapier", color: "text-amber-400", bgColor: "hover:bg-amber-500/10" },
};

function buildPayload(toolFrom: string, toolTo: string, description: string, category: string) {
  return {
    automation: { trigger: toolFrom, action: toolTo, description, category },
    timestamp: new Date().toISOString(),
    source: "24.7 Automation",
  };
}

export default function AutomationCard({
  toolFrom, toolTo, description, category, proofCount, sourceUrl, platform = "n8n", estimatedTimeSaved,
}: AutomationCardProps) {
  const [sentTo, setSentTo] = useState<string | null>(null);

  const handlePushToPlatform = (targetPlatform: string) => {
    const payload = buildPayload(toolFrom, toolTo, description, category);
    
    // Copy payload to clipboard for webhook use
    navigator.clipboard.writeText(JSON.stringify(payload, null, 2)).then(() => {
      setSentTo(targetPlatform);
      toast.success(`הנתונים הועתקו! הדבק ב-${targetPlatform} Webhook`, {
        description: `${toolFrom} → ${toolTo}`,
        action: {
          label: "פתח " + targetPlatform,
          onClick: () => {
            const urls: Record<string, string> = {
              n8n: "https://n8n.io",
              Make: "https://make.com",
              Zapier: "https://zapier.com",
            };
            window.open(urls[targetPlatform], "_blank");
          },
        },
      });
      setTimeout(() => setSentTo(null), 3000);
    });
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
          
          {/* Push to Platform dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                size="sm" 
                className="h-7 text-xs gap-1 bg-primary/10 text-primary hover:bg-primary/20"
              >
                {sentTo ? (
                  <>
                    <Check className="h-3 w-3" /> נשלח!
                  </>
                ) : (
                  <>
                    <Send className="h-3 w-3" /> שלח לפלטפורמה
                  </>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[160px]">
              {Object.entries(platformConfigs).map(([key, config]) => (
                <DropdownMenuItem
                  key={key}
                  onClick={() => handlePushToPlatform(config.label)}
                  className={`gap-2 cursor-pointer ${config.bgColor}`}
                >
                  <Zap className={`h-3.5 w-3.5 ${config.color}`} />
                  <span>שלח ל-{config.label}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </motion.div>
  );
}
