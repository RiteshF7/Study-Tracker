
"use client";

import { ThemeProvider } from "@/components/theme-provider";
import { type ReactNode, useState, useEffect } from "react";
import { GlobalClickOverlay } from "@/components/ui/global-click-overlay";

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
      themes={['light', 'dark', 'peazehub', 'violet-dark', 'matrix-dark', 'disney-dark', 'cn-dark', 'sunset', 'latte']}
    >
      {children}
      <GlobalClickOverlay />
    </ThemeProvider>
  );
}
