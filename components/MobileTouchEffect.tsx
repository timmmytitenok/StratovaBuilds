"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

const GLOW_FADE_IN_DURATION = 0.25;
const GLOW_FADE_OUT_DURATION = 0.4;

export default function MobileTouchEffect() {
  const [glow, setGlow] = useState<{ x: number; y: number; visible: boolean } | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const handler = () => setIsMobile(mq.matches);
    const id = requestAnimationFrame(() => setIsMobile(mq.matches));
    mq.addEventListener("change", handler);
    return () => {
      cancelAnimationFrame(id);
      mq.removeEventListener("change", handler);
    };
  }, []);

  useEffect(() => {
    if (!isMobile) return;

    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      if (!touch) return;
      setGlow({ x: touch.clientX, y: touch.clientY, visible: true });
    };

    const handleTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0];
      if (!touch) return;
      setGlow((prev) => (prev ? { ...prev, x: touch.clientX, y: touch.clientY } : null));
    };

    const handleTouchEnd = () => {
      setGlow((prev) => (prev ? { ...prev, visible: false } : null));
      setTimeout(() => setGlow(null), GLOW_FADE_OUT_DURATION * 1000);
    };

    const handleTouchCancel = () => setGlow(null);

    document.addEventListener("touchstart", handleTouchStart, { passive: true });
    document.addEventListener("touchmove", handleTouchMove, { passive: true });
    document.addEventListener("touchend", handleTouchEnd, { passive: true });
    document.addEventListener("touchcancel", handleTouchCancel, { passive: true });

    return () => {
      document.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
      document.removeEventListener("touchcancel", handleTouchCancel);
    };
  }, [isMobile]);

  if (!isMobile) return null;

  return (
    glow && (
      <motion.div
        className="pointer-events-none fixed inset-0 z-[9999] md:hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: glow.visible ? 1 : 0 }}
        transition={{
          duration: glow.visible ? GLOW_FADE_IN_DURATION : GLOW_FADE_OUT_DURATION,
          ease: [0.25, 0.46, 0.45, 0.94],
        }}
      >
        <div
          className="absolute h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            left: glow.x,
            top: glow.y,
            background:
              "radial-gradient(circle, rgba(255,255,255,0.28) 0%, rgba(255,255,255,0.12) 40%, rgba(255,255,255,0.04) 60%, transparent 80%)",
            filter: "blur(12px)",
          }}
        />
      </motion.div>
    )
  );
}
