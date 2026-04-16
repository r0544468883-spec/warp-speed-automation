import { motion } from "framer-motion";
import { ArrowLeftRight, ExternalLink, ThumbsUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import SendToPlatformButton from "@/components/SendToPlatformButton";

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

export default function AutomationCard({
  toolFrom, toolTo, description, category, proofCount, sourceUrl, platform = "n8n", estimatedTimeSaved,
}: AutomationCardProps) {

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

          <SendToPlatformButton
            automation={{
              name: `${toolFrom} → ${toolTo}`,
              trigger: toolFrom,
              action: toolTo,
              description,
              category,
              source_url: sourceUrl,
            }}
          />
        </div>
      </div>
    </motion.div>
  );
}
