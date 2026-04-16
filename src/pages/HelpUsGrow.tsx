import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import DashboardLayout from "@/components/DashboardLayout";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Sprout, Search, Loader2 } from "lucide-react";
import AddContributionDialog from "@/components/AddContributionDialog";
import ContributionCard, { Contribution } from "@/components/ContributionCard";

const TABS = [
  { value: "all", label: "הכל" },
  { value: "automation", label: "אוטומציות" },
  { value: "expert", label: "מומחים" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "case_study", label: "Case Studies" },
  { value: "forum", label: "פורומים" },
];

export default function HelpUsGrow() {
  const { user } = useAuth();
  const [items, setItems] = useState<Contribution[]>([]);
  const [votedIds, setVotedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("all");
  const [search, setSearch] = useState("");

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("community_contributions")
      .select("*")
      .order("upvotes", { ascending: false })
      .order("created_at", { ascending: false });
    setItems((data || []) as Contribution[]);
    if (user) {
      const { data: votes } = await supabase
        .from("contribution_votes")
        .select("contribution_id")
        .eq("user_id", user.id);
      setVotedIds(new Set((votes || []).map((v) => v.contribution_id)));
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, [user?.id]);

  const filtered = useMemo(() => {
    return items.filter((i) => {
      if (tab !== "all" && i.type !== tab) return false;
      if (search) {
        const s = search.toLowerCase();
        return (
          i.title.toLowerCase().includes(s) ||
          (i.description || "").toLowerCase().includes(s) ||
          (i.tags || []).some((t) => t.toLowerCase().includes(s))
        );
      }
      return true;
    });
  }, [items, tab, search]);

  const toggleVote = async (id: string) => {
    if (!user) return;
    const has = votedIds.has(id);
    // optimistic
    setVotedIds((prev) => {
      const next = new Set(prev);
      has ? next.delete(id) : next.add(id);
      return next;
    });
    setItems((prev) => prev.map((i) => i.id === id ? { ...i, upvotes: i.upvotes + (has ? -1 : 1) } : i));

    if (has) {
      await supabase.from("contribution_votes").delete().eq("contribution_id", id).eq("user_id", user.id);
    } else {
      const { error } = await supabase.from("contribution_votes").insert({ contribution_id: id, user_id: user.id });
      if (error) {
        // revert
        setVotedIds((prev) => { const n = new Set(prev); n.delete(id); return n; });
        setItems((prev) => prev.map((i) => i.id === id ? { ...i, upvotes: i.upvotes - 1 } : i));
      }
    }
  };

  const remove = async (id: string) => {
    if (!confirm("למחוק את ההמלצה?")) return;
    const { error } = await supabase.from("community_contributions").delete().eq("id", id);
    if (error) {
      toast({ title: "שגיאה", description: error.message, variant: "destructive" });
      return;
    }
    setItems((prev) => prev.filter((i) => i.id !== id));
    toast({ title: "נמחק" });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sprout className="h-7 w-7 text-primary" />
              <h1 className="font-heading font-bold text-3xl text-gradient">Help Us Grow</h1>
            </div>
            <p className="text-sm text-muted-foreground">תרום לקהילה — שתף אוטומציות, מומחים, פורומים וקייס סטאדיז שעזרו לך</p>
          </div>
          <AddContributionDialog onCreated={load} />
        </div>

        <div className="flex flex-col md:flex-row gap-3 md:items-center">
          <Tabs value={tab} onValueChange={setTab} className="flex-1">
            <TabsList className="flex-wrap h-auto">
              {TABS.map((t) => (<TabsTrigger key={t.value} value={t.value}>{t.label}</TabsTrigger>))}
            </TabsList>
          </Tabs>
          <div className="relative md:w-72">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="חיפוש..." className="pr-9" />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-border rounded-xl">
            <Sprout className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">עדיין אין המלצות בקטגוריה זו — תהיה הראשון לתרום!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((c) => (
              <ContributionCard
                key={c.id}
                contribution={c}
                isOwner={user?.id === c.user_id}
                hasVoted={votedIds.has(c.id)}
                onVote={() => toggleVote(c.id)}
                onDelete={() => remove(c.id)}
              />
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
