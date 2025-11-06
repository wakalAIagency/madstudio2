"use client";

import {
  AnimatePresence,
  motion,
  useReducedMotion,
  type Transition,
  type Variants,
} from "framer-motion";
import { useEffect, useState } from "react";

const STORAGE_KEY = "madstudio.initial-loader.dismissed";
const DISPLAY_DURATION_MS = 2400;

const sparkleVariants: Variants = {
  still: { rotate: 0, scale: 1 },
  pulse: {
    rotate: [0, 8, -6, 0],
    scale: [1, 1.15, 0.95, 1],
  },
};

const sparkleTransition: Transition = {
  duration: 1.4,
  repeat: Infinity,
  repeatType: "mirror",
  ease: "easeInOut",
};

const circlePulseTransition: Transition = {
  duration: 1.6,
  repeat: Infinity,
  repeatType: "mirror",
  ease: "easeInOut",
};

const dotTransition: Transition = {
  duration: 1.2,
  repeat: Infinity,
  repeatType: "mirror",
  ease: "easeInOut",
};

export function InitialLoader() {
  const prefersReducedMotion = useReducedMotion();
  const [ready, setReady] = useState(false);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;

    let timeout: number | undefined;

    try {
      const hasSeen = window.sessionStorage.getItem(STORAGE_KEY);
      if (hasSeen) {
        setVisible(false);
        return;
      }
      window.sessionStorage.setItem(STORAGE_KEY, "true");
    } catch {
      // sessionStorage might be unavailable (Safari private mode, SSR fallback).
    }

    timeout = window.setTimeout(() => {
      setVisible(false);
    }, DISPLAY_DURATION_MS);

    return () => {
      if (timeout) {
        window.clearTimeout(timeout);
      }
    };
  }, [ready]);

  if (!visible) {
    return null;
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black"
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{
            opacity: 0,
            transition: { duration: 0.4, ease: "easeInOut" },
          }}
        >
          <motion.div
            className="flex flex-col items-center gap-10"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1, transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] } }}
            exit={{ opacity: 0, scale: 0.92, transition: { duration: 0.25, ease: [0.4, 0, 1, 1] } }}
          >
            <motion.div
              className="relative h-40 w-[18rem] max-w-[80vw]"
              initial={{ opacity: 0, y: 32 }}
              animate={{ opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.25, 0.1, 0.25, 1] } }}
              exit={{ opacity: 0, y: -16, transition: { duration: 0.2, ease: [0.4, 0, 1, 1] } }}
            >
              <svg
                viewBox="0 0 600 260"
                className="h-full w-full text-white"
                role="img"
                aria-label="Madstudio logo"
              >
                <path
                  d="M40 220V40c0-8.837 7.163-16 16-16h310c10.351 0 18.753 8.348 18.863 18.699L387 150l137.5-46.5C537.46 100.03 550 111.084 550 125.2V220c0 22.091-17.909 40-40 40H80c-22.091 0-40-17.909-40-40Z"
                  fill="currentColor"
                />
                <motion.circle
                  cx="330"
                  cy="130"
                  r="85"
                  fill="black"
                  initial={{ scale: 0.92 }}
                  animate={
                    prefersReducedMotion ? { scale: 1 } : { scale: [0.92, 1.02, 0.96, 1] }
                  }
                  transition={prefersReducedMotion ? undefined : circlePulseTransition}
                />
                <motion.path
                  d="M330 70L354 106L398 130L354 154L330 190L306 154L262 130L306 106L330 70Z"
                  fill="#29ff6d"
                  style={{ transformOrigin: "center" }}
                  variants={sparkleVariants}
                  initial="still"
                  animate={prefersReducedMotion ? "still" : "pulse"}
                  transition={prefersReducedMotion ? undefined : sparkleTransition}
                />
              </svg>
            </motion.div>

            <motion.div
              className="flex items-center gap-3 text-sm uppercase tracking-[0.4em] text-muted-foreground"
              initial={{ opacity: 0 }}
              animate={{
                opacity: 1,
                transition: { delay: 0.2, duration: 0.5 },
              }}
            >
              <motion.span
                className="h-2 w-2 rounded-full bg-[#29ff6d]"
                animate={
                  prefersReducedMotion
                    ? {}
                    : {
                        opacity: [0.2, 1, 0.2],
                        scale: [0.8, 1.4, 0.8],
                      }
                }
                transition={prefersReducedMotion ? undefined : dotTransition}
              />
              <span>Loading Experience</span>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
