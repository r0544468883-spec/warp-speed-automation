import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

/**
 * Background speed flash that triggers every minute.
 * A subtle warp-line burst across the viewport.
 */
export default function SpeedFlash({ intervalMs = 60000 }: { intervalMs?: number }) {
  const [active, setActive] = useState(false);

  useEffect(() => {
    const id = setInterval(() => {
      setActive(true);
      setTimeout(() => setActive(false), 1200);
    }, intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);

  return (
    <AnimatePresence>
      {active && (
        <motion.div
          className="fixed inset-0 z-[60] pointer-events-none overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.4, 0] }}
            transition={{ duration: 1.2, ease: "easeInOut" }}
            style={{
              background:
                "radial-gradient(circle at center, hsl(var(--primary) / 0.08), hsl(var(--secondary) / 0.05), transparent 70%)",
            }}
          />
          {Array.from({ length: 16 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute h-px"
              style={{
                top: `${5 + Math.random() * 90}%`,
                right: "-10%",
                width: `${20 + Math.random() * 40}%`,
                background: `linear-gradient(to left, transparent, hsl(var(--${i % 2 ? "secondary" : "primary"}) / 0.6), transparent)`,
              }}
              initial={{ x: "100%", opacity: 0 }}
              animate={{ x: "-200%", opacity: [0, 1, 0] }}
              transition={{ duration: 0.6 + Math.random() * 0.4, delay: Math.random() * 0.3, ease: "easeOut" }}
            />
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
