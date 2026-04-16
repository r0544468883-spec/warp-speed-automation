import { useState } from "react";
import { motion } from "framer-motion";
import { Search, Filter, BookOpen, ExternalLink, ThumbsUp } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import DashboardLayout from "@/components/DashboardLayout";

const categories = ["הכל", "CRM", "ניהול פרויקטים", "AI", "פיננסי", "מכירות", "שיווק", "תפעול"];

const mockWikiEntries = [
  { tool: "n8n", useCase: "סנכרון אנשי קשר בין HubSpot ל-Monday", category: "CRM", source: "Reddit", proofCount: 89, tags: ["hubspot", "monday", "crm"] },
  { tool: "Make", useCase: "יצירת חשבוניות אוטומטית בפריוריטי מ-Fireberry", category: "פיננסי", source: "פורום n8n", proofCount: 34, tags: ["priority", "fireberry", "invoicing"] },
  { tool: "Zapier", useCase: "שליחת תזכורות Slack כשמשימה ב-ClickUp מתקרבת לדדליין", category: "ניהול פרויקטים", source: "X", proofCount: 56, tags: ["slack", "clickup", "notifications"] },
  { tool: "n8n", useCase: "Agent AI שמנתח מיילים ויוצר משימות ב-Jira", category: "AI", source: "Reddit", proofCount: 127, tags: ["gmail", "jira", "ai-agent"] },
  { tool: "Make", useCase: "סנכרון מלאי בין Airtable ל-Salesforce", category: "מכירות", source: "Zapier Community", proofCount: 45, tags: ["airtable", "salesforce", "inventory"] },
  { tool: "n8n", useCase: "חיבור Claude לכוורת לניתוח נתוני לקוחות", category: "AI", source: "פורום n8n", proofCount: 18, tags: ["claude", "kaveret", "analytics"] },
  { tool: "Zapier", useCase: "אוטומציה של דוחות שבועיים מ-Google Analytics ל-Slack", category: "שיווק", source: "Reddit", proofCount: 73, tags: ["analytics", "slack", "reports"] },
  { tool: "n8n", useCase: "שימוש ב-Perplexity למחקר לידים אוטומטי", category: "מכירות", source: "X", proofCount: 29, tags: ["perplexity", "leads", "research"] },
];

export default function Wiki() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("הכל");

  const filtered = mockWikiEntries.filter((e) => {
    const matchSearch = !search || e.useCase.includes(search) || e.tool.toLowerCase().includes(search.toLowerCase()) || e.tags.some(t => t.includes(search.toLowerCase()));
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

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="חפש כלי, שימוש, או תג..."
          className="pr-10 bg-card/50 border-border"
        />
      </div>

      {/* Categories */}
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

      {/* Results */}
      <div className="grid md:grid-cols-2 gap-4">
        {filtered.map((entry, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card className="bg-card/50 backdrop-blur-sm border-border p-5 hover:border-primary/30 transition-all">
              <div className="flex items-start justify-between mb-2">
                <Badge variant="outline" className="text-[10px]">{entry.tool}</Badge>
                <Badge className="bg-muted text-muted-foreground text-[10px]">{entry.category}</Badge>
              </div>
              <p className="text-sm font-medium mb-3">{entry.useCase}</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span>מקור: {entry.source}</span>
                  <div className="flex items-center gap-1">
                    <ThumbsUp className="h-3 w-3" />
                    <span>{entry.proofCount}</span>
                  </div>
                </div>
                <div className="flex gap-1">
                  {entry.tags.slice(0, 2).map((tag) => (
                    <span key={tag} className="text-[10px] px-1.5 py-0.5 bg-primary/10 text-primary rounded">#{tag}</span>
                  ))}
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-20 text-muted-foreground">
          <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-30" />
          <p>לא נמצאו תוצאות</p>
        </div>
      )}
    </DashboardLayout>
  );
}
