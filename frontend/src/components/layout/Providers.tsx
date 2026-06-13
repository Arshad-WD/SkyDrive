"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useAuthStore } from "@/store/authStore";
import { useUIStore } from "@/store/uiStore";
import { useEffect, useState } from "react";

interface ProvidersProps {
  children: React.ReactNode;
}

export default function Providers({ children }: ProvidersProps) {
  const initializeAuth = useAuthStore((state) => state.initialize);
  const setTheme = useUIStore((state) => state.setTheme);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Initialize Auth Session
    initializeAuth();

    // Initialize Theme
    const savedTheme = localStorage.getItem("skydrive_theme") as "light" | "dark" | null;
    const initialTheme = savedTheme || "light";
    setTheme(initialTheme);
    
    setMounted(true);
  }, [initializeAuth, setTheme]);

  // Prevent flash of unstyled content during server-side render
  if (!mounted) {
    return (
      <QueryClientProvider client={queryClient}>
        <div style={{ visibility: "hidden" }}>{children}</div>
      </QueryClientProvider>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
