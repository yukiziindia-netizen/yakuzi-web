"use client";
import React from "react";
import { ProductForm } from "@/components/products/ProductForm";
import { ErrorBoundary } from "@/components/error-boundary";

export default function AddProductPage() {
  return (
    <div className="max-w-7xl mx-auto">
      <ErrorBoundary>
        <ProductForm />
      </ErrorBoundary>
    </div>
  );
}
