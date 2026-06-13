"use client";

import { useUIStore } from "@/store/uiStore";
import { Sun, Moon } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const { theme, toggleTheme, setTheme } = useUIStore();
  const [mounted, setMounted] = useState(false);

  // Sync theme with system / store on load
  useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem("skydrive_theme") as "light" | "dark" | null;
    if (savedTheme) {
      setTheme(savedTheme);
    } else {
      setTheme("dark");
    }
  }, [setTheme]);

  if (!mounted) return <div className="w-10 h-10 rounded-lg bg-secondary/50" />;

  return (
    <button
      onClick={toggleTheme}
      className="relative p-2.5 rounded-full hover:bg-secondary/60 text-[#444746] dark:text-foreground/70 hover:text-foreground transition-all-custom cursor-pointer flex items-center justify-center overflow-hidden w-10 h-10 border-0"
      aria-label="Toggle theme"
    >
      <motion.div
        initial={false}
        animate={{
          y: theme === "dark" ? 40 : 0,
          opacity: theme === "dark" ? 0 : 1,
        }}
        transition={{ type: "spring", stiffness: 200, damping: 15 }}
        className="absolute"
      >
        <Sun className="w-5 h-5 text-amber-500 fill-amber-500/25" />
      </motion.div>
      <motion.div
        initial={false}
        animate={{
          y: theme === "light" ? -40 : 0,
          opacity: theme === "light" ? 0 : 1,
        }}
        transition={{ type: "spring", stiffness: 200, damping: 15 }}
        className="absolute"
      >
        <Moon className="w-5 h-5 text-indigo-400 fill-indigo-400/25" />
      </motion.div>
    </button>
  );
}
