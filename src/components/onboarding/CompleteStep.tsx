import { motion } from "framer-motion";
import { CheckCircle2, Sparkles } from "lucide-react";

export default function CompleteStep() {
  return (
    <div className="text-center py-4">
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", duration: 0.8 }}
        className="inline-flex items-center justify-center h-24 w-24 rounded-full bg-gradient-to-br from-success/20 to-primary/20 border-2 border-success/40 mb-6"
      >
        <CheckCircle2 className="h-12 w-12 text-success" />
      </motion.div>

      <h2 className="text-3xl font-heading font-bold text-gradient mb-3">הכל מוכן! 🎉</h2>
      <p className="text-muted-foreground mb-2 max-w-md mx-auto">
        הפרופיל שלך הוגדר. ההמלצות החכמות יופיעו ברגע שתפתח את הוויקי.
      </p>
      <div className="inline-flex items-center gap-2 text-sm text-primary mt-4">
        <Sparkles className="h-4 w-4" />
        <span>בוא נתחיל לחסוך זמן</span>
      </div>
    </div>
  );
}
