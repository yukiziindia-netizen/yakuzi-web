"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAdminAuth } from "@/store";
import { useAdminMe } from "@/hooks/useAdmin";
import { Loader2, ShieldAlert } from "lucide-react";

const ROUTE_PERMISSIONS: Record<string, string> = {
  "/users": "1",
  "/products": "3",
  "/categories": "3",
  "/orders": "5",
  "/payments": "7",
  "/settlements": "9",
  "/tickets": "b",
  "/suggestions": "d",
  "/product-requests": "f",
  "/marketing": "h",
  "/banners": "v",
  "/notifications": "j",
  "/referrals": "l",
  "/custom-orders": "n",
  "/analytics": "p",
  "/settings": "r",
  "/admins": "x",
};

function hasPermission(permissions: string | undefined, route: string): boolean {
  if (permissions?.includes("x")) return true; // Super admin always allowed

  const requiredPerm = Object.entries(ROUTE_PERMISSIONS).find(
    ([prefix]) => route === prefix || route.startsWith(prefix + "/")
  );

  if (!requiredPerm) return true; // No specific permission required for this route (e.g., Dashboard)
  
  return !!permissions && permissions.includes(requiredPerm[1]);
}

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const { user, isAuth, logout } = useAdminAuth();
  const { isLoading: isLoadingMe } = useAdminMe();
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  const permissions = (user as any)?.adminProfile?.permissions || (user as any)?.permissions;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    
    // Auto-logout if pending
    if (isAuth && user?.status === "PENDING" && pathname !== "/auth") {
      logout();
      router.replace("/auth");
      return;
    }

    // Redirect to auth if not authenticated and trying to access protected page
    if (!isAuth && pathname !== "/auth") {
      router.replace("/auth");
    }
    
    // Redirect to dashboard if already authenticated and trying to access auth page
    if (isAuth && pathname === "/auth") {
      router.replace("/");
    }
  }, [isAuth, user?.status, pathname, mounted, router, logout]);

  if (!mounted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Allow auth page regardless
  if (pathname === "/auth") {
    return <>{children}</>;
  }

  // If not authenticated, still show loading while redirect happens
  if (!isAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // If loading the latest profile/permissions, wait for it
  if (isLoadingMe && !(user as any)?.adminProfile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Check route-level permissions
  if (!hasPermission(permissions, pathname)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center space-y-4 p-6 glass-card max-w-sm rounded-2xl border border-destructive/20 shadow-2xl">
          <ShieldAlert className="h-12 w-12 text-destructive mx-auto animate-pulse" />
          <h2 className="text-lg font-semibold">Access Denied</h2>
          <p className="text-sm text-muted-foreground">You don&apos;t have permission to access <strong>{pathname}</strong>.</p>
          <div className="pt-2 space-y-2">
            <button onClick={() => router.replace("/dashboard")} className="text-sm text-primary underline block w-full">Go to Dashboard</button>
            <button onClick={() => { logout(); router.replace("/auth"); }} className="text-xs text-muted-foreground hover:text-foreground block w-full mt-2 transition-colors">Logout & Login again</button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
