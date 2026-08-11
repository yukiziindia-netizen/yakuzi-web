/**
 * Generates a URL-friendly slug from a product name and ID.
 *
 * Products backfilled with a real, unique `slug` (see CatalogProduct.slug)
 * already resolve on the backend via `{ id } OR { slug }`, so pass it
 * through as-is for a clean URL (e.g. /products/testing) instead of
 * appending the raw UUID. Falls back to the old name-id form for products
 * that don't have one yet.
 */
export function generateProductSlug(name: string, id: string, slug?: string | null): string {
  if (slug) return slug;
  if (!name) return id;
  const slugifiedName = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
  return `${slugifiedName}-${id}`;
}

/**
 * Extracts the product ID from a slug
 * Assumes the ID is the part after the last hyphen and follows UUID or similar ID format
 */
export function parseProductIdFromSlug(slug: string): string {
  if (!slug) return '';
  
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (uuidRegex.test(slug)) return slug;

  const parts = slug.split('-');
  
  if (parts.length >= 5) {
    const potentialId = parts.slice(-5).join('-');
    if (uuidRegex.test(potentialId)) {
      return potentialId;
    }
  }
  
  // If no UUID is found at the end, return the full slug for backend lookup
  return slug;
}
