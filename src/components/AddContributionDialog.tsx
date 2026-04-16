import { useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Loader2 } from "lucide-react";

const TYPES = [
  { value: "automation", label: "אוטומציה" },
  { value: "expert", label: "מומחה" },
  { value: "linkedin", label: "דף LinkedIn" },
  { value: "case_study", label: "Case Study" },
  { value: "forum", label: "פורום / קהילה" },
  { value: "other", label: "אחר" },
] as const;

const schema = z.object({
  type: z.enum(["automation", "expert", "linkedin", "case_study", "forum", "other"]),
  title: z.string().trim().min(3, "כותרת קצרה מדי").max(120),
  description: z.string().trim().max(500).optional(),
  url: z.string().trim().url("כתובת לא תקינה").max(500).optional().or(z.literal("")),
  tags: z.string().max(200).optional(),
  tools: z.string().max(200).optional(),
});

export default function AddContributionDialog({ onCreated }: { onCreated?: () => void }) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    type: "automation" as const,
    title: "",
    description: "",
    url: "",
    tags: "",
    tools: "",
  });

  const reset = () => setForm({ type: "automation", title: "", description: "", url: "", tags: "", tools: "" });

  const submit = async () => {
    if (!user) return;
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      toast({ title: "שגיאה בטופס", description: parsed.error.issues[0].message, variant: "destructive" });
      return;
    }
    setLoading(true);
    const { error } = await supabase.from("community_contributions").insert({
      user_id: user.id,
      type: parsed.data.type,
      title: parsed.data.title,
      description: parsed.data.description || null,
      url: parsed.data.url || null,
      tags: parsed.data.tags ? parsed.data.tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
      tools_related: parsed.data.tools ? parsed.data.tools.split(",").map((t) => t.trim()).filter(Boolean) : [],
    });
    setLoading(false);
    if (error) {
      toast({ title: "שגיאה בשמירה", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "תודה על התרומה! 🌱", description: "ההמלצה שלך נוספה לקהילה" });
    reset();
    setOpen(false);
    onCreated?.();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          הוסף המלצה
        </Button>
      </DialogTrigger>
      <DialogContent dir="rtl" className="max-w-lg">
        <DialogHeader>
          <DialogTitle>תרום לקהילה 🌱</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>סוג</Label>
            <Select value={form.type} onValueChange={(v: any) => setForm({ ...form, type: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {TYPES.map((t) => (<SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>כותרת *</Label>
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} maxLength={120} placeholder="למשל: אוטומציה WhatsApp → Monday" />
          </div>
          <div>
            <Label>תיאור</Label>
            <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} maxLength={500} rows={3} placeholder="ספר/י איך זה עוזר ולמי..." />
          </div>
          <div>
            <Label>קישור</Label>
            <Input value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} placeholder="https://..." />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>תגיות (מופרדות בפסיק)</Label>
              <Input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="crm, sales" />
            </div>
            <div>
              <Label>כלים קשורים</Label>
              <Input value={form.tools} onChange={(e) => setForm({ ...form, tools: e.target.value })} placeholder="whatsapp, monday" />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>בטל</Button>
          <Button onClick={submit} disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            פרסם
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
