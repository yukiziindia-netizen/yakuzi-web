"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { AdminLayout } from "@/components/layout/admin-layout";
import { Select } from "@/components/ui";
import { ProductForm } from "@yukizi/product-form";
import { useSellers } from "@/hooks/useAdmin";
import { useAdminProductFormAdapter } from "@/lib/productFormAdapter";

export default function AddProductForSellerPage() {
  const router = useRouter();
  const { data: sellersData } = useSellers({ status: "APPROVED", limit: 500 });
  const sellers = Array.isArray(sellersData) ? sellersData : (sellersData?.data ?? []);

  const [sellerId, setSellerId] = useState("");
  const adapter = useAdminProductFormAdapter(sellerId, () => router.push("/products"));

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto space-y-6 pb-20">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="h-8 w-8 flex items-center justify-center rounded-lg border border-border hover:bg-accent/50 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 text-muted-foreground" />
          </button>
          <h1 className="font-semibold text-2xl text-foreground">Add item for a seller</h1>
        </div>

        <div className="glass-card rounded-2xl p-6 border border-border/50 space-y-4">
          <Select
            label="Seller"
            value={sellerId}
            onChange={(e) => setSellerId(e.target.value)}
          >
            <option value="" disabled>Select a seller</option>
            {sellers.map((s: any) => (
              <option key={s.id} value={s.id}>
                {s.sellerProfile?.companyName || s.sellerProfile?.businessName || s.phone || s.email || s.id}
              </option>
            ))}
          </Select>
        </div>

        {sellerId && <ProductForm key={sellerId} adapter={adapter} />}
      </div>
    </AdminLayout>
  );
}
