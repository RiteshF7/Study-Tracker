
"use client";

import { useUser } from "@/firebase";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

const AUTH_ROUTES = ["/"];
const PUBLIC_ROUTES: string[] = [];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { isUserLoading, user } = useUser();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isUserLoading) return;

    const isAuthRoute = AUTH_ROUTES.includes(pathname);
    const isPublicRoute = PUBLIC_ROUTES.includes(pathname);

    if (!user && !isAuthRoute && !isPublicRoute) {
      router.push("/");
    } else if (user && isAuthRoute) {
      router.push("/home");
    }
  }, [isUserLoading, user, pathname, router]);

  if (isUserLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  // Prevent flicker of auth pages when user is logged in
  if (user && AUTH_ROUTES.includes(pathname)) {
    return (
        <div className="flex h-screen items-center justify-center">
            <p>Loading...</p>
        </div>
    );
  }

  // Prevent flicker of protected pages when user is not logged in
  if (!user && !AUTH_ROUTES.includes(pathname) && !PUBLIC_ROUTES.includes(pathname)) {
     return (
        <div className="flex h-screen items-center justify-center">
            <p>Loading...</p>
        </div>
    );
  }

  return <>{children}</>;
}
