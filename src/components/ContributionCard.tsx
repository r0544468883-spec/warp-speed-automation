import { motion } from "framer-motion";
import { Heart, ExternalLink, Trash2, Workflow, User, Briefcase, FileText, MessageSquare, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const TYPE_META: Record<string, { icon: any; label: string; color: string }> = {
  automation: { icon: Workflow, label: "אוטומציה", color: "text-primary" },
  expert: { icon: User, label: "מומחה", color: "text-secondary" },
  linkedin: { icon: Briefcase, label: "LinkedIn", color: "text-blue-400" },
  case_study: { icon: FileText, label: "Case Study", color: "text-amber-400" },
  forum: { icon: MessageSquare, label: "פורום", color: "text-emerald-400" },
  other: { icon: Sparkles, label: "אחר", color: "text-muted-foreground" },
};

export interface Contribution {
  id: string;
  user_id: string;
  type: string;
  title: string;
  description: string | null;
  url: string | null;
  tags: string[] | null;
  tools_related: string[] | null;
  upvotes: number;
  created_at: string;
}

interface Props {
  contribution: Contribution;
  isOwner: boolean;
  hasVoted: boolean;
  onVote: () => void;
  onDelete: () => void;
}

export default function ContributionCard({ contribution, isOwner, hasVoted, onVote, onDelete }: Props) {
  const meta = TYPE_META[contribution.type] || TYPE_META.other;
  const Icon = meta.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="p-4 h-full flex flex-col gap-3 bg-card/50 backdrop-blur-sm border-border hover:border-primary/40 transition-colors">
        <div className="flex items-start justify-between gap-2">
          <div className={`p-2 rounded-lg bg-muted/50 ${meta.color}`}>
            <Icon className="h-5 w-5" />
          </div>
          <Badge variant="outline" className="text-[10px]">{meta.label}</Badge>
        </div>

        <div className="flex-1">
          <h3 className="font-heading font-semibold text-base leading-tight mb-1">{contribution.title}</h3>
          {contribution.description && (
            <p className="text-sm text-muted-foreground line-clamp-3">{contribution.description}</p>
          )}
        </div>

        {(contribution.tags?.length || contribution.tools_related?.length) ? (
          <div className="flex flex-wrap gap-1">
            {contribution.tools_related?.slice(0, 3).map((t) => (
              <Badge key={t} variant="secondary" className="text-[10px]">#{t}</Badge>
            ))}
            {contribution.tags?.slice(0, 2).map((t) => (
              <Badge key={t} variant="outline" className="text-[10px]">{t}</Badge>
            ))}
          </div>
        ) : null}

        <div className="flex items-center justify-between pt-2 border-t border-border">
          <Button
            variant="ghost"
            size="sm"
            onClick={onVote}
            className={`gap-1 ${hasVoted ? "text-primary" : "text-muted-foreground"}`}
          >
            <Heart className={`h-4 w-4 ${hasVoted ? "fill-current" : ""}`} />
            <span className="text-xs">{contribution.upvotes}</span>
          </Button>
          <div className="flex gap-1">
            {contribution.url && (
              <Button variant="ghost" size="icon" asChild className="h-8 w-8">
                <a href={contribution.url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            )}
            {isOwner && (
              <Button variant="ghost" size="icon" onClick={onDelete} className="h-8 w-8 text-destructive">
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
