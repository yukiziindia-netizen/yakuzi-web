"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Image as ImageIcon, Plus, Sparkles } from "lucide-react";
import { Button, Input, Select, Textarea } from "@/components/ui";
import { ChipsInput } from "@/components/seo/chips-input";
import { CharCounter, SerpPreview, OgPreview } from "@/components/seo/serp-preview";
import { MetaEditor } from "@/components/seo/meta-editor";
import { useSeoMetaOne } from "@/hooks/useSeo";
import { RichTextEditor } from "./rich-text-editor";
import { SelectWithCreate } from "./select-with-create";
import { uploadBlogImage } from "@/api/blogs.api";
import {
  useBlogAuthors, useCreateBlogAuthor, useAdminBlogCategories as useCategories, useCreateBlogCategory,
  useCreateBlogPost, useUpdateBlogPost,
} from "@/hooks/useBlogs";
import type { BlogPost } from "@/api/blogs.api";

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function BlogPostForm({ post }: { post?: BlogPost }) {
  const router = useRouter();
  const isEdit = !!post;

  const { data: authors } = useBlogAuthors();
  const { data: categories } = useCategories();
  const createAuthor = useCreateBlogAuthor();
  const createCategory = useCreateBlogCategory();
  const createPost = useCreateBlogPost();
  const updatePost = useUpdateBlogPost();

  const [title, setTitle] = useState(post?.title ?? "");
  const [slug, setSlug] = useState(post?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(isEdit);
  // 301 the old URL to the new one when an existing post's slug changes.
  const [redirectOldUrl, setRedirectOldUrl] = useState(true);
  const [excerpt, setExcerpt] = useState(post?.excerpt ?? "");
  const [content, setContent] = useState(post?.content ?? "");
  const [featuredImage, setFeaturedImage] = useState(post?.featuredImage ?? "");
  const [authorId, setAuthorId] = useState(post?.authorId ?? "");
  const [categoryId, setCategoryId] = useState(post?.categoryId ?? "");
  const [tags, setTags] = useState<string[]>(post?.tags ?? []);
  const [status, setStatus] = useState<"DRAFT" | "PUBLISHED">(post?.status ?? "DRAFT");

  const [metaTitle, setMetaTitle] = useState(post?.metaTitle ?? "");
  const [metaDescription, setMetaDescription] = useState(post?.metaDescription ?? "");
  const [metaKeywords, setMetaKeywords] = useState<string[]>(post?.metaKeywords ?? []);
  const [canonicalUrl, setCanonicalUrl] = useState(post?.canonicalUrl ?? "");
  const [ogImage, setOgImage] = useState(post?.ogImage ?? "");

  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [showAdvancedSeo, setShowAdvancedSeo] = useState(false);
  // Fetch any existing override so opening this doesn't wipe a previously-saved
  // AI summary/FAQ/keywords with a blank form (MetaEditor only pre-fills from `record`).
  const { data: existingSeoMeta, isLoading: seoMetaLoading } = useSeoMetaOne(showAdvancedSeo ? "BLOG_POST" : undefined, post?.id);

  // Default to the first available author once loaded, for a fresh post.
  useEffect(() => {
    if (!isEdit && !authorId && authors && authors.length > 0) setAuthorId(authors[0].id);
  }, [authors, authorId, isEdit]);

  useEffect(() => {
    if (!slugTouched) setSlug(slugify(title));
  }, [title, slugTouched]);

  const handleFeaturedImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadBlogImage(file);
      setFeaturedImage(url);
    } catch {
      toast.error("Image upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const validate = (): string | null => {
    if (!title.trim()) return "Title is required.";
    if (!authorId) return "Pick or create an author.";
    if (!categoryId) return "Pick or create a category.";
    if (!content || content === "<p></p>") return "Write some content before saving.";
    return null;
  };

  const buildPayload = () => ({
    title: title.trim(),
    slug: slug.trim() || undefined,
    excerpt: excerpt.trim() || undefined,
    content,
    featuredImage: featuredImage || undefined,
    authorId,
    categoryId,
    tags,
    status,
    metaTitle: metaTitle.trim() || undefined,
    metaDescription: metaDescription.trim() || undefined,
    metaKeywords,
    canonicalUrl: canonicalUrl.trim() || undefined,
    ogImage: ogImage.trim() || undefined,
  });

  const handleSave = async (nextStatus?: "DRAFT" | "PUBLISHED") => {
    const err = validate();
    if (err) { toast.error(err); return; }
    const payload = { ...buildPayload(), status: nextStatus ?? status };
    try {
      if (isEdit && post) {
        // createRedirect only exists on the update DTO (the API strips it
        // before persisting) — never send it on create.
        const slugChanged = !!payload.slug && payload.slug !== post.slug;
        await updatePost.mutateAsync({
          id: post.id,
          payload: slugChanged ? { ...payload, createRedirect: redirectOldUrl } : payload,
        });
        toast.success("Post updated.");
      } else {
        const created = await createPost.mutateAsync(payload);
        toast.success(nextStatus === "PUBLISHED" ? "Post published." : "Draft saved.");
        router.push(`/blogs/${created.id}`);
        return;
      }
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? "Could not save the post.");
    }
  };

  const saving = createPost.isPending || updatePost.isPending;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <div className="glass-card rounded-2xl p-5 space-y-4">
          <Input label="Title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Best Demon Slayer Figures in India (2026 Guide)" autoFocus />
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-foreground">URL slug</label>
              {slugTouched && (
                <button type="button" className="text-xs text-primary hover:underline" onClick={() => { setSlugTouched(false); setSlug(slugify(title)); }}>
                  Regenerate from title
                </button>
              )}
            </div>
            <Input
              value={slug}
              onChange={(e) => { setSlugTouched(true); setSlug(slugify(e.target.value)); }}
              placeholder="best-demon-slayer-figures-india"
            />
            <p className="text-xs text-muted-foreground">yukizi.com/blogs/{slug || "…"}</p>
            {isEdit && post && slug && slug !== post.slug && (
              <label className="flex items-center gap-2 text-xs text-foreground cursor-pointer">
                <input
                  type="checkbox"
                  checked={redirectOldUrl}
                  onChange={(e) => setRedirectOldUrl(e.target.checked)}
                  className="h-3.5 w-3.5 accent-primary"
                />
                Redirect the old URL to the new one (recommended — keeps Google results and shared links working)
              </label>
            )}
          </div>
          <Textarea label="Excerpt" rows={2} maxLength={500} value={excerpt} onChange={(e) => setExcerpt(e.target.value)} placeholder="Short summary shown on the blog list page." />
        </div>

        <div className="glass-card rounded-2xl p-5 space-y-2">
          <label className="block text-sm font-medium text-foreground">Content</label>
          <RichTextEditor value={content} onChange={setContent} onUploadImage={uploadBlogImage} />
        </div>

        <div className="glass-card rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">SEO</h3>
            {isEdit ? (
              <Button type="button" variant="outline" size="sm" leftIcon={<Sparkles className="h-3.5 w-3.5" />} onClick={() => setShowAdvancedSeo(true)}>
                Advanced SEO (AI summary, FAQ, keywords)
              </Button>
            ) : (
              <span className="text-xs text-muted-foreground">
                FAQ, keywords &amp; advanced SEO unlock after the first save (they attach to the saved post).
              </span>
            )}
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-foreground">SEO title</label>
              <CharCounter value={metaTitle} max={60} />
            </div>
            <Input maxLength={60} placeholder={title || "Falls back to the post title"} value={metaTitle} onChange={(e) => setMetaTitle(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-foreground">Meta description</label>
              <CharCounter value={metaDescription} max={160} />
            </div>
            <Textarea maxLength={160} rows={3} placeholder={excerpt || "Falls back to the excerpt"} value={metaDescription} onChange={(e) => setMetaDescription(e.target.value)} />
          </div>
          <ChipsInput label="Meta keywords" values={metaKeywords} onChange={setMetaKeywords} placeholder="Type and press Enter" />
          <Input label="Canonical URL" placeholder={`https://yukizi.com/blogs/${slug || "…"}`} value={canonicalUrl} onChange={(e) => setCanonicalUrl(e.target.value)} />
          <Input label="OG image URL (1200×630)" placeholder="Falls back to the featured image" value={ogImage} onChange={(e) => setOgImage(e.target.value)} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <SerpPreview title={metaTitle || title} description={metaDescription || excerpt} path={`/blogs/${slug || ""}`} />
            <OgPreview title={metaTitle || title} description={metaDescription || excerpt} imageUrl={ogImage || featuredImage} path={`/blogs/${slug || ""}`} />
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="glass-card rounded-2xl p-5 space-y-4">
          <Select label="Status" value={status} onChange={(e) => setStatus(e.target.value as "DRAFT" | "PUBLISHED")}>
            <option value="DRAFT">Draft</option>
            <option value="PUBLISHED">Published</option>
          </Select>

          <SelectWithCreate
            label="Category"
            options={(categories ?? []).map((c) => ({ id: c.id, name: c.name }))}
            value={categoryId}
            onChange={setCategoryId}
            onCreate={(name) => createCategory.mutateAsync({ name })}
          />

          <SelectWithCreate
            label="Author"
            options={(authors ?? []).map((a) => ({ id: a.id, name: a.name }))}
            value={authorId}
            onChange={setAuthorId}
            onCreate={(name) => createAuthor.mutateAsync({ name })}
          />

          <ChipsInput label="Tags" values={tags} onChange={setTags} placeholder="Type and press Enter" />
        </div>

        <div className="glass-card rounded-2xl p-5 space-y-3">
          <label className="block text-sm font-medium text-foreground">Featured image</label>
          <input ref={fileRef} type="file" accept="image/*" onChange={handleFeaturedImage} className="hidden" />
          {featuredImage ? (
            <div className="relative aspect-video w-full rounded-xl overflow-hidden group bg-muted border border-border">
              <img src={featuredImage} alt="Featured" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Button type="button" variant="ghost" className="text-white hover:bg-white/20" loading={uploading} onClick={() => fileRef.current?.click()}>
                  Change image
                </Button>
              </div>
            </div>
          ) : (
            <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
              className="w-full aspect-video border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center gap-2 hover:bg-muted/50 hover:border-primary/50 transition-colors">
              {uploading ? <span className="text-sm text-muted-foreground">Uploading…</span> : (
                <>
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary"><Plus className="h-5 w-5" /></div>
                  <div className="text-sm font-medium text-foreground">Upload image</div>
                  <ImageIcon className="h-4 w-4 text-muted-foreground/50" />
                </>
              )}
            </button>
          )}
        </div>

        <div className="glass-card rounded-2xl p-5 space-y-2">
          <Button type="button" className="w-full" loading={saving} onClick={() => handleSave("PUBLISHED")}>
            {status === "PUBLISHED" && isEdit ? "Save changes" : "Publish"}
          </Button>
          <Button type="button" variant="outline" className="w-full" loading={saving} onClick={() => handleSave("DRAFT")}>
            Save as draft
          </Button>
        </div>
      </div>

      {isEdit && post && (
        <MetaEditor
          open={showAdvancedSeo && !seoMetaLoading}
          onClose={() => setShowAdvancedSeo(false)}
          record={existingSeoMeta ?? null}
          presetType="BLOG_POST"
          presetId={post.id}
        />
      )}
    </div>
  );
}
