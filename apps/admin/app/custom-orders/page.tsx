"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  MessageSquare, Search, Filter, Trash2, 
  Calendar, User, Smartphone, Mail,
  CheckCircle, Clock, XCircle, ArrowRight,
  Package, ShoppingBag
} from "lucide-react";
import { AdminLayout } from "@/components/layout/admin-layout";
import { Button, Input, Badge, Pagination } from "@/components/ui";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";
import { useCustomOrders, useUpdateCustomOrderStatus, useDeleteCustomOrder } from "@/hooks/useAdmin";

export default function CustomOrdersPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  
  const { data, isLoading } = useCustomOrders({ page, limit: 10 });
  const updateStatus = useUpdateCustomOrderStatus();
  const deleteOrder = useDeleteCustomOrder();

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      await updateStatus.mutateAsync({ id, status });
      toast.success(`Status updated to ${status}`);
    } catch {
      toast.error("Failed to update status");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this request permanently?")) return;
    try {
      await deleteOrder.mutateAsync(id);
      toast.success("Request deleted");
    } catch {
      toast.error("Failed to delete request");
    }
  };

  const customOrders = data?.data || [];
  const filteredOrders = customOrders.filter((o: any) => 
    o.message.toLowerCase().includes(search.toLowerCase()) ||
    o.buyer?.legalName?.toLowerCase().includes(search.toLowerCase())
  );

  const statusColors: any = {
    PENDING: "warning",
    REVIEWED: "info",
    COMPLETED: "success",
    CANCELLED: "error"
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="font-bold text-3xl text-foreground tracking-tight flex items-center gap-3">
              <MessageSquare className="h-8 w-8 text-primary" />
              Custom Order Requests
            </h1>
            <p className="text-sm text-muted-foreground mt-1 font-medium">Manage and respond to specialized lead requests from buyers.</p>
          </div>
          <div className="flex bg-white/5 backdrop-blur-md p-1 rounded-2xl border border-white/10">
             <div className="px-4 py-2 text-center">
               <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Total Leads</p>
               <p className="text-xl font-black text-foreground">{data?.total || 0}</p>
             </div>
             <div className="w-[1px] bg-white/10 mx-2 my-1" />
             <div className="px-4 py-2 text-center">
               <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Pending</p>
               <p className="text-xl font-black text-amber-500">{customOrders.filter((o:any) => o.status === 'PENDING').length}</p>
             </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input 
            placeholder="Search leads by message or buyer name..." 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
            className="pl-12 h-12 rounded-2xl border-white/20 bg-white/5 backdrop-blur-sm focus:ring-primary/20 transition-all font-medium" 
          />
        </div>

        {/* Main List */}
        <div className="grid grid-cols-1 gap-4">
          {isLoading ? (
            <div className="py-24 flex flex-col items-center justify-center gap-4 bg-white/5 rounded-[2rem] border border-white/10">
              <div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-muted-foreground font-bold animate-pulse">Loading buyer requests...</p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="py-32 flex flex-col items-center justify-center gap-4 bg-white/5 rounded-[2rem] border border-white/10 text-center">
              <div className="h-20 w-20 bg-muted/20 rounded-full flex items-center justify-center opacity-30">
                <ShoppingBag className="h-10 w-10 text-muted-foreground" />
              </div>
              <div>
                 <h3 className="font-bold text-xl text-foreground">No custom requests found</h3>
                 <p className="text-muted-foreground mt-1">Check back later or adjust your search.</p>
              </div>
            </div>
          ) : (
            filteredOrders.map((order: any, i: number) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="glass group p-6 rounded-[2rem] border border-white/10 hover:border-white/30 transition-all flex flex-col md:flex-row gap-6 relative overflow-hidden"
              >
                {/* Visual Accent */}
                <div className={cn(
                  "absolute left-0 top-0 w-1.5 h-full",
                  order.status === 'PENDING' ? "bg-amber-500" : 
                  order.status === 'COMPLETED' ? "bg-emerald-500" : "bg-primary"
                )} />

                {/* Left: Buyer & Meta */}
                <div className="w-full md:w-1/4 space-y-4">
                   <div className="space-y-1">
                      <h3 className="text-lg font-black text-foreground truncate">{order.buyer?.legalName || "Unknown Buyer"}</h3>
                      <div className="flex flex-wrap gap-2 pt-1">
                        <Badge variant={statusColors[order.status] || "default"} className="rounded-lg font-bold px-2 py-0.5 text-[10px]">
                           {order.status}
                        </Badge>
                        <span className="text-[10px] font-bold text-muted-foreground flex items-center gap-1">
                           <Calendar className="h-3 w-3" /> {new Date(order.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                   </div>

                   <div className="space-y-2 pt-2">
                      <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
                        <Smartphone className="h-3.5 w-3.5" /> {order.buyer?.user?.phone}
                      </div>
                      <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground truncate">
                        <Mail className="h-3.5 w-3.5" /> {order.buyer?.user?.email}
                      </div>
                   </div>
                </div>

                {/* Middle: Message & Product */}
                <div className="flex-1 space-y-4">
                   {order.product && (
                     <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 px-3 py-1.5 rounded-xl">
                        <Package className="h-4 w-4 text-primary" />
                        <span className="text-xs font-black text-primary uppercase tracking-tight">Product Interest: {order.product.name}</span>
                     </div>
                   )}
                   <div className="bg-black/5 dark:bg-white/5 p-5 rounded-2xl border border-white/5 relative group-hover:bg-black/10 transition-colors">
                      <p className="text-[15px] font-medium text-foreground/90 italic leading-relaxed whitespace-pre-wrap">
                        &quot;{order.message}&quot;
                      </p>
                   </div>
                </div>

                {/* Right: Actions */}
                <div className="flex md:flex-col justify-end gap-2 md:w-48">
                   <select 
                     value={order.status}
                     onChange={(e) => handleUpdateStatus(order.id, e.target.value)}
                     className="bg-white dark:bg-zinc-800 border border-white/20 rounded-xl px-4 py-2.5 text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all cursor-pointer hover:bg-white/80"
                   >
                      <option value="PENDING">Pending Review</option>
                      <option value="REVIEWED">Under Discussion</option>
                      <option value="COMPLETED">Fulfilled</option>
                      <option value="CANCELLED">Closed</option>
                   </select>

                   <Button 
                     variant="outline" 
                     className="rounded-xl border-red-500/20 text-red-500 hover:bg-red-500/10 h-[44px]"
                     onClick={() => handleDelete(order.id)}
                   >
                      <Trash2 className="h-4 w-4 mr-2" /> Discard Lead
                   </Button>
                </div>
              </motion.div>
            ))
          )}
        </div>

        {/* Footer */}
        {data?.totalPages > 1 && (
          <div className="flex justify-center pt-6">
            <Pagination 
              page={page} 
              totalPages={data.totalPages} 
              onPageChange={(p) => setPage(p)} 
            />
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
