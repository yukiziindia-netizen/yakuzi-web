/**
 * Single source of truth for the company details shown on the public policy pages.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ACTION REQUIRED BEFORE THESE PAGES GO PUBLIC
 * ─────────────────────────────────────────────────────────────────────────────
 * Every value marked TO CONFIRM below is a placeholder. They are rendered on
 * customer-facing legal pages, so they must be replaced with the real details
 * (and the policy text reviewed by whoever handles Yukizi's legal/compliance)
 * before this is announced to customers.
 *
 * Fill them in here once and all six pages update.
 */

export const COMPANY = {
  /** Trading name used throughout the site copy. */
  brandName: 'Yukizi',

  /** TO CONFIRM: full registered legal entity name as on the incorporation certificate. */
  legalName: 'Yukizi Market Services Private Limited',

  /** TO CONFIRM: full registered office address, including PIN code. */
  registeredAddress: '[Registered office address — to be provided]',

  /** TO CONFIRM: GSTIN. */
  gstin: '[GSTIN — to be provided]',

  /** TO CONFIRM: CIN from the incorporation certificate. */
  cin: '[CIN — to be provided]',

  /** TO CONFIRM: the address customers post returns to (often not the registered office). */
  returnsAddress: '[Returns address — to be provided]',

  /** TO CONFIRM: monitored support inbox. */
  supportEmail: 'support@yukizi.com',

  /** TO CONFIRM: published support phone number. */
  supportPhone: '[Support phone number — to be provided]',

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
  returnWindowDays: 7,

  /** Working days to process a refund once a return is approved. */
  refundProcessingDays: '5–7 business days',

  /** Typical delivery window quoted on the shipping page. */
  deliveryWindow: '3–7 business days',

  /**
   * Last reviewed date shown at the top of each policy page.
   * Update whenever the policy text changes.
   */
  policiesLastUpdated: '6 August 2026',
} as const;
