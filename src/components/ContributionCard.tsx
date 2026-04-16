import { motion } from "framer-motion";
import { Heart, ExternalLink, Trash2, Workflow, User as UserIcon, Briefcase, FileText, MessageSquare, Sparkles, Globe, Code2, Link as LinkIcon, Paperclip } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const TYPE_META: Record<string, { icon: any; label: string; color: string }> = {
  automation: { icon: Workflow, label: "אוטומציה", color: "text-primary" },
  expert: { icon: UserIcon, label: "מומחה", color: "text-secondary" },
  linkedin: { icon: Briefcase, label: "LinkedIn", color: "text-blue-400" },
  case_study: { icon: FileText, label: "Case Study", color: "text-amber-400" },
  forum: { icon: MessageSquare, label: "פורום", color: "text-emerald-400" },
  other: { icon: Sparkles, label: "אחר", color: "text-muted-foreground" },
};

export interface ContributorProfile {
  display_name: string | null;
  nickname: string | null;
  avatar_url: string | null;
  website_url: string | null;
  github_url: string | null;
  linkedin_url: string | null;
  linktree_url: string | null;
}

export interface Attachment {
  id: string;
  file_url: string;
  file_name: string;
  mime_type: string | null;
}

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
  profile?: ContributorProfile | null;
  attachments?: Attachment[];
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
  const profile = contribution.profile;
  const author = profile?.nickname || profile?.display_name || "משתמש";

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

        {contribution.attachments && contribution.attachments.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {contribution.attachments.slice(0, 3).map((a) => (
              <a
                key={a.id}
                href={a.file_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-[10px] bg-muted/50 hover:bg-muted px-2 py-1 rounded text-muted-foreground hover:text-foreground"
              >
                <Paperclip className="h-3 w-3" />
                <span className="truncate max-w-[120px]">{a.file_name}</span>
              </a>
            ))}
          </div>
        )}

        {/* Author */}
        <div className="flex items-center justify-between text-[11px] text-muted-foreground border-t border-border pt-2">
          <div className="flex items-center gap-1.5">
            <div className="h-5 w-5 rounded-full bg-primary/20 flex items-center justify-center">
              <UserIcon className="h-3 w-3 text-primary" />
            </div>
            <span>{author}</span>
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            {profile?.website_url && (
              <a href={profile.website_url} target="_blank" rel="noopener noreferrer" className="hover:text-primary"><Globe className="h-3 w-3" /></a>
            )}
            {profile?.github_url && (
              <a href={profile.github_url} target="_blank" rel="noopener noreferrer" className="hover:text-primary" title="GitHub"><Code2 className="h-3 w-3" /></a>
            )}
            {profile?.linkedin_url && (
              <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer" className="hover:text-primary" title="LinkedIn"><Briefcase className="h-3 w-3" /></a>
            )}
            {profile?.linktree_url && (
              <a href={profile.linktree_url} target="_blank" rel="noopener noreferrer" className="hover:text-primary"><LinkIcon className="h-3 w-3" /></a>
            )}
          </div>
        </div>

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
