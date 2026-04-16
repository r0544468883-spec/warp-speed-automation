import { useState } from "react";
import { motion } from "framer-motion";
import { Settings, Bell, Plug, CreditCard, Shield, User } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import DashboardLayout from "@/components/DashboardLayout";

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
