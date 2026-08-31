"use client";
import React, { useState } from "react";
import { AdminLayout } from "@/components/layout/admin-layout";
import { useAdminReviews, useDeleteAdminReview } from "../../hooks/useAdminReviews";
import { useAdminSellers, useCategories } from "@/hooks/useAdmin";
import { Badge, Pagination, Button } from "@/components/ui";
import { Trash2, Star, User, X } from "lucide-react";
import toast from "react-hot-toast";
import { format } from "date-fns";

export default function AdminReviewsPage() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  
  // Filters. A product can be sold by several sellers, so the seller filter
  // resolves through the review's purchased listing (handled server-side) —
  // it never attributes a rival's review to the wrong seller.
  const [filters, setFilters] = useState<{
    sellerId?: string; productId?: string; userId?: string; categoryId?: string;
    dateFrom?: string; dateTo?: string; rating?: number; search?: string;
  }>({});
  const setFilter = (key: string, value: string) => {
    setPage(1);
    setFilters((f) => {
      const next = { ...f } as Record<string, unknown>;
      if (!value) delete next[key];
      else next[key] = key === "rating" ? Number(value) : value;
      return next as typeof f;
    });
  };
  const activeFilterCount = Object.keys(filters).length;

  const { data: sellersData } = useAdminSellers();
  const { data: categoriesData } = useCategories();
  const sellers: any[] = Array.isArray(sellersData) ? sellersData : (sellersData?.data ?? []);
  const categories: any[] = Array.isArray(categoriesData) ? categoriesData : (categoriesData?.data ?? []);

  const { data, isLoading } = useAdminReviews({ page, limit, ...filters });
  const { mutate: deleteReview, isPending: isDeleting } = useDeleteAdminReview();

  const reviews = data?.data || [];
  const total = data?.total || 0;
  const totalPages = data?.totalPages || 1;

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this review? This action cannot be undone and will recalculate the seller's rating.")) {
      deleteReview(id, {
        onSuccess: () => toast.success("Review deleted successfully"),
        onError: (err: any) => toast.error(err.message || "Failed to delete review")
      });
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="font-semibold text-2xl text-foreground">Reviews & Ratings</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Manage product and seller reviews</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-card border border-border shadow-sm rounded-xl p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <input value={filters.search ?? ""} onChange={(e) => setFilter("search", e.target.value)}
              placeholder="Search comment or product…" aria-label="Search reviews"
              className="h-9 rounded-lg border border-border bg-background px-3 text-sm" />
            <select value={filters.sellerId ?? ""} onChange={(e) => setFilter("sellerId", e.target.value)}
              aria-label="Filter by seller" className="h-9 rounded-lg border border-border bg-background px-3 text-sm">
              <option value="">All sellers</option>
              {sellers.map((sl: any) => (
                <option key={sl.sellerProfile?.id ?? sl.id} value={sl.sellerProfile?.id ?? sl.id}>
                  {sl.sellerProfile?.companyName ?? sl.companyName ?? sl.name ?? "Seller"}
                </option>
              ))}
            </select>
            <select value={filters.categoryId ?? ""} onChange={(e) => setFilter("categoryId", e.target.value)}
              aria-label="Filter by category" className="h-9 rounded-lg border border-border bg-background px-3 text-sm">
              <option value="">All categories</option>
              {categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <select value={filters.rating != null ? String(filters.rating) : ""} onChange={(e) => setFilter("rating", e.target.value)}
              aria-label="Filter by rating" className="h-9 rounded-lg border border-border bg-background px-3 text-sm">
              <option value="">Any rating</option>
              {[5, 4, 3, 2, 1].map((r) => <option key={r} value={r}>{r} star{r > 1 ? "s" : ""}</option>)}
            </select>
            <input type="date" value={filters.dateFrom ?? ""} onChange={(e) => setFilter("dateFrom", e.target.value)}
              aria-label="From date" className="h-9 rounded-lg border border-border bg-background px-3 text-sm" />
            <input type="date" value={filters.dateTo ?? ""} onChange={(e) => setFilter("dateTo", e.target.value)}
              aria-label="To date" className="h-9 rounded-lg border border-border bg-background px-3 text-sm" />
            <input value={filters.productId ?? ""} onChange={(e) => setFilter("productId", e.target.value)}
              placeholder="Product id (optional)" aria-label="Filter by product id"
              className="h-9 rounded-lg border border-border bg-background px-3 text-sm" />
            <input value={filters.userId ?? ""} onChange={(e) => setFilter("userId", e.target.value)}
              placeholder="Customer id (optional)" aria-label="Filter by customer id"
              className="h-9 rounded-lg border border-border bg-background px-3 text-sm" />
          </div>
          {activeFilterCount > 0 && (
            <button onClick={() => { setFilters({}); setPage(1); }}
              className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline">
              <X className="h-3 w-3" /> Clear {activeFilterCount} filter{activeFilterCount > 1 ? "s" : ""}
            </button>
          )}
        </div>

        <div className="bg-card border border-border shadow-sm rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs uppercase bg-muted/50 text-muted-foreground border-b border-border">
                <tr>
                  <th className="px-6 py-4 font-semibold">Reviewer</th>
                  <th className="px-6 py-4 font-semibold">Product</th>
                  <th className="px-6 py-4 font-semibold">Seller</th>
                  <th className="px-6 py-4 font-semibold">Rating</th>
                  <th className="px-6 py-4 font-semibold">Comment</th>
                  <th className="px-6 py-4 font-semibold">Date</th>
                  <th className="px-6 py-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-muted-foreground">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                        Loading reviews...
                      </div>
                    </td>
                  </tr>
                ) : reviews.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-muted-foreground">
                      No reviews found.
                    </td>
                  </tr>
                ) : (
                  reviews.map((review: any) => (
                    <tr key={review.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-semibold text-foreground flex items-center gap-1.5">
                            <User className="h-3 w-3" />
                            {review.userName}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-medium text-foreground">{review.productName}</span>
                        {review.categoryName && (
                          <span className="block text-xs text-muted-foreground">{review.categoryName}</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        {review.sellerName ?? "—"}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1 text-[#b165f1]">
                          <Star className="h-4 w-4 fill-current" />
                          <span className="font-bold text-foreground ml-1">{review.rating?.toFixed(1) || '0.0'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-muted-foreground max-w-xs truncate" title={review.comment}>
                          {review.comment || <span className="italic opacity-50">No comment</span>}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground whitespace-nowrap">
                        {format(new Date(review.createdAt), "MMM d, yyyy")}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleDelete(review.id)}
                          disabled={isDeleting}
                          className="h-8 gap-1.5"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Delete
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          {!isLoading && totalPages > 1 && (
            <div className="p-4 border-t border-border bg-muted/20">
              <Pagination
                page={page}
                totalPages={totalPages}
                onPageChange={setPage}
              />
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
