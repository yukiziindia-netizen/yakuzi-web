import { AdminSidebar } from "@/components/layout/sidebar";

export function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <AdminSidebar />
      <main className="lg:pl-64 transition-all duration-300 min-h-screen p-6" id="main" tabIndex={-1}>
        <div className="max-w-7xl mx-auto">{children}</div>
      </main>
    </div>
  );
}
