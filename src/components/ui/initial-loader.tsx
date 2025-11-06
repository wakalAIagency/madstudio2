"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

const DISPLAY_DURATION_MS = 2200;
const GIF_PATH = "/media/madstudio-intro.gif";

export function InitialLoader() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setVisible(false);
    }, DISPLAY_DURATION_MS);

    return () => window.clearTimeout(timeout);
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-8 bg-black">
      <img
        src={GIF_PATH}
        alt="Madstudio animated mark"
        className="w-64 max-w-[70vw]"
        loading="eager"
      />

      <div className="w-48">
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/15">
          <motion.span
            className="block h-full w-full rounded-full bg-[#29ff6d]"
            initial={{ x: "-100%" }}
            animate={{ x: ["-100%", "100%"] }}
            transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>
        <p className="mt-4 text-center text-[0.65rem] uppercase tracking-[0.4em] text-white/70">
          Loading
        </p>
      </div>
    </div>
  );
}
