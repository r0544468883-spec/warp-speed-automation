import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, BookOpen, ThumbsUp } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import DashboardLayout from "@/components/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";

const categories = ["הכל", "CRM", "ניהול פרויקטים", "AI", "פיננסי", "מכירות", "שיווק", "תפעול"];

interface WikiEntry {
  id: string;
  tool_name: string;
  use_case: string;
  category: string | null;
  source_type: string | null;
  proof_count: number;
  tags: string[] | null;
}

export default function Wiki() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("הכל");
  const [entries, setEntries] = useState<WikiEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEntries = async () => {
      const { data, error } = await supabase
        .from("automation_wiki")
        .select("id, tool_name, use_case, category, source_type, proof_count, tags")
        .order("proof_count", { ascending: false });
      if (!error && data) setEntries(data);
      setLoading(false);
    };
    fetchEntries();
  }, []);

  const filtered = entries.filter((e) => {
    const matchSearch = !search || e.use_case.includes(search) || e.tool_name.toLowerCase().includes(search.toLowerCase()) || e.tags?.some(t => t.includes(search.toLowerCase()));
    const matchCat = activeCategory === "הכל" || e.category === activeCategory;
    return matchSearch && matchCat;
  });

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-heading font-bold text-gradient mb-1 flex items-center gap-3">
          <BookOpen className="h-8 w-8 text-primary" /> ויקיפדיה של האוטומציה
        </h1>
        <p className="text-muted-foreground text-sm">מאגר הידע הגדול ביותר של אוטומציות — מגובה בתימוכין מקהילות עולמיות</p>
      </div>

      <div className="relative mb-6">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="חפש כלי, שימוש, או תג..."
          className="pr-10 bg-card/50 border-border"
        />
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {categories.map((cat) => (
          <Button
            key={cat}
            variant={activeCategory === cat ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveCategory(cat)}
            className={activeCategory === cat
              ? "bg-primary text-primary-foreground"
              : "border-border text-muted-foreground hover:text-foreground"
            }
          >
            {cat}
          </Button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-20 text-muted-foreground">
          <p>טוען נתונים...</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {filtered.map((entry, i) => (
            <motion.div key={entry.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Card className="bg-card/50 backdrop-blur-sm border-border p-5 hover:border-primary/30 transition-all">
                <div className="flex items-start justify-between mb-2">
                  <Badge variant="outline" className="text-[10px]">{entry.tool_name}</Badge>
                  <Badge className="bg-muted text-muted-foreground text-[10px]">{entry.category}</Badge>
                </div>
                <p className="text-sm font-medium mb-3">{entry.use_case}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>מקור: {entry.source_type}</span>
                    <div className="flex items-center gap-1">
                      <ThumbsUp className="h-3 w-3" />
                      <span>{entry.proof_count}</span>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {entry.tags?.slice(0, 2).map((tag) => (
                      <span key={tag} className="text-[10px] px-1.5 py-0.5 bg-primary/10 text-primary rounded">#{tag}</span>
                    ))}
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="text-center py-20 text-muted-foreground">
          <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-30" />
          <p>לא נמצאו תוצאות</p>
        </div>
      )}
    </DashboardLayout>
  );
}
