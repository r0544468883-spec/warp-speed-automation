import { useState, useEffect } from "react";
import { Settings, Bell, Plug, CreditCard, User, Webhook, Wrench } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import DashboardLayout from "@/components/DashboardLayout";
import ToolStackEditor from "@/components/ToolStackEditor";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const connectedTools = [
  { name: "Gmail", connected: true },
  { name: "Monday", connected: true },
  { name: "Priority", connected: false },
  { name: "Claude", connected: true },
  { name: "Fireberry", connected: false },
  { name: "Airtable", connected: false },
  { name: "n8n", connected: true },
  { name: "Make", connected: false },
];

export default function SettingsPage() {
  const [notifications, setNotifications] = useState(true);
  const [autoDetect, setAutoDetect] = useState(true);
  const [n8nUrl, setN8nUrl] = useState("");
  const [makeUrl, setMakeUrl] = useState("");
  const [zapierUrl, setZapierUrl] = useState("");
  const [defaultPlatform, setDefaultPlatform] = useState<string>("none");
  const [saving, setSaving] = useState(false);
  const [toolStack, setToolStack] = useState<string[]>([]);
  const [savingTools, setSavingTools] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("tool_stack")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.tool_stack) setToolStack(data.tool_stack as string[]);
      });
  }, [user]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("webhook_settings")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setN8nUrl(data.n8n_webhook_url || "");
          setMakeUrl(data.make_webhook_url || "");
          setZapierUrl(data.zapier_webhook_url || "");
          setDefaultPlatform(data.default_platform || "none");
        }
      });
  }, [user]);

  const saveWebhooks = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { data: existing } = await supabase
        .from("webhook_settings")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (existing) {
        await supabase
          .from("webhook_settings")
          .update({
            n8n_webhook_url: n8nUrl || null,
            make_webhook_url: makeUrl || null,
            zapier_webhook_url: zapierUrl || null,
            default_platform: defaultPlatform === "none" ? null : defaultPlatform,
          })
          .eq("user_id", user.id);
      } else {
        await supabase.from("webhook_settings").insert({
          user_id: user.id,
          n8n_webhook_url: n8nUrl || null,
          make_webhook_url: makeUrl || null,
          zapier_webhook_url: zapierUrl || null,
          default_platform: defaultPlatform === "none" ? null : defaultPlatform,
        });
      }
      toast.success("כתובות Webhook נשמרו בהצלחה!");
    } catch {
      toast.error("שגיאה בשמירת ההגדרות");
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-heading font-bold text-gradient mb-1 flex items-center gap-3">
          <Settings className="h-8 w-8 text-primary" /> הגדרות
        </h1>
        <p className="text-muted-foreground text-sm">ניהול חשבון, חיבורים והתראות</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Profile */}
        <Card className="bg-card/50 border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg"><User className="h-5 w-5 text-primary" /> פרופיל</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm">שם תצוגה</Label>
              <Input defaultValue="ג'יי" className="bg-muted/50 border-border mt-1" />
            </div>
            <div>
              <Label className="text-sm">תעשייה</Label>
              <Input defaultValue="טכנולוגיה" className="bg-muted/50 border-border mt-1" />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">מנוי</span>
              <Badge className="bg-primary/10 text-primary">Free</Badge>
            </div>
            <Button className="w-full bg-gradient-to-l from-primary to-secondary text-primary-foreground">
              <CreditCard className="h-4 w-4 ml-2" /> שדרג ל-Pro
            </Button>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card className="bg-card/50 border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg"><Bell className="h-5 w-5 text-primary" /> התראות</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">התראות אוטומציה</p>
                <p className="text-xs text-muted-foreground">קבל התראה כשמזוהה דפוס חוזר</p>
              </div>
              <Switch checked={notifications} onCheckedChange={setNotifications} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">זיהוי אוטומטי</p>
                <p className="text-xs text-muted-foreground">סריקה רציפה בזמן הגלישה</p>
              </div>
              <Switch checked={autoDetect} onCheckedChange={setAutoDetect} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">דוח שבועי</p>
                <p className="text-xs text-muted-foreground">סיכום חסכון שבועי למייל</p>
              </div>
              <Switch />
            </div>
          </CardContent>
        </Card>

        {/* Webhook Settings */}
        <Card className="bg-card/50 border-border lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Webhook className="h-5 w-5 text-primary" /> כתובות Webhook
            </CardTitle>
            <p className="text-xs text-muted-foreground">הגדר כתובות Webhook כדי לשלוח אוטומציות ישירות לפלטפורמות שלך</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label className="text-sm flex items-center gap-2">
                  <span className="inline-block h-2.5 w-2.5 rounded-full bg-orange-400" />
                  n8n Webhook URL
                </Label>
                <Input
                  value={n8nUrl}
                  onChange={(e) => setN8nUrl(e.target.value)}
                  placeholder="https://your-n8n.app/webhook/..."
                  className="bg-muted/50 border-border mt-1 text-xs"
                  dir="ltr"
                />
              </div>
              <div>
                <Label className="text-sm flex items-center gap-2">
                  <span className="inline-block h-2.5 w-2.5 rounded-full bg-purple-400" />
                  Make Webhook URL
                </Label>
                <Input
                  value={makeUrl}
                  onChange={(e) => setMakeUrl(e.target.value)}
                  placeholder="https://hook.make.com/..."
                  className="bg-muted/50 border-border mt-1 text-xs"
                  dir="ltr"
                />
              </div>
              <div>
                <Label className="text-sm flex items-center gap-2">
                  <span className="inline-block h-2.5 w-2.5 rounded-full bg-amber-400" />
                  Zapier Webhook URL
                </Label>
                <Input
                  value={zapierUrl}
                  onChange={(e) => setZapierUrl(e.target.value)}
                  placeholder="https://hooks.zapier.com/hooks/catch/..."
                  className="bg-muted/50 border-border mt-1 text-xs"
                  dir="ltr"
                />
              </div>
            </div>
            <div>
              <Label className="text-sm mb-1 block">פלטפורמה מועדפת (שליחה מהירה)</Label>
              <Select value={defaultPlatform} onValueChange={setDefaultPlatform}>
                <SelectTrigger className="bg-muted/50 border-border w-48">
                  <SelectValue placeholder="בחר פלטפורמה" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">ללא — הצג תפריט</SelectItem>
                  <SelectItem value="n8n">n8n</SelectItem>
                  <SelectItem value="make">Make</SelectItem>
                  <SelectItem value="zapier">Zapier</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={saveWebhooks} disabled={saving} className="bg-primary text-primary-foreground">
              {saving ? "שומר..." : "שמור הגדרות Webhook"}
            </Button>
          </CardContent>
        </Card>

        {/* Connected tools */}
        <Card className="bg-card/50 border-border lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg"><Plug className="h-5 w-5 text-primary" /> כלים מחוברים</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-3">
              {connectedTools.map((tool) => (
                <div
                  key={tool.name}
                  className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                    tool.connected
                      ? "border-primary/30 bg-primary/5"
                      : "border-border hover:border-muted-foreground/30"
                  }`}
                >
                  <span className="text-sm font-medium">{tool.name}</span>
                  <div className={`h-2.5 w-2.5 rounded-full ${tool.connected ? "bg-success" : "bg-muted"}`} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
