import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";

export const SPEED_FLASH_EVENT = "speed-flash";

/** Trigger a speed flash from anywhere in the app. */
export function triggerSpeedFlash() {
  window.dispatchEvent(new CustomEvent(SPEED_FLASH_EVENT));
}

/**
 * Background speed flash overlay.
 * Triggers automatically:
 *  - on every route change
 *  - every `intervalMs` (default 60s)
 *  - whenever `triggerSpeedFlash()` is called (e.g. AI pattern detection)
 */
export default function SpeedFlash({ intervalMs = 60000 }: { intervalMs?: number }) {
  const [tick, setTick] = useState(0);
  const [active, setActive] = useState(false);
  const location = useLocation();

  const fire = () => {
    setTick((t) => t + 1);
    setActive(true);
    setTimeout(() => setActive(false), 1100);
  };

  // Periodic
  useEffect(() => {
    const id = setInterval(fire, intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);

  // Route changes
  useEffect(() => {
    fire();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  // External event
  useEffect(() => {
    const handler = () => fire();
    window.addEventListener(SPEED_FLASH_EVENT, handler);
    return () => window.removeEventListener(SPEED_FLASH_EVENT, handler);
  }, []);

  return (
    <AnimatePresence>
      {active && (
        <motion.div
          key={tick}
          className="fixed inset-0 z-[60] pointer-events-none overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.5, 0] }}
            transition={{ duration: 1, ease: "easeInOut" }}
            style={{
              background:
                "radial-gradient(circle at center, hsl(var(--primary) / 0.12), hsl(var(--secondary) / 0.06), transparent 70%)",
            }}
          />
          {Array.from({ length: 22 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute h-px"
              style={{
                top: `${(i * 4.5) % 100}%`,
                right: "-10%",
                width: `${25 + (i * 11) % 50}%`,
                background: `linear-gradient(to left, transparent, hsl(var(--${i % 2 ? "secondary" : "primary"}) / 0.7), transparent)`,
              }}
              initial={{ x: "100%", opacity: 0 }}
              animate={{ x: "-220%", opacity: [0, 1, 0] }}
              transition={{ duration: 0.55 + (i % 4) * 0.08, delay: (i * 0.015), ease: "easeOut" }}
            />
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
