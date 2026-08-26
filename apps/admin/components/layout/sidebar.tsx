"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { LayoutDashboard, Users, Package, ClipboardList, BarChart3, Settings, LogOut, Shield, ChevronLeft, FolderTree, CreditCard, Banknote, Ticket, Bell, UserCog, FileSpreadsheet, Image, Gift, Layout, MessageSquare, PackagePlus, Bot, Layers, Tag, Star, Globe, LayoutGrid, Newspaper, Truck } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAdminAuth } from "@/store";
import { useState } from "react";

const NAV = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { icon: BarChart3, label: "Analytics", href: "/analytics" },
  { icon: Bot, label: "AI Chatbot", href: "/chatbot" },
  { icon: Users, label: "Users", href: "/users" },
  { icon: Package, label: "Products", href: "/products" },
  { icon: PackagePlus, label: "Add for Seller", href: "/products/add-for-seller" },
  { icon: FileSpreadsheet, label: "Suggestions", href: "/suggestions" },
  { icon: Tag, label: "Brands", href: "/brands" },
  { icon: Image, label: "HeroSection Image", href: "/banners" },
  { icon: Layers, label: "Categories", href: "/collections" },
  { icon: LayoutGrid, label: "Homepage Sections", href: "/homepage-sections" },
  { icon: ClipboardList, label: "Orders", href: "/orders" },
  { icon: Truck, label: "Self Ship", href: "/self-ship" },
  { icon: Layout, label: "Marketing", href: "/marketing" },
  { icon: Newspaper, label: "Blogs", href: "/blogs" },
  { icon: Globe, label: "SEO", href: "/seo" },
  { icon: Banknote, label: "Settlements", href: "/settlements" },
  { icon: Ticket, label: "Tickets", href: "/tickets" },
  { icon: Star, label: "Reviews", href: "/reviews" },
  { icon: UserCog, label: "Admins", href: "/admins" },
  { icon: Bell, label: "Notifications", href: "/notifications" },
  { icon: Settings, label: "Settings", href: "/settings" },
];


export function AdminSidebar() {
  const pathname = usePathname();
  const { user, logout } = useAdminAuth();
  const router = useRouter();
  const [open, setOpen] = useState(true);

  return (
    <aside className={cn("fixed top-0 left-0 h-full z-40 flex flex-col glass border-r border-white/30 dark:border-white/10 transition-all duration-300", open ? "w-64" : "w-20")} aria-label="Admin navigation">
      <div className="h-16 flex items-center justify-between px-4 border-b border-white/20 flex-shrink-0">
        <Link href="/dashboard" className="flex items-center gap-2.5 min-w-0">
          <div className="h-8 w-8 rounded-xl bg-primary flex items-center justify-center flex-shrink-0 shadow-sm">
            <Shield className="h-4 w-4 text-white" strokeWidth={2.5} />
          </div>
          <AnimatePresence>
            {open && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="min-w-0">
                <div className="font-semibold text-sm text-foreground">Admin Panel</div>
                <div className="text-xs text-muted-foreground">Yukizi</div>
              </motion.div>
            )}
          </AnimatePresence>
        </Link>
        <button onClick={() => setOpen(!open)} className="h-7 w-7 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-accent/60 transition-colors flex-shrink-0 fr" aria-label={open ? "Collapse" : "Expand"}>
          <motion.div animate={{ rotate: open ? 0 : 180 }} transition={{ duration: 0.2 }}><ChevronLeft className="h-4 w-4" /></motion.div>
        </button>
      </div>

      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto no-sb">
        {/* When a route is nested under another nav item's href (e.g. Add for
            Seller under Products), only the longest/most specific matching
            href should light up, not both. */}
        {(() => {
          const activeHref = NAV.reduce<string | null>((best, item) => {
            const matches = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href + "/"));
            if (!matches) return best;
            return !best || item.href.length > best.length ? item.href : best;
          }, null);

          return NAV.map(({ icon: Icon, label, href }) => {
            const active = href === activeHref;
            return (
              <Link key={href} href={href} aria-current={active ? "page" : undefined}
                className={cn("flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all fr relative overflow-hidden",
                  active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-accent/60")}>
                {active && <motion.div layoutId="admin-active" className="absolute inset-0 bg-primary/10 rounded-xl" transition={{ duration: 0.2 }} />}
                <Icon className={cn("h-4 w-4 flex-shrink-0 relative z-10", active && "text-primary")} aria-hidden />
                <AnimatePresence>
                  {open && <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="whitespace-nowrap relative z-10">{label}</motion.span>}
                </AnimatePresence>
              </Link>
            );
          });
        })()}
      </nav>

      <div className="p-2 border-t border-white/20">
        {user && open && (
          <div className="px-3 py-2 mb-1">
            <div className="text-sm font-medium text-foreground truncate">{user.name}</div>
            <div className="text-xs text-muted-foreground">Super Admin</div>
          </div>
        )}
        <button onClick={() => { logout(); router.push("/auth"); }}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium w-full text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all fr">
          <LogOut className="h-4 w-4 flex-shrink-0" aria-hidden />
          <AnimatePresence>{open && <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>Logout</motion.span>}</AnimatePresence>
        </button>
      </div>
    </aside>
  );
}
