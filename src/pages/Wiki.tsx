import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, BookOpen, ThumbsUp, ExternalLink, Copy, ChevronDown, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import DashboardLayout from "@/components/DashboardLayout";
import SendToPlatformButton from "@/components/SendToPlatformButton";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const platformFilters = ["הכל", "n8n", "Make", "Zapier"];

const platformColors: Record<string, string> = {
  n8n: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  Make: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  Zapier: "bg-amber-500/20 text-amber-400 border-amber-500/30",
};

const platformIcons: Record<string, string> = {
  n8n: "⚡", Make: "🔧", Zapier: "⚡",
};

interface WikiEntry {
  id: string;
  tool_name: string;
  use_case: string;
  description: string | null;
  category: string | null;
  source_type: string | null;
  source_url: string | null;
  proof_count: number;
  tags: string[] | null;
  automation_json: any;
}

export default function Wiki() {
  const [search, setSearch] = useState("");
  const [activePlatform, setActivePlatform] = useState("הכל");
  const [activeCategory, setActiveCategory] = useState("הכל");
  const [entries, setEntries] = useState<WikiEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [categories, setCategories] = useState<string[]>(["הכל"]);

  useEffect(() => {
    const fetchEntries = async () => {
      const { data, error } = await supabase
        .from("automation_wiki")
        .select("id, tool_name, use_case, description, category, source_type, source_url, proof_count, tags, automation_json")
        .order("proof_count", { ascending: false });
      if (!error && data) {
        setEntries(data);
        // Extract unique categories
        const cats = [...new Set(data.map(e => e.category).filter(Boolean))] as string[];
        setCategories(["הכל", ...cats.sort()]);
      }
      setLoading(false);
    };
    fetchEntries();
  }, []);

  const filtered = entries.filter((e) => {
    const s = search.toLowerCase();
    const matchSearch = !search ||
      e.use_case.toLowerCase().includes(s) ||
      e.tool_name.toLowerCase().includes(s) ||
      e.description?.toLowerCase().includes(s) ||
      e.tags?.some(t => t.toLowerCase().includes(s));
    const matchPlatform = activePlatform === "הכל" || e.tool_name === activePlatform;
    const matchCat = activeCategory === "הכל" || e.category === activeCategory;
    return matchSearch && matchPlatform && matchCat;
  });

  const copyJson = (entry: WikiEntry) => {
    const payload = JSON.stringify({
      platform: entry.tool_name,
      use_case: entry.use_case,
      description: entry.description,
      automation: entry.automation_json,
      source: entry.source_url,
    }, null, 2);
    navigator.clipboard.writeText(payload);
    toast.success("הועתק ללוח!");
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl md:text-3xl font-heading font-bold text-gradient mb-1 flex items-center gap-3">
            <BookOpen className="h-8 w-8 text-primary" /> ויקיפדיה של האוטומציה
          </h1>
          <p className="text-muted-foreground text-sm">
            {entries.length} אוטומציות מגובות בתימוכין מקהילות עולמיות — n8n, Make, Zapier ופלטפורמות ישראליות
          </p>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="חפש כלי, שימוש, תג או תיאור..."
            className="pr-10 bg-card/50 border-border"
          />
        </div>

        {/* Platform Filters */}
        <div className="flex gap-2 items-center">
          <Filter className="h-4 w-4 text-muted-foreground" />
          {platformFilters.map((p) => (
            <Button
              key={p}
              variant={activePlatform === p ? "default" : "outline"}
              size="sm"
              onClick={() => setActivePlatform(p)}
              className={activePlatform === p
                ? "bg-primary text-primary-foreground"
                : "border-border text-muted-foreground hover:text-foreground"
              }
            >
              {p !== "הכל" && <span className="ml-1">{platformIcons[p]}</span>}
              {p}
            </Button>
          ))}
        </div>

        {/* Category Chips */}
        <div className="flex gap-2 flex-wrap">
          {categories.map((cat) => (
            <Badge
              key={cat}
              variant={activeCategory === cat ? "default" : "outline"}
              className={`cursor-pointer transition-all ${
                activeCategory === cat
                  ? "bg-primary/20 text-primary border-primary/40"
                  : "hover:border-primary/30"
              }`}
              onClick={() => setActiveCategory(cat)}
            >
              {cat}
            </Badge>
          ))}
        </div>

        {/* Results count */}
        <p className="text-xs text-muted-foreground">
          מציג {filtered.length} מתוך {entries.length} אוטומציות
        </p>

        {/* Cards Grid */}
        {loading ? (
          <div className="grid md:grid-cols-2 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-card/50 border border-border rounded-xl p-5 animate-pulse">
                <div className="h-4 bg-muted rounded w-1/4 mb-3" />
                <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                <div className="h-3 bg-muted rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {filtered.map((entry, i) => {
              const isExpanded = expandedId === entry.id;
              const colorClass = platformColors[entry.tool_name] || "bg-muted text-muted-foreground";

              return (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.03, 0.3) }}
                >
                  <Card
                    className={`bg-card/50 backdrop-blur-sm border-border p-5 cursor-pointer transition-all hover:border-primary/30 ${
                      isExpanded ? "border-primary/40 ring-1 ring-primary/20" : ""
                    }`}
                    onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                  >
                    {/* Top row */}
                    <div className="flex items-start justify-between mb-2">
                      <Badge variant="outline" className={`text-[10px] border ${colorClass}`}>
                        {platformIcons[entry.tool_name] || "📱"} {entry.tool_name}
                      </Badge>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-muted text-muted-foreground text-[10px]">{entry.category}</Badge>
                        <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                      </div>
                    </div>

                    {/* Title */}
                    <p className="text-sm font-medium mb-2">{entry.use_case}</p>

                    {/* Meta row */}
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>מקור: {entry.source_type}</span>
                        <div className="flex items-center gap-1">
                          <ThumbsUp className="h-3 w-3" />
                          <span>{entry.proof_count}</span>
                        </div>
                      </div>
                      <div className="flex gap-1 flex-wrap justify-end">
                        {entry.tags?.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="text-[10px] px-1.5 py-0.5 bg-primary/10 text-primary rounded cursor-pointer hover:bg-primary/20 transition-colors"
                            onClick={(e) => { e.stopPropagation(); setSearch(tag); }}
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Expanded Content */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="pt-3 mt-3 border-t border-border space-y-3">
                            {/* Description */}
                            {entry.description && (
                              <p className="text-xs text-muted-foreground leading-relaxed">
                                {entry.description}
                              </p>
                            )}

                            {/* Automation JSON */}
                            {entry.automation_json && (
                              <div className="bg-background/50 rounded-lg p-3 border border-border">
                                <p className="text-[10px] text-muted-foreground mb-1.5 font-medium">מבנה האוטומציה:</p>
                                <div className="flex flex-wrap gap-2 text-xs">
                                  {Object.entries(entry.automation_json as Record<string, any>).map(([key, val]) => (
                                    <span key={key} className="bg-primary/10 text-primary px-2 py-1 rounded">
                                      {key}: {String(val)}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* All tags */}
                            {entry.tags && entry.tags.length > 3 && (
                              <div className="flex gap-1 flex-wrap">
                                {entry.tags.map((tag) => (
                                  <span
                                    key={tag}
                                    className="text-[10px] px-1.5 py-0.5 bg-primary/10 text-primary rounded cursor-pointer hover:bg-primary/20"
                                    onClick={(e) => { e.stopPropagation(); setSearch(tag); }}
                                  >
                                    #{tag}
                                  </span>
                                ))}
                              </div>
                            )}

                            {/* Actions */}
                            <div className="flex gap-2 pt-1 flex-wrap" onClick={(e) => e.stopPropagation()}>
                              <SendToPlatformButton
                                automation={{
                                  name: `${entry.tool_name}: ${entry.use_case}`,
                                  description: entry.description,
                                  category: entry.category,
                                  automation_json: entry.automation_json,
                                  source_url: entry.source_url,
                                }}
                              />
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-xs gap-1.5 border-primary/30 text-primary hover:bg-primary/10 h-7"
                                onClick={(e) => { e.stopPropagation(); copyJson(entry); }}
                              >
                                <Copy className="h-3 w-3" /> העתק JSON
                              </Button>
                              {entry.source_url && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-xs gap-1.5 h-7"
                                  onClick={(e) => { e.stopPropagation(); window.open(entry.source_url!, '_blank'); }}
                                >
                                  <ExternalLink className="h-3 w-3" /> צפה במקור
                                </Button>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="text-center py-20 text-muted-foreground">
            <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p className="text-lg font-medium">לא נמצאו תוצאות</p>
            <p className="text-sm mt-1">נסה לחפש מילה אחרת או לשנות את הפילטרים</p>
            <Button variant="outline" size="sm" className="mt-4" onClick={() => { setSearch(""); setActivePlatform("הכל"); setActiveCategory("הכל"); }}>
              נקה פילטרים
            </Button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
