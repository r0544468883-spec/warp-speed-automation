import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import { motion, AnimatePresence } from "framer-motion";
import { Activity, Monitor, MousePointer, Copy, Navigation, Keyboard, FileUp, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface CapturedEvent {
  id: string;
  app_name: string;
  action_type: string;
  event_data: any;
  fingerprint_hash: string | null;
  created_at: string;
}

const actionIcons: Record<string, typeof Activity> = {
  click: MousePointer,
  copy: Copy,
  paste: Copy,
  navigation: Navigation,
  shortcut: Keyboard,
  file_upload: FileUp,
  field_change: Monitor,
  form_submit: RefreshCw,
};

const actionColors: Record<string, string> = {
  click: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  copy: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  paste: "bg-teal-500/20 text-teal-400 border-teal-500/30",
  navigation: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  shortcut: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  file_upload: "bg-pink-500/20 text-pink-400 border-pink-500/30",
  field_change: "bg-indigo-500/20 text-indigo-400 border-indigo-500/30",
  form_submit: "bg-orange-500/20 text-orange-400 border-orange-500/30",
};

export default function LiveEvents() {
  const { user } = useAuth();
  const [events, setEvents] = useState<CapturedEvent[]>([]);
  const [isLive, setIsLive] = useState(true);

  // Load initial events
  useEffect(() => {
    if (!user) return;
    supabase
      .from("captured_events")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50)
      .then(({ data }) => {
        if (data) setEvents(data);
      });
  }, [user]);

  // Realtime subscription
  useEffect(() => {
    if (!user || !isLive) return;

    const channel = supabase
      .channel("live-events")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "captured_events",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          setEvents((prev) => [payload.new as CapturedEvent, ...prev].slice(0, 100));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, isLive]);

  const formatTime = (ts: string) => {
    const d = new Date(ts);
    return d.toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  };

  const formatDate = (ts: string) => {
    const d = new Date(ts);
    return d.toLocaleDateString("he-IL", { day: "numeric", month: "short" });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-heading font-bold text-gradient">אירועים בזמן אמת</h1>
            <p className="text-muted-foreground text-sm mt-1">פעילות שנלכדה מהתוסף — מתעדכן בזמן אמת</p>
          </div>
          <Button
            variant={isLive ? "default" : "outline"}
            size="sm"
            onClick={() => setIsLive(!isLive)}
            className="gap-2"
          >
            <span className={`h-2 w-2 rounded-full ${isLive ? "bg-green-400 animate-pulse" : "bg-muted-foreground"}`} />
            {isLive ? "LIVE" : "מושהה"}
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {(() => {
            const apps = new Set(events.map((e) => e.app_name));
            const types = events.reduce<Record<string, number>>((acc, e) => {
              acc[e.action_type] = (acc[e.action_type] || 0) + 1;
              return acc;
            }, {});
            const topType = Object.entries(types).sort((a, b) => b[1] - a[1])[0];
            return [
              { label: "סה״כ אירועים", value: events.length },
              { label: "אפליקציות", value: apps.size },
              { label: "פעולה נפוצה", value: topType?.[0] || "—" },
              { label: "חזרות", value: topType?.[1] || 0 },
            ].map((stat, i) => (
              <div key={i} className="bg-card/50 border border-border rounded-xl p-4 text-center">
                <p className="text-2xl font-bold font-heading text-primary">{stat.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
              </div>
            ));
          })()}
        </div>

        {/* Events Feed */}
        <div className="space-y-2">
          {events.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Activity className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p className="text-lg font-medium">אין אירועים עדיין</p>
              <p className="text-sm mt-1">התקן את התוסף והתחל לעבוד — האירועים יופיעו כאן בזמן אמת</p>
            </div>
          ) : (
            <AnimatePresence initial={false}>
              {events.map((event) => {
                const Icon = actionIcons[event.action_type] || Activity;
                const colorClass = actionColors[event.action_type] || "bg-muted text-muted-foreground border-border";
                return (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="flex items-center gap-4 bg-card/30 border border-border rounded-lg p-3 hover:bg-card/50 transition-colors"
                  >
                    <div className={`h-9 w-9 rounded-lg flex items-center justify-center border ${colorClass}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px] shrink-0">{event.app_name}</Badge>
                        <span className="text-sm font-medium truncate">{event.action_type}</span>
                      </div>
                      {event.event_data?.target && (
                        <p className="text-xs text-muted-foreground truncate mt-0.5 max-w-md" dir="ltr">
                          {typeof event.event_data.target === "string" ? event.event_data.target : JSON.stringify(event.event_data.target)}
                        </p>
                      )}
                    </div>
                    <div className="text-left shrink-0">
                      <p className="text-xs text-muted-foreground">{formatTime(event.created_at)}</p>
                      <p className="text-[10px] text-muted-foreground/60">{formatDate(event.created_at)}</p>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
