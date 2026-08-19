"use client";
import React from "react";
import { useRouter } from "next/navigation";
import { ProductForm } from "@yukizi/product-form";
import { useSellerProductFormAdapter } from "@/lib/productFormAdapter";
import { ErrorBoundary } from "@/components/error-boundary";

export default function AddProductPage() {
  const router = useRouter();
  const adapter = useSellerProductFormAdapter(() => router.push("/products"));
  return (
    <div className="max-w-7xl mx-auto">
      <ErrorBoundary>
        <ProductForm adapter={adapter} />
      </ErrorBoundary>
    </div>
  );
}
