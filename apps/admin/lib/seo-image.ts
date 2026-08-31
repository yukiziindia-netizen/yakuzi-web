/**
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
