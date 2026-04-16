import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Search, Sparkles, RefreshCw, Bookmark, BookmarkCheck, ExternalLink, Settings, Loader2, Wrench } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import DashboardLayout from "@/components/DashboardLayout";
import SendToPlatformButton from "@/components/SendToPlatformButton";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface Recommendation {
  id?: string; // present when from saved_articles
  title: string;
  url: string;
  source?: string;
  snippet: string;
  platform: string;
  tools_used: string[];
  trigger?: string;
  action?: string;
  category?: string;
  automation_json?: any;
}

const platformColors: Record<string, string> = {
  n8n: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  Make: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  Zapier: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  Other: "bg-muted text-muted-foreground border-border",
};

const platformIcons: Record<string, string> = {
  n8n: "⚡", Make: "🔧", Zapier: "⚡", Other: "📱",
};

export default function Wiki() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [toolStack, setToolStack] = useState<string[]>([]);
  const [profileLoading, setProfileLoading] = useState(true);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [savedArticles, setSavedArticles] = useState<Recommendation[]>([]);
  const [savedUrls, setSavedUrls] = useState<Set<string>>(new Set());
  const [feedLoading, setFeedLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("recommendations");

  // Load profile + saved articles
  useEffect(() => {
    if (!user) return;
    (async () => {
      const [{ data: profile }, { data: saved }] = await Promise.all([
        supabase.from("profiles").select("tool_stack").eq("user_id", user.id).maybeSingle(),
        supabase.from("saved_articles").select("*").eq("user_id", user.id).order("saved_at", { ascending: false }),
      ]);
      const stack = (profile?.tool_stack || []) as string[];
      setToolStack(stack);
      setProfileLoading(false);

      if (saved) {
        const mapped: Recommendation[] = saved.map((s: any) => ({
          id: s.id,
          title: s.title,
          url: s.url,
          source: s.source,
          snippet: s.snippet || "",
          platform: s.platform || "Other",
          tools_used: s.tools_matched || [],
          automation_json: s.automation_json,
        }));
        setSavedArticles(mapped);
        setSavedUrls(new Set(mapped.map((m) => m.url)));
      }
    })();
  }, [user]);

  const fetchRecommendations = useCallback(async () => {
    if (toolStack.length === 0) return;
    setFeedLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("discover-automations", {
        body: { tool_stack: toolStack },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setRecommendations(data?.recommendations || []);
      if ((data?.recommendations || []).length === 0) {
        toast.info("לא נמצאו המלצות חדשות. נסה לרענן בעוד רגע.");
      }
    } catch (e: any) {
      console.error(e);
      const msg = e?.message || "שגיאה בטעינת המלצות";
      if (msg.includes("429")) toast.error("חרגת ממגבלת הבקשות, נסה שוב בעוד דקה");
      else if (msg.includes("402")) toast.error("נדרש תשלום — הוסף קרדיטים ל-Lovable AI");
      else toast.error(msg);
    } finally {
      setFeedLoading(false);
    }
  }, [toolStack]);

  // Auto-fetch once when tool stack arrives
  useEffect(() => {
    if (toolStack.length > 0 && recommendations.length === 0 && !feedLoading) {
      fetchRecommendations();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toolStack]);

  const toggleSave = async (rec: Recommendation) => {
    if (!user) return;
    const isSaved = savedUrls.has(rec.url);

    if (isSaved) {
      // Find saved row
      const savedRow = savedArticles.find((s) => s.url === rec.url);
      if (savedRow?.id) {
        const { error } = await supabase.from("saved_articles").delete().eq("id", savedRow.id);
        if (error) {
          toast.error("שגיאה במחיקה");
          return;
        }
      }
      setSavedArticles((prev) => prev.filter((s) => s.url !== rec.url));
      setSavedUrls((prev) => {
        const next = new Set(prev);
        next.delete(rec.url);
        return next;
      });
      toast.success("המאמר הוסר מהשמורים");
    } else {
      const { data, error } = await supabase
        .from("saved_articles")
        .insert({
          user_id: user.id,
          title: rec.title,
          url: rec.url,
          snippet: rec.snippet,
          source: rec.source,
          platform: rec.platform,
          tools_matched: rec.tools_used,
          automation_json: rec.automation_json,
        })
        .select()
        .single();
      if (error || !data) {
        toast.error("שגיאה בשמירה");
        return;
      }
      const newSaved: Recommendation = { ...rec, id: data.id };
      setSavedArticles((prev) => [newSaved, ...prev]);
      setSavedUrls((prev) => new Set(prev).add(rec.url));
      toast.success("נשמר! ניתן למצוא בטאב 'שמורים'");
    }
  };

  const filterBySearch = (list: Recommendation[]) => {
    if (!search.trim()) return list;
    const s = search.toLowerCase();
    return list.filter(
      (r) =>
        r.title.toLowerCase().includes(s) ||
        r.snippet?.toLowerCase().includes(s) ||
        r.tools_used?.some((t) => t.toLowerCase().includes(s)) ||
        r.platform.toLowerCase().includes(s)
    );
  };

  const filteredRecs = filterBySearch(recommendations);
  const filteredSaved = filterBySearch(savedArticles);

  // Empty stack state
  if (!profileLoading && toolStack.length === 0) {
    return (
      <DashboardLayout>
        <div className="max-w-2xl mx-auto py-12 text-center space-y-6">
          <div className="inline-flex p-4 rounded-full bg-primary/10">
            <Wrench className="h-10 w-10 text-primary" />
          </div>
          <h1 className="text-2xl md:text-3xl font-heading font-bold text-gradient">
            פיד אוטומציות מותאם אישית
          </h1>
          <p className="text-muted-foreground">
            כדי שנוכל למצוא לך המלצות אוטומציה רלוונטיות מהרשת, צריך לדעת אילו כלים אתה משתמש בהם (WhatsApp, Monday, Gmail וכו').
          </p>
          <Button onClick={() => navigate("/settings")} className="gap-2">
            <Settings className="h-4 w-4" />
            עדכן את הכלים שלי בהגדרות
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const renderCard = (rec: Recommendation, i: number) => {
    const isSaved = savedUrls.has(rec.url);
    const colorClass = platformColors[rec.platform] || platformColors.Other;
    const icon = platformIcons[rec.platform] || platformIcons.Other;

    return (
      <motion.div
        key={`${rec.url}-${i}`}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: Math.min(i * 0.03, 0.3) }}
      >
        <Card className="bg-card/50 backdrop-blur-sm border-border p-5 h-full flex flex-col hover:border-primary/30 transition-all">
          <div className="flex items-start justify-between mb-2 gap-2">
            <Badge variant="outline" className={`text-[10px] border ${colorClass}`}>
              {icon} {rec.platform}
            </Badge>
            <button
              onClick={() => toggleSave(rec)}
              className="text-muted-foreground hover:text-primary transition-colors"
              title={isSaved ? "הסר משמורים" : "שמור"}
            >
              {isSaved ? (
                <BookmarkCheck className="h-4 w-4 fill-primary text-primary" />
              ) : (
                <Bookmark className="h-4 w-4" />
              )}
            </button>
          </div>

          <h3 className="text-sm font-semibold mb-2 line-clamp-2">{rec.title}</h3>
          <p className="text-xs text-muted-foreground leading-relaxed mb-3 line-clamp-3 flex-1">
            {rec.snippet}
          </p>

          {rec.tools_used && rec.tools_used.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {rec.tools_used.slice(0, 4).map((tool) => (
                <span
                  key={tool}
                  className="text-[10px] px-1.5 py-0.5 bg-primary/10 text-primary rounded"
                >
                  {tool}
                </span>
              ))}
            </div>
          )}

          {(rec.trigger || rec.action) && (
            <div className="text-[10px] text-muted-foreground mb-3 flex items-center gap-1.5">
              {rec.trigger && <span className="bg-background/60 px-1.5 py-0.5 rounded">{rec.trigger}</span>}
              {rec.trigger && rec.action && <span>→</span>}
              {rec.action && <span className="bg-background/60 px-1.5 py-0.5 rounded">{rec.action}</span>}
            </div>
          )}

          <div className="flex gap-2 pt-2 border-t border-border mt-auto flex-wrap">
            <Button
              size="sm"
              variant="outline"
              className="text-xs gap-1.5 h-7"
              onClick={() => window.open(rec.url, "_blank")}
            >
              <ExternalLink className="h-3 w-3" /> צפה במקור
            </Button>
            <SendToPlatformButton
              automation={{
                name: rec.title,
                trigger: rec.trigger,
                action: rec.action,
                description: rec.snippet,
                category: rec.category,
                automation_json: rec.automation_json || {
                  trigger: rec.trigger,
                  action: rec.action,
                  tools: rec.tools_used,
                },
                source_url: rec.url,
              }}
            />
          </div>
        </Card>
      </motion.div>
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-heading font-bold text-gradient mb-1 flex items-center gap-3">
              <Sparkles className="h-7 w-7 text-primary" /> פיד אוטומציות מותאם אישית
            </h1>
            <p className="text-muted-foreground text-sm">
              המלצות חיות מהרשת על בסיס הכלים שלך
            </p>
          </div>
          <Button
            onClick={fetchRecommendations}
            disabled={feedLoading || toolStack.length === 0}
            variant="outline"
            className="gap-2"
          >
            {feedLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            רענן המלצות
          </Button>
        </div>

        {/* Tool stack chip */}
        {toolStack.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap text-sm">
            <span className="text-muted-foreground text-xs">הכלים שלך:</span>
            {toolStack.map((t) => (
              <Badge key={t} variant="outline" className="bg-primary/5 text-primary border-primary/30">
                {t}
              </Badge>
            ))}
            <Button variant="ghost" size="sm" className="h-6 px-2 text-xs gap-1" onClick={() => navigate("/settings")}>
              <Settings className="h-3 w-3" /> ערוך
            </Button>
          </div>
        )}

        {/* Search */}
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="חפש בהמלצות..."
            className="pr-10 bg-card/50 border-border"
          />
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-card/50 border border-border">
            <TabsTrigger value="recommendations" className="gap-2">
              <Sparkles className="h-3.5 w-3.5" />
              המלצות לי ({recommendations.length})
            </TabsTrigger>
            <TabsTrigger value="saved" className="gap-2">
              <BookmarkCheck className="h-3.5 w-3.5" />
              שמורים ({savedArticles.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="recommendations" className="mt-6">
            {feedLoading ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-card/50 border border-border rounded-xl p-5 animate-pulse h-48">
                    <div className="h-3 bg-muted rounded w-1/4 mb-3" />
                    <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                    <div className="h-3 bg-muted rounded w-full mb-1" />
                    <div className="h-3 bg-muted rounded w-2/3" />
                  </div>
                ))}
              </div>
            ) : filteredRecs.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-30" />
                <p className="text-lg font-medium">אין המלצות כרגע</p>
                <p className="text-sm mt-1">לחץ על "רענן המלצות" כדי לקבל הצעות חדשות</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredRecs.map(renderCard)}
              </div>
            )}
          </TabsContent>

          <TabsContent value="saved" className="mt-6">
            {filteredSaved.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <Bookmark className="h-12 w-12 mx-auto mb-4 opacity-30" />
                <p className="text-lg font-medium">אין מאמרים שמורים</p>
                <p className="text-sm mt-1">לחץ על אייקון הסימנייה בכרטיס כדי לשמור לאחר כך</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredSaved.map(renderCard)}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
