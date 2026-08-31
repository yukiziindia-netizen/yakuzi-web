import io

# ═══ BUYER ═══

# 1. SeoOverride type gains imageAltOverrides
p = 'apps/buyer/src/lib/seo/overrides.ts'
s = io.open(p, encoding='utf8').read()
old = '  structuredDataOverride?: Record<string, unknown> | null;'
assert old in s
s = s.replace(old, old + '\n  imageAltOverrides?: Record<string, string> | null;', 1)
io.open(p, 'w', encoding='utf8', newline='').write(s)
print('overrides type ok')

# 2. alt helper
io.open('apps/buyer/src/lib/seo/image-alt.ts', 'w', encoding='utf8', newline='').write(
'''/**
 * Default alt text for product imagery: "<product name> - Yukizi", with the
 * admin's per-image override (product SEO card -> Advanced -> image ALT
 * overrides, keyed by image URL) winning when set. Gallery images beyond the
 * first get an index suffix so they stay distinguishable in image search.
 */
export function productImageAlt(
  productName?: string | null,
  override?: string | null,
  index?: number,
): string {
  if (override && override.trim()) return override.trim();
  const base = productName && productName.trim() ? `${productName.trim()} - Yukizi` : 'Yukizi';
  return index && index > 0 ? `${base} (image ${index + 1})` : base;
}
''')
print('alt helper ok')

# 3. products page passes overrides to the client
p = 'apps/buyer/src/app/products/[productSlug]/page.tsx'
s = io.open(p, encoding='utf8').read()
old = '<ProductPageClient productSlug={params.productSlug} initialProduct={product} />'
assert old in s
s = s.replace(old, '<ProductPageClient productSlug={params.productSlug} initialProduct={product} imageAltOverrides={override?.imageAltOverrides ?? undefined} />', 1)
io.open(p, 'w', encoding='utf8', newline='').write(s)
print('pdp page ok')

# 4. ProductPageClient: thread overrides + apply alts in the gallery
p = 'apps/buyer/src/app/products/[productSlug]/ProductPageClient.tsx'
s = io.open(p, encoding='utf8').read()
old = "export default function ProductPageClient({ productSlug, initialProduct }: { productSlug: string; initialProduct?: any }) {"
assert old in s
s = s.replace(old, "export default function ProductPageClient({ productSlug, initialProduct, imageAltOverrides }: { productSlug: string; initialProduct?: any; imageAltOverrides?: Record<string, string> }) {", 1)

# gallery signature + prop
old = '''  productName: string;
  productId?: string;
  productPrice?: number;
  variant?: 'mobile' | 'desktop';
}) {'''
assert old in s
s = s.replace(old, '''  productName: string;
  productId?: string;
  productPrice?: number;
  variant?: 'mobile' | 'desktop';
  altOverrides?: Record<string, string>;
}) {''', 1)
old = '''  productId = '',
  productPrice = 0,
  variant = 'mobile',
}: {'''
assert old in s
s = s.replace(old, '''  productId = '',
  productPrice = 0,
  variant = 'mobile',
  altOverrides,
}: {''', 1)

# thumbnails: first alt="" in the gallery (map over images with idx)
old = '''            <Image
              src={img}
              alt=""
              width={72}
              height={72}'''
assert old in s
s = s.replace(old, '''            <Image
              src={img}
              alt={productImageAlt(productName, altOverrides?.[img], idx)}
              width={72}
              height={72}''', 1)

# main + zoom images (both alt={productName} on activeImage)
old = '''            <Image
              src={activeImage}
              alt={productName}
              fill
              className="object-contain hover:scale-105 transition-transform duration-500"
              priority
            />'''
assert old in s
s = s.replace(old, '''            <Image
              src={activeImage}
              alt={productImageAlt(productName, altOverrides?.[activeImage], activeImageIndex % images.length)}
              fill
              className="object-contain hover:scale-105 transition-transform duration-500"
              priority
            />''', 1)
old = '''              <Image
                src={activeImage}
                alt={productName}
                fill
                className="object-contain"
                sizes="100vw"
              />'''
assert old in s
s = s.replace(old, '''              <Image
                src={activeImage}
                alt={productImageAlt(productName, altOverrides?.[activeImage], activeImageIndex % images.length)}
                fill
                className="object-contain"
                sizes="100vw"
              />''', 1)

# both call sites get the prop (mobile + desktop trees)
n = s.count('<ProductBannerCard')
assert n == 2, n
s = s.replace('<ProductBannerCard', '<ProductBannerCard altOverrides={imageAltOverrides}')
# import
first_import_anchor = "import Image from 'next/image';"
if first_import_anchor in s:
    s = s.replace(first_import_anchor, first_import_anchor + "\nimport { productImageAlt } from '@/lib/seo/image-alt';", 1)
else:
    s = "import { productImageAlt } from '@/lib/seo/image-alt';\n" + s
io.open(p, 'w', encoding='utf8', newline='').write(s)
print('pdp client ok')

# 5. Grid card + navbar popup + hero fallback
p = 'apps/buyer/src/components/landing/ProductCarousel.tsx'
s = io.open(p, encoding='utf8').read()
old = '<Image src={imageUrl} alt={productName}'
assert old in s
s = s.replace(old, '<Image src={imageUrl} alt={`${productName} - Yukizi`}', 1)
io.open(p, 'w', encoding='utf8', newline='').write(s)
print('grid ok')

p = 'apps/buyer/src/components/landing/Navbar.tsx'
s = io.open(p, encoding='utf8').read()
old = '''                                <img
                                  src={p.image || 'https://placehold.co/96x96/f3f4f6/9ca3af?text=%20'}
                                  alt=""'''
assert old in s
s = s.replace(old, '''                                <img
                                  src={p.image || 'https://placehold.co/96x96/f3f4f6/9ca3af?text=%20'}
                                  alt={`${p.name ?? ''} - Yukizi`}''', 1)
io.open(p, 'w', encoding='utf8', newline='').write(s)
print('navbar ok')

p = 'apps/buyer/src/components/landing/HeroSection.tsx'
s = io.open(p, encoding='utf8').read()
s = s.replace('alt="Featured"', 'alt="Yukizi - featured collection"', 1)
s = s.replace("alt={banner?.title || 'Featured'}", "alt={banner?.title || 'Yukizi - featured banner'}", 1)
io.open(p, 'w', encoding='utf8', newline='').write(s)
print('hero ok')

# ═══ ADMIN ═══

# 6. rename helper
io.open('apps/admin/lib/seo-image.ts', 'w', encoding='utf8', newline='').write(
'''/**
 * SEO-friendly upload names: "<product-name-slug>-yukizi-<rand>.<ext>".
 * The storage API keys objects by the client-sent filename (sanitized), so
 * renaming the File before upload is all it takes. No hint -> file unchanged.
 */
export function seoRenameFile(file: File, hint?: string): File {
  const clean = hint?.trim();
  if (!clean) return file;
  const dot = file.name.lastIndexOf(".");
  const ext = dot > -1 ? file.name.slice(dot).toLowerCase() : "";
  const slug = clean
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
    .slice(0, 60);
  if (!slug) return file;
  const rand = Math.random().toString(36).slice(2, 6);
  return new File([file], `${slug}-yukizi-${rand}${ext}`, { type: file.type });
}
''')
print('rename helper ok')

# 7. media-uploader: filenameHint prop
p = 'apps/admin/components/ui/media-uploader.tsx'
s = io.open(p, encoding='utf8').read()
old = 'import { uploadProductMedia } from "@/api/admin.api";'
assert old in s
s = s.replace(old, old + '\nimport { seoRenameFile } from "@/lib/seo-image";', 1)
old = 'const url = await uploadProductMedia(file);'
assert old in s
s = s.replace(old, 'const url = await uploadProductMedia(seoRenameFile(file, filenameHint));', 1)
# add the prop to the component signature: find "onChange" prop pattern
import re
m = re.search(r'export function MediaUploader\(\{([^}]*)\}: \{', s)
assert m, 'MediaUploader signature'
s = s.replace(m.group(0), m.group(0).replace('{' + m.group(1) + '}', '{' + m.group(1).rstrip() + ', filenameHint }'), 1)
m2 = re.search(r'export function MediaUploader\(\{[^}]*\}: \{([^}]*)\}', s)
s = s.replace('}: {' + m2.group(1) + '}', '}: {' + m2.group(1).rstrip() + '\n  /** Slugified into the stored filename: "<hint>-yukizi-<rand>.<ext>". */\n  filenameHint?: string;\n}', 1)
io.open(p, 'w', encoding='utf8', newline='').write(s)
print('media-uploader ok')

# 8. hosts pass form.title
p = 'apps/admin/app/products/add/page.tsx'
s = io.open(p, encoding='utf8').read()
old = '<MediaUploader items={mediaItems} onChange={setMediaItems} />'
assert old in s
s = s.replace(old, '<MediaUploader items={mediaItems} onChange={setMediaItems} filenameHint={form.title} />', 1)
io.open(p, 'w', encoding='utf8', newline='').write(s)
p = 'apps/admin/components/suggestions/suggestion-form.tsx'
s = io.open(p, encoding='utf8').read()
old = '<MediaUploader items={mediaItems} onChange={setMediaItems} />'
assert old in s
s = s.replace(old, '<MediaUploader items={mediaItems} onChange={setMediaItems} filenameHint={form.title} />', 1)
io.open(p, 'w', encoding='utf8', newline='').write(s)
print('hosts ok')

# 9. blog images: title-based names
p = 'apps/admin/api/blogs.api.ts'
s = io.open(p, encoding='utf8').read()
old = '''export async function uploadBlogImage(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);'''
assert old in s
s = s.replace(old, '''export async function uploadBlogImage(file: File, nameHint?: string): Promise<string> {
  const formData = new FormData();
  formData.append("file", seoRenameFile(file, nameHint));''', 1)
s = s.replace('import { apiClient }', 'import { seoRenameFile } from "@/lib/seo-image";\nimport { apiClient }', 1) if 'import { apiClient }' in s else s
if 'seo-image' not in s:
    import re
    m = re.search(r'^import .*?;', s, re.M)
    s = s.replace(m.group(0), m.group(0) + '\nimport { seoRenameFile } from "@/lib/seo-image";', 1)
io.open(p, 'w', encoding='utf8', newline='').write(s)
p = 'apps/admin/components/blogs/blog-post-form.tsx'
s = io.open(p, encoding='utf8').read()
old = 'const url = await uploadBlogImage(file);'
assert old in s
s = s.replace(old, 'const url = await uploadBlogImage(file, title);', 1)
old = 'onUploadImage={uploadBlogImage}'
assert old in s
s = s.replace(old, 'onUploadImage={(f) => uploadBlogImage(f, title)}', 1)
io.open(p, 'w', encoding='utf8', newline='').write(s)
print('blogs ok')
