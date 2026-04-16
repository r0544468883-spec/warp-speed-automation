import { motion } from "framer-motion";

interface SpeedometerProps {
  value: number; // 0-100
  label?: string;
}

export default function SpeedometerWidget({ value, label = "זיהוי דפוסים" }: SpeedometerProps) {
  const circumference = 2 * Math.PI * 45;
  const offset = circumference - (value / 100) * circumference * 0.75; // 270 degree arc

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-32 h-32">
        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-[135deg]">
          {/* Background arc */}
          <circle
            cx="50" cy="50" r="45"
            fill="none"
            stroke="hsl(var(--muted))"
            strokeWidth="6"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * 0.25}
            strokeLinecap="round"
          />
          {/* Value arc */}
          <motion.circle
            cx="50" cy="50" r="45"
            fill="none"
            stroke="url(#speedGradient)"
            strokeWidth="6"
            strokeDasharray={circumference}
            strokeLinecap="round"
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.5, ease: "easeOut" }}
          />
          <defs>
            <linearGradient id="speedGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="hsl(var(--primary))" />
              <stop offset="100%" stopColor="hsl(var(--secondary))" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            className="text-3xl font-heading font-bold text-gradient"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            {value}%
          </motion.span>
        </div>
      </div>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}
