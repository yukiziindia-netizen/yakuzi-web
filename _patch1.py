import io

p = 'apps/admin/api/seo.api.ts'
s = io.open(p, encoding='utf8').read()
old = '''export async function updateSeoProductSlug(id: string, slug: string): Promise<{ id: string; slug: string }> {
  const { data } = await apiClient.patch<{ data: { id: string; slug: string } }>(
    `/admin/seo/product-slug/${id}`,
    { slug }
  );
  return data.data;
}'''
new = '''export async function updateSeoProductSlug(id: string, slug: string, createRedirect = true): Promise<{ id: string; slug: string }> {
  const { data } = await apiClient.patch<{ data: { id: string; slug: string } }>(
    `/admin/seo/product-slug/${id}`,
    { slug, createRedirect }
  );
  return data.data;
}'''
assert old in s
s = s.replace(old, new, 1)
io.open(p, 'w', encoding='utf8', newline='').write(s)
print('api ok')

p = 'apps/admin/hooks/useSeo.ts'
s = io.open(p, encoding='utf8').read()
old = '''    mutationFn: ({ id, slug }: { id: string; slug: string }) => updateSeoProductSlug(id, slug),'''
new = '''    mutationFn: ({ id, slug, createRedirect }: { id: string; slug: string; createRedirect?: boolean }) =>
      updateSeoProductSlug(id, slug, createRedirect),'''
assert old in s
s = s.replace(old, new, 1)
io.open(p, 'w', encoding='utf8', newline='').write(s)
print('hook ok')

p = 'apps/admin/components/seo/meta-editor.tsx'
s = io.open(p, encoding='utf8').read()
old = '''  const [slugDraft, setSlugDraft] = useState("");'''
new = '''  const [slugDraft, setSlugDraft] = useState("");
  // 301 the old URL to the new one on slug change. Default ON - opting out
  // is for URLs that were never shared/indexed.
  const [slugRedirect, setSlugRedirect] = useState(true);'''
assert old in s
s = s.replace(old, new, 1)

old = '''        await updateSlug.mutateAsync({ id: entityId.trim(), slug: trimmedSlug });
        toast.success("Product URL updated — the old URL now redirects to the new one.");'''
new = '''        await updateSlug.mutateAsync({ id: entityId.trim(), slug: trimmedSlug, createRedirect: slugRedirect });
        toast.success(
          slugRedirect
            ? "Product URL updated — the old URL now redirects to the new one."
            : "Product URL updated — no redirect was created from the old URL.",
        );'''
assert old in s
s = s.replace(old, new, 1)

old = '''                <p className="text-xs text-muted-foreground">
                  This is the product&apos;s REAL address:'''
new = '''                {slugInfo?.slug && slugDraft.replace(/(^-|-$)+/g, "") !== slugInfo.slug && (
                  <label className="flex items-center gap-2 text-xs text-foreground cursor-pointer">
                    <input
                      type="checkbox"
                      checked={slugRedirect}
                      onChange={(e) => setSlugRedirect(e.target.checked)}
                      className="h-3.5 w-3.5 accent-primary"
                    />
                    Redirect the old URL to the new one (recommended — keeps Google results and shared links working)
                  </label>
                )}
                <p className="text-xs text-muted-foreground">
                  This is the product&apos;s REAL address:'''
assert old in s
s = s.replace(old, new, 1)

old = '''    if (!open) return;
    setTab("basic");'''
new = '''    if (!open) return;
    setTab("basic");
    setSlugRedirect(true);'''
assert old in s
s = s.replace(old, new, 1)
io.open(p, 'w', encoding='utf8', newline='').write(s)
print('meta-editor ok')
