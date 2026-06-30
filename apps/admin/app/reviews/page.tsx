"use client";
import React, { useState } from "react";
import { AdminLayout } from "@/components/layout/admin-layout";
import { useAdminReviews, useDeleteAdminReview } from "../../hooks/useAdminReviews";
import { Badge, Pagination, Button } from "@/components/ui";
import { Trash2, Star, User } from "lucide-react";
import toast from "react-hot-toast";
import { format } from "date-fns";

export default function AdminReviewsPage() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  
  const { data, isLoading } = useAdminReviews({ page, limit });
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

        <div className="bg-card border border-border shadow-sm rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs uppercase bg-muted/50 text-muted-foreground border-b border-border">
                <tr>
                  <th className="px-6 py-4 font-semibold">Reviewer</th>
                  <th className="px-6 py-4 font-semibold">Product</th>
                  <th className="px-6 py-4 font-semibold">Rating</th>
                  <th className="px-6 py-4 font-semibold">Comment</th>
                  <th className="px-6 py-4 font-semibold">Date</th>
                  <th className="px-6 py-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                        Loading reviews...
                      </div>
                    </td>
                  </tr>
                ) : reviews.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
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
