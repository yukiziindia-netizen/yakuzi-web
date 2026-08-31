import { COMPANY } from '@/config/company';

/**
 * Support contact details, admin-editable.
 *
 * These appear on the contact and about pages, in every policy document, in
 * llms.txt and in the Organization schema — and until now they lived only in
 * config/company.ts, so changing the published support email or phone number
 * needed a developer and a deploy. Worse, the number in the constants
 * (+91 82912 80021) had already drifted from the one hardcoded in the
 * homepage footer (+91 99033 19794): two different support numbers shipped on
 * the same site.
 *
 * A blank setting means "use the built-in value", the same convention the
 * storefront SEO defaults follow, so clearing a field in admin restores the
 * fallback rather than publishing an empty contact.
 *
 * Fail-open with a short timeout, like every other settings read here: a
 * settings outage must cost the override, never the page.
 */
export interface SupportContact {
  email: string;
  phone: string;
}

const FALLBACK: SupportContact = {
  email: COMPANY.supportEmail,
  phone: COMPANY.supportPhone,
};

export async function fetchSupportContact(): Promise<SupportContact> {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, '');
  if (!base) return FALLBACK;
  try {
    const res = await Promise.race([
      fetch(`${base}/config/platform`, { next: { revalidate: 600 } }),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 2000)),
    ]);
    if (!res || !res.ok) return FALLBACK;
    const body = (await res.json().catch(() => null)) as {
      data?: Record<string, string | undefined>;
    } | null;
    const d = body?.data ?? {};
    return {
      email: d.supportEmail?.trim() || FALLBACK.email,
      phone: d.supportPhone?.trim() || FALLBACK.phone,
    };
  } catch {
    return FALLBACK;
  }
}
