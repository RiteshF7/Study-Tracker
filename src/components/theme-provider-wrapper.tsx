
"use client";

import { ThemeProvider } from "@/components/theme-provider";
import { type ReactNode, useState, useEffect } from "react";

export function ThemeProviderWrapper({ children }: { children: ReactNode }) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    // Return children directly on the server to avoid hydration mismatch
    return <>{children}</>;
  }

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="peazehub"
      disableTransitionOnChange
      themes={['light', 'dark', 'peazehub', 'violet-dark', 'matrix-dark', 'disney-dark', 'cn-dark']}
    >
      {children}
    </ThemeProvider>
  );
}
