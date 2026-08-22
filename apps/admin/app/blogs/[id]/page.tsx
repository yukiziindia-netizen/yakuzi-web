"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { AdminLayout } from "@/components/layout/admin-layout";
import { Skeleton } from "@/components/ui";
import { BlogPostForm } from "@/components/blogs/blog-post-form";
import { useAdminBlogPost } from "@/hooks/useBlogs";

export default function EditBlogPostPage() {
  const params = useParams();
  const id = params?.id as string;
  const { data: post, isLoading } = useAdminBlogPost(id);

  return (
    <AdminLayout>
      <div className="space-y-5">
        <Link href="/blogs" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to blogs
        </Link>
        <h1 className="text-2xl font-semibold text-foreground">Edit post</h1>
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        ) : post ? (
          <BlogPostForm post={post} />
        ) : (
          <p className="text-sm text-muted-foreground">Post not found.</p>
        )}
      </div>
    </AdminLayout>
  );
}
