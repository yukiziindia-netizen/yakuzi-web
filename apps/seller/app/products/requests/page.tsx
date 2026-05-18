"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { PackagePlus, Send, Clock, CheckCircle2, XCircle } from "lucide-react";
import { Button, Badge, Input, Textarea } from "@/components/ui";
import { formatDate } from "@pharmabag/utils";
import { useProductRequests, useCreateProductRequest } from "@/hooks/useSeller";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";

export default function ProductRequestsPage() {
  const [productName, setProductName] = useState("");
  const [manufacturer, setManufacturer] = useState("");
  const [description, setDescription] = useState("");

  const { data: requestsRaw, isLoading } = useProductRequests();
  const { mutate: createRequest, isPending } = useCreateProductRequest();

  const requests: any[] = Array.isArray(requestsRaw) ? requestsRaw : (requestsRaw?.requests ?? []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!productName.trim()) { toast.error("Product name is required"); return; }

    createRequest(
      { productName: productName.trim(), manufacturer: manufacturer.trim() || undefined, description: description.trim() || undefined },
      {
        onSuccess: () => {
          toast.success("Product request submitted!");
          setProductName("");
          setManufacturer("");
          setDescription("");
        },
        onError: (err: any) => toast.error(err?.response?.data?.message || "Failed to submit request"),
      }
    );
  };

  const statusMap: Record<string, { label: string; variant: "warning" | "success" | "error" | "info" }> = {
    PENDING: { label: "Pending", variant: "warning" },
    APPROVED: { label: "Approved", variant: "success" },
    REJECTED: { label: "Rejected", variant: "error" },
    ADDED: { label: "Product Added", variant: "info" },
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-semibold text-foreground flex items-center gap-3">
          <PackagePlus className="h-6 w-6 text-primary" /> Product Requests
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Request products that are not available in our catalog
        </p>
      </motion.div>

      {/* Request Form */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card rounded-2xl p-6">
        <h2 className="font-semibold text-foreground mb-4">Request a New Product</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Product Name" placeholder="Enter product name" value={productName} onChange={(e) => setProductName(e.target.value)} required />
            <Input label="Manufacturer" placeholder="Manufacturer / Company (optional)" value={manufacturer} onChange={(e) => setManufacturer(e.target.value)} />
          </div>
          <Textarea label="Additional Details" placeholder="Describe the product, strength, packaging details, etc. (optional)" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
          <div className="flex justify-end">
            <Button type="submit" loading={isPending} leftIcon={<Send className="h-3.5 w-3.5" />}>
              Submit Request
            </Button>
          </div>
        </form>
      </motion.div>

      {/* Request History */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <h2 className="font-semibold text-foreground mb-4">Your Requests</h2>
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground">Loading requests...</div>
        ) : requests.length === 0 ? (
          <div className="text-center py-12 glass-card rounded-2xl">
            <PackagePlus className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground">No product requests yet</p>
          </div>
        ) : (
          <div className="glass-card rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full" aria-label="Product requests">
                <thead>
                  <tr className="border-b border-border/50 bg-muted/20">
                    {["Product", "Manufacturer", "Status", "Date"].map((h) => (
                      <th key={h} scope="col" className="px-5 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {requests.map((req, i) => {
                    const st = statusMap[req.status?.toUpperCase()] ?? statusMap.PENDING;
                    return (
                      <motion.tr key={req.id ?? req._id ?? i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }} className="hover:bg-accent/30 transition-colors">
                        <td className="px-5 py-4">
                          <p className="text-sm font-medium text-foreground">{req.productName || req.name}</p>
                          {req.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{req.description}</p>}
                        </td>
                        <td className="px-5 py-4 text-sm text-muted-foreground">{req.manufacturer || "—"}</td>
                        <td className="px-5 py-4"><Badge variant={st.variant}>{st.label}</Badge></td>
                        <td className="px-5 py-4 text-sm text-muted-foreground">{formatDate(req.createdAt)}</td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
