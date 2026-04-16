import { motion } from "framer-motion";
import { Download, Globe, Shield, Monitor, Zap, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import DashboardLayout from "@/components/DashboardLayout";

const browsers = [
  { name: "Google Chrome", icon: Globe },
  { name: "Microsoft Edge", icon: Monitor },
  { name: "Brave", icon: Shield },
  { name: "Arc", icon: Zap },
];

const steps = [
  { step: 1, title: "הורד את הקובץ", description: "לחץ על כפתור ההורדה למטה כדי להוריד את קובץ ה-ZIP של התוסף" },
  { step: 2, title: "חלץ את הקובץ", description: "חלץ את קובץ ה-ZIP לתיקייה במחשב שלך" },
  { step: 3, title: "פתח את דף התוספים", description: "הקלד chrome://extensions בשורת הכתובת ולחץ Enter" },
  { step: 4, title: "הפעל מצב מפתח", description: "לחץ על המתג 'מצב מפתח' (Developer mode) בפינה הימנית העליונה" },
  { step: 5, title: "טען תוסף", description: "לחץ על 'טען תוסף שלא נארז' (Load unpacked) ובחר את התיקייה שחילצת" },
];

function handleDownload() {
  fetch("/24-7-extension.zip")
    .then((res) => {
      if (!res.ok) throw new Error(`Download failed: ${res.status}`);
      return res.blob();
    })
    .then((blob) => {
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "24-7-extension.zip";
      a.click();
      URL.revokeObjectURL(a.href);
    })
    .catch((err) => alert("שגיאה בהורדה: " + err.message));
}

export default function ExtensionDownload() {
  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
            <Globe className="h-5 w-5 text-primary" />
            <span className="text-sm text-primary font-medium">תוסף לכרום</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-heading font-bold">
            התוסף של <span className="text-gradient">24.7</span>
          </h1>
          <p className="text-muted-foreground max-w-lg mx-auto">
            התוסף עוקב אחרי הפעילות שלך בדפדפן, מזהה דפוסים חוזרים ומייצר המלצות אוטומציה חכמות — הכל אוטומטית
          </p>
          <Button size="lg" className="gap-2 text-base" onClick={handleDownload}>
            <Download className="h-5 w-5" />
            הורד את התוסף
          </Button>
        </motion.div>

        {/* Installation steps */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card/50 backdrop-blur-xl border border-border rounded-2xl p-6 md:p-8"
        >
          <h2 className="text-xl font-heading font-bold mb-6">הוראות התקנה</h2>
          <div className="space-y-4">
            {steps.map((s) => (
              <div key={s.step} className="flex items-start gap-4">
                <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
                  {s.step}
                </div>
                <div>
                  <h3 className="font-medium text-foreground">{s.title}</h3>
                  <p className="text-sm text-muted-foreground">{s.description}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Supported browsers */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card/50 backdrop-blur-xl border border-border rounded-2xl p-6 md:p-8"
        >
          <h2 className="text-xl font-heading font-bold mb-4">דפדפנים נתמכים</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {browsers.map((b) => (
              <div key={b.name} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border">
                <b.icon className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium">{b.name}</span>
                <CheckCircle className="h-4 w-4 text-primary mr-auto" />
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
