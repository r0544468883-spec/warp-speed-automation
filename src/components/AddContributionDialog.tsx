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
import { Plus, Loader2, Upload, X, Globe, Code2, Briefcase, Link as LinkIcon } from "lucide-react";

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
  nickname: z.string().trim().max(50).optional(),
  website_url: z.string().trim().url("כתובת לא תקינה").optional().or(z.literal("")),
  github_url: z.string().trim().url("כתובת לא תקינה").optional().or(z.literal("")),
  linkedin_url: z.string().trim().url("כתובת לא תקינה").optional().or(z.literal("")),
  linktree_url: z.string().trim().url("כתובת לא תקינה").optional().or(z.literal("")),
});

const MAX_FILE_MB = 10;

export default function AddContributionDialog({ onCreated }: { onCreated?: () => void }) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [showIdentity, setShowIdentity] = useState(false);
  const [form, setForm] = useState({
    type: "automation" as const,
    title: "",
    description: "",
    url: "",
    tags: "",
    tools: "",
    nickname: "",
    website_url: "",
    github_url: "",
    linkedin_url: "",
    linktree_url: "",
  });

  const reset = () => {
    setForm({
      type: "automation", title: "", description: "", url: "", tags: "", tools: "",
      nickname: "", website_url: "", github_url: "", linkedin_url: "", linktree_url: "",
    });
    setFiles([]);
    setShowIdentity(false);
  };

  const handleFiles = (list: FileList | null) => {
    if (!list) return;
    const next: File[] = [];
    for (const f of Array.from(list)) {
      if (f.size > MAX_FILE_MB * 1024 * 1024) {
        toast({ title: `${f.name} גדול מדי`, description: `מקסימום ${MAX_FILE_MB}MB`, variant: "destructive" });
        continue;
      }
      next.push(f);
    }
    setFiles((prev) => [...prev, ...next].slice(0, 5));
  };

  const submit = async () => {
    if (!user) return;
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      toast({ title: "שגיאה בטופס", description: parsed.error.issues[0].message, variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      // Update profile identity fields if any provided
      const identityPatch: Record<string, string | null> = {};
      if (parsed.data.nickname) identityPatch.nickname = parsed.data.nickname;
      if (parsed.data.website_url) identityPatch.website_url = parsed.data.website_url;
      if (parsed.data.github_url) identityPatch.github_url = parsed.data.github_url;
      if (parsed.data.linkedin_url) identityPatch.linkedin_url = parsed.data.linkedin_url;
      if (parsed.data.linktree_url) identityPatch.linktree_url = parsed.data.linktree_url;
      if (Object.keys(identityPatch).length > 0) {
        await supabase.from("profiles").update(identityPatch as any).eq("user_id", user.id);
      }

      // Insert contribution
      const { data: created, error } = await supabase
        .from("community_contributions")
        .insert({
          user_id: user.id,
          type: parsed.data.type,
          title: parsed.data.title,
          description: parsed.data.description || null,
          url: parsed.data.url || null,
          tags: parsed.data.tags ? parsed.data.tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
          tools_related: parsed.data.tools ? parsed.data.tools.split(",").map((t) => t.trim()).filter(Boolean) : [],
        })
        .select()
        .single();

      if (error || !created) throw error || new Error("insert failed");

      // Upload files
      for (const file of files) {
        const path = `${user.id}/${created.id}/${Date.now()}-${file.name}`;
        const { error: upErr } = await supabase.storage.from("contribution-files").upload(path, file);
        if (upErr) {
          toast({ title: `שגיאה בהעלאת ${file.name}`, description: upErr.message, variant: "destructive" });
          continue;
        }
        const { data: urlData } = supabase.storage.from("contribution-files").getPublicUrl(path);
        await supabase.from("contribution_attachments").insert({
          contribution_id: created.id,
          user_id: user.id,
          file_url: urlData.publicUrl,
          file_name: file.name,
          mime_type: file.type,
          size_bytes: file.size,
        });
      }

      toast({ title: "תודה על התרומה! 🌱", description: "ההמלצה שלך נוספה לקהילה" });
      reset();
      setOpen(false);
      onCreated?.();
    } catch (e: any) {
      toast({ title: "שגיאה בשמירה", description: e?.message || "", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          הוסף המלצה
        </Button>
      </DialogTrigger>
      <DialogContent dir="rtl" className="max-w-lg max-h-[90vh] overflow-y-auto">
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
              <Label>תגיות (פסיק)</Label>
              <Input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="crm, sales" />
            </div>
            <div>
              <Label>כלים קשורים</Label>
              <Input value={form.tools} onChange={(e) => setForm({ ...form, tools: e.target.value })} placeholder="whatsapp, monday" />
            </div>
          </div>

          {/* Files */}
          <div>
            <Label className="flex items-center gap-2"><Upload className="h-4 w-4" /> קבצים מצורפים (אופציונלי)</Label>
            <Input type="file" multiple onChange={(e) => handleFiles(e.target.files)} className="mt-1" accept="image/*,application/pdf,.json,.zip,.txt,.md" />
            {files.length > 0 && (
              <div className="mt-2 space-y-1">
                {files.map((f, i) => (
                  <div key={i} className="flex items-center justify-between text-xs bg-muted/50 px-2 py-1 rounded">
                    <span className="truncate">{f.name}</span>
                    <button onClick={() => setFiles(files.filter((_, j) => j !== i))} className="text-destructive">
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Identity toggle */}
          <button
            type="button"
            onClick={() => setShowIdentity(!showIdentity)}
            className="text-xs text-primary underline"
          >
            {showIdentity ? "הסתר" : "הוסף"} כינוי וקישורים אישיים (אופציונלי)
          </button>

          {showIdentity && (
            <div className="space-y-2 p-3 bg-muted/30 rounded-lg border border-border">
              <div>
                <Label className="text-xs">כינוי להצגה</Label>
                <Input value={form.nickname} onChange={(e) => setForm({ ...form, nickname: e.target.value })} maxLength={50} placeholder="במקום השם המלא" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs flex items-center gap-1"><Globe className="h-3 w-3" /> אתר</Label>
                  <Input value={form.website_url} onChange={(e) => setForm({ ...form, website_url: e.target.value })} placeholder="https://..." dir="ltr" className="text-xs" />
                </div>
                <div>
                  <Label className="text-xs flex items-center gap-1"><Code2 className="h-3 w-3" /> GitHub</Label>
                  <Input value={form.github_url} onChange={(e) => setForm({ ...form, github_url: e.target.value })} placeholder="https://github.com/..." dir="ltr" className="text-xs" />
                </div>
                <div>
                  <Label className="text-xs flex items-center gap-1"><Briefcase className="h-3 w-3" /> LinkedIn</Label>
                  <Input value={form.linkedin_url} onChange={(e) => setForm({ ...form, linkedin_url: e.target.value })} placeholder="https://linkedin.com/in/..." dir="ltr" className="text-xs" />
                </div>
                <div>
                  <Label className="text-xs flex items-center gap-1"><LinkIcon className="h-3 w-3" /> Linktree</Label>
                  <Input value={form.linktree_url} onChange={(e) => setForm({ ...form, linktree_url: e.target.value })} placeholder="https://linktr.ee/..." dir="ltr" className="text-xs" />
                </div>
              </div>
            </div>
          )}
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
