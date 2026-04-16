import { useState, useEffect } from "react";
import { History, Zap, Check, Copy, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import DashboardLayout from "@/components/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface SendLog {
  id: string;
  platform: string;
  automation_name: string;
  status: string;
  error_message: string | null;
  created_at: string;
}

const statusConfig: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  sent: { icon: Check, color: "bg-success/20 text-success", label: "נשלח" },
  copied: { icon: Copy, color: "bg-primary/20 text-primary", label: "הועתק" },
  error: { icon: AlertCircle, color: "bg-destructive/20 text-destructive", label: "שגיאה" },
};

const platformColors: Record<string, string> = {
  n8n: "bg-orange-500/20 text-orange-400",
  Make: "bg-purple-500/20 text-purple-400",
  Zapier: "bg-amber-500/20 text-amber-400",
};

export default function SendHistory() {
  const [logs, setLogs] = useState<SendLog[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    supabase
      .from("automation_send_log")
      .select("id, platform, automation_name, status, error_message, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(100)
      .then(({ data }) => {
        if (data) setLogs(data);
        setLoading(false);
      });
  }, [user]);

  const formatDate = (d: string) => {
    const date = new Date(d);
    return date.toLocaleDateString("he-IL", { day: "2-digit", month: "2-digit", year: "2-digit" }) +
      " " + date.toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-heading font-bold text-gradient mb-1 flex items-center gap-3">
          <History className="h-8 w-8 text-primary" /> היסטוריית שליחות
        </h1>
        <p className="text-muted-foreground text-sm">לוג כל האוטומציות שנשלחו לפלטפורמות</p>
      </div>

      <Card className="bg-card/50 border-border">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            {logs.length} שליחות
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground text-sm text-center py-8">טוען...</p>
          ) : logs.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-8">
              עדיין לא נשלחו אוטומציות. שלח המלצה מהדשבורד כדי להתחיל!
            </p>
          ) : (
            <div className="space-y-2">
              {logs.map((log) => {
                const sc = statusConfig[log.status] || statusConfig.sent;
                const StatusIcon = sc.icon;
                return (
                  <div
                    key={log.id}
                    className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary/20 transition-colors"
                  >
                    <div className={`p-1.5 rounded-md ${sc.color}`}>
                      <StatusIcon className="h-3.5 w-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{log.automation_name}</p>
                      {log.error_message && (
                        <p className="text-xs text-destructive truncate">{log.error_message}</p>
                      )}
                    </div>
                    <Badge className={`text-[10px] ${platformColors[log.platform] || "bg-muted text-muted-foreground"}`}>
                      {log.platform}
                    </Badge>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">{formatDate(log.created_at)}</span>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
