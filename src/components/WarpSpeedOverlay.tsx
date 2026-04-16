import { motion, AnimatePresence } from "framer-motion";

interface WarpSpeedOverlayProps {
  active: boolean;
  onComplete?: () => void;
}

export default function WarpSpeedOverlay({ active, onComplete }: WarpSpeedOverlayProps) {
  return (
    <AnimatePresence>
      {active && (
        <motion.div
          className="fixed inset-0 z-[100] pointer-events-none overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onAnimationComplete={() => setTimeout(() => onComplete?.(), 1500)}
        >
          {/* Radial glow */}
          <motion.div
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.8, 0] }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
            style={{
              background: "radial-gradient(circle at center, hsl(185 100% 50% / 0.15), hsl(270 100% 50% / 0.1), transparent 70%)",
            }}
          />

          {/* Speed lines */}
          {Array.from({ length: 20 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute h-[1px]"
              style={{
                top: `${5 + Math.random() * 90}%`,
                right: "-10%",
                width: `${20 + Math.random() * 40}%`,
                background: `linear-gradient(to left, transparent, ${
                  i % 2 === 0 ? "hsl(185 100% 50% / 0.6)" : "hsl(270 100% 50% / 0.4)"
                }, transparent)`,
              }}
              initial={{ x: "100%", opacity: 0 }}
              animate={{ x: "-200%", opacity: [0, 1, 0] }}
              transition={{
                duration: 0.6 + Math.random() * 0.4,
                delay: Math.random() * 0.3,
                ease: "easeOut",
              }}
            />
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
