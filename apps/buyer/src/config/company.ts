/**
 * Single source of truth for the company details shown on the public policy pages.
 *
 * The Privacy Policy, Terms of Use, Shipping Policy and Return & Refund Policy
 * pages now carry the text Yukizi supplied on 6 August 2026. Values below that
 * are quoted in those documents have been set from them.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * STILL OUTSTANDING
 * ─────────────────────────────────────────────────────────────────────────────
 * The values still marked TO CONFIRM are placeholders and are rendered on the
 * customer-facing About and Contact pages, so they need the real details before
 * this is announced to customers.
 *
 * Fill them in here once and every page updates.
 */

export const COMPANY = {
  /** Trading name used throughout the site copy. */
  brandName: 'Yukizi',

  /**
   * Legal entity name as written in the supplied policy documents.
   * NOTE: the AWS account for this project is registered as "Yukizi Market
   * Services Private Limited" — one of the two is wrong and legal pages must
   * name the entity exactly as incorporated.
   */
  legalName: 'Yukizi Market Private Limited',

  /** Public website URL quoted in the policy documents. */
  websiteUrl: 'https://yukizi.com/',

  /** TO CONFIRM: full registered office address, including PIN code. */
  registeredAddress: '[Registered office address — to be provided]',

  /** TO CONFIRM: GSTIN. */
  gstin: '[GSTIN — to be provided]',

  /** TO CONFIRM: CIN from the incorporation certificate. */
  cin: '[CIN — to be provided]',

  /** TO CONFIRM: the address customers post returns to (often not the registered office). */
  returnsAddress: '[Returns address — to be provided]',

  /**
   * Support inbox published in the policy documents.
   * TO CONFIRM: this is a personal Gmail address, and the site's landing footer
   * publishes hello@yukizi.in instead. A single monitored inbox on the company
   * domain would be better on legal pages.
   */
  supportEmail: 'Yukizi.india@gmail.com',

  /** Published support phone number, confirmed by Rishi 2026-08-13. */
  supportPhone: '+91 82912 80021',

  /** Published support hours. */
  supportHours: 'Monday to Saturday, 10:00 – 18:00 IST',

  /**
   * Grievance Officer. Publishing a named officer with contact details is required
   * of Indian e-commerce intermediaries under the Consumer Protection
   * (E-Commerce) Rules, 2020 and the IT Rules, 2021.
   * TO CONFIRM: name and direct contact.
   */
  grievanceOfficer: {
    name: '[Grievance Officer name — to be provided]',
    email: 'grievance@yukizi.com',
  },

  /** TO CONFIRM: courts of which city have jurisdiction under the Terms. */
  jurisdictionCity: '[City — to be provided]',

  /** Window, in days from delivery, for raising a return or damage claim. */
  returnWindowDays: 3,

  /** Delivery window quoted in the Shipping Policy, measured from dispatch. */
  deliveryWindow: '4–7 business days',

  /**
   * Last reviewed date shown at the top of each policy page.
   * Update whenever the policy text changes.
   */
  policiesLastUpdated: '6 August 2026',
} as const;
