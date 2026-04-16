import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Video, Upload, Loader2, FileJson, Zap, CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import DashboardLayout from "@/components/DashboardLayout";

type AuditStatus = "idle" | "uploading" | "processing" | "done";

const mockResult = {
  detectedApps: ["Priority", "Gmail", "Excel"],
  steps: [
    "פתיחת חשבונית ב-Gmail",
    "העתקת נתונים ל-Excel",
    "הזנה ידנית לפריוריטי",
  ],
  blueprint: {
    platform: "n8n",
    nodes: ["Gmail Trigger", "Data Extract", "Priority API"],
    estimatedSaving: "2.5 שעות/שבוע",
  },
};

export default function SmartAudit() {
  const [status, setStatus] = useState<AuditStatus>("idle");
  const [dragOver, setDragOver] = useState(false);

  const handleUpload = useCallback(() => {
    setStatus("uploading");
    setTimeout(() => setStatus("processing"), 1500);
    setTimeout(() => setStatus("done"), 4000);
  }, []);

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-heading font-bold text-gradient mb-1 flex items-center gap-3">
          <Video className="h-8 w-8 text-primary" /> Smart Audit
        </h1>
        <p className="text-muted-foreground text-sm">העלה סרטון מסך ← ה-AI מנתח ← מקבל JSON מוכן לאוטומציה</p>
      </div>

      {/* Upload zone */}
      <AnimatePresence mode="wait">
        {status === "idle" && (
          <motion.div key="upload" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <Card
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => { e.preventDefault(); setDragOver(false); handleUpload(); }}
              className={`border-2 border-dashed transition-all cursor-pointer ${
                dragOver ? "border-primary bg-primary/5 glow-cyan" : "border-border hover:border-primary/30"
              }`}
              onClick={handleUpload}
            >
              <CardContent className="flex flex-col items-center justify-center py-20">
                <motion.div
                  animate={dragOver ? { scale: 1.1 } : { scale: 1 }}
                  className="p-6 rounded-full bg-primary/10 mb-6"
                >
                  <Upload className="h-12 w-12 text-primary" />
                </motion.div>
                <h3 className="text-lg font-heading font-semibold mb-2">גרור סרטון לכאן</h3>
                <p className="text-sm text-muted-foreground mb-4">או לחץ לבחירת קובץ</p>
                <p className="text-xs text-muted-foreground">MP4, WebM, MOV — עד 500MB</p>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {(status === "uploading" || status === "processing") && (
          <motion.div key="processing" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
            <Card className="border-border animate-pulse-glow">
              <CardContent className="flex flex-col items-center justify-center py-20">
                <Loader2 className="h-16 w-16 text-primary animate-spin mb-6" />
                <h3 className="text-lg font-heading font-semibold mb-2">
                  {status === "uploading" ? "מעלה סרטון..." : "AI מנתח את הסרטון..."}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {status === "uploading"
                    ? "מזהה אפליקציות ותהליכים"
                    : "מזהה דפוסים ובונה Blueprint"}
                </p>
                <div className="w-64 h-1.5 bg-muted rounded-full mt-6 overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-l from-primary to-secondary rounded-full"
                    initial={{ width: "0%" }}
                    animate={{ width: status === "uploading" ? "40%" : "85%" }}
                    transition={{ duration: 2 }}
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {status === "done" && (
          <motion.div key="done" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            {/* Success header */}
            <Card className="border-success/30 bg-success/5">
              <CardContent className="flex items-center gap-4 py-4">
                <CheckCircle2 className="h-8 w-8 text-success" />
                <div>
                  <h3 className="font-heading font-semibold">הניתוח הושלם!</h3>
                  <p className="text-sm text-muted-foreground">זוהו {mockResult.detectedApps.length} אפליקציות ו-{mockResult.steps.length} שלבים</p>
                </div>
              </CardContent>
            </Card>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Detected steps */}
              <Card className="bg-card/50 border-border">
                <CardContent className="p-6">
                  <h3 className="font-heading font-semibold mb-4 flex items-center gap-2">
                    <Video className="h-5 w-5 text-primary" /> שלבים שזוהו
                  </h3>
                  <div className="space-y-3">
                    {mockResult.steps.map((step, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.15 }}
                        className="flex items-start gap-3"
                      >
                        <span className="shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold">
                          {i + 1}
                        </span>
                        <span className="text-sm">{step}</span>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Blueprint */}
              <Card className="bg-card/50 border-border">
                <CardContent className="p-6">
                  <h3 className="font-heading font-semibold mb-4 flex items-center gap-2">
                    <FileJson className="h-5 w-5 text-secondary" /> Blueprint לאוטומציה
                  </h3>
                  <div className="bg-muted/50 rounded-lg p-4 font-mono text-xs mb-4 overflow-x-auto">
                    <pre dir="ltr" className="text-muted-foreground">
{JSON.stringify(mockResult.blueprint, null, 2)}
                    </pre>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" className="gap-1 bg-primary/10 text-primary hover:bg-primary/20">
                      <Zap className="h-3 w-3" /> שלח ל-n8n
                    </Button>
                    <Button size="sm" variant="outline" className="gap-1 border-border">
                      שלח ל-Make
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Button variant="outline" onClick={() => setStatus("idle")} className="border-border">
              נתח סרטון נוסף
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}
