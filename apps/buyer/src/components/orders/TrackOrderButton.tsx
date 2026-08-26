'use client';

import { Truck } from 'lucide-react';

/**
 * The buyer's single order-tracking affordance, used for every order
 * regardless of how it is fulfilled: it only ever looks at the order's
 * trackingUrl, so the buyer cannot tell which fulfillment mode was used.
 * Disabled with "Not shipped yet" until a tracking URL exists.
 */
export function TrackOrderButton({
  trackingUrl,
  className = '',
}: {
  trackingUrl?: string | null;
  className?: string;
}) {
  if (!trackingUrl) {
    return (
      <button
        disabled
        className={`w-full py-4 bg-gray-100 text-gray-400 rounded-2xl font-bold flex items-center justify-center gap-2 cursor-not-allowed ${className}`}
      >
        <Truck className="w-5 h-5" />
        Not shipped yet
      </button>
    );
  }

  return (
    <a
      href={trackingUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={`w-full py-4 bg-lime-300 hover:bg-lime-400 text-gray-900 rounded-2xl font-bold transition-all shadow-lg shadow-lime-200/50 flex items-center justify-center gap-2 ${className}`}
    >
      <Truck className="w-5 h-5" />
      Track order
    </a>
  );
}
