'use client';

import { Component, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, RefreshCw } from 'lucide-react';

/**
 * Keeps a failed product grid from taking down the page around it.
 *
 * The storefront grids throw when the products API fails, so that an outage
 * surfaces as an error rather than a 200 "empty shop" soft-404. Without a
 * boundary of their own that throw travels to app/error.tsx, which is the
 * ROUTE boundary — so a products blip replaced the navbar, the hero, the
 * category rows, the FAQ and the footer with a single "Something went wrong"
 * card. The shopper lost the whole site over one section.
 *
 * Catching here keeps everything that rendered fine, and confines the failure
 * to the strip the products were meant to fill.
 *
 * A Server Component that throws while streaming is delivered to the nearest
 * error boundary in the client tree — the same mechanism error.tsx uses — so
 * this has to be a client class component.
 */

function ProductsUnavailable() {
  const router = useRouter();
  return (
    <div className="flex min-h-[300px] flex-col items-center justify-center gap-3 px-4 py-10 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
        <AlertCircle className="h-6 w-6 text-red-500" />
      </div>
      <p className="text-base font-semibold text-gray-900">Products couldn&apos;t be loaded</p>
      <p className="max-w-sm text-sm text-gray-500">
        This section didn&apos;t load just now. The rest of the page is fine — try again in a moment.
      </p>
      <button
        type="button"
        // router.refresh() re-runs the server render, which is what has to
        // happen: the failure is on the server side of this boundary, so
        // re-rendering the client tree alone would show the same thing.
        onClick={() => router.refresh()}
        className="mt-1 inline-flex items-center gap-2 rounded-xl bg-gray-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-800"
      >
        <RefreshCw className="h-4 w-4" />
        Try again
      </button>
    </div>
  );
}

export default class ProductSectionBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.error('[Yukizi] Product section failed to render:', error);
  }

  render() {
    return this.state.hasError ? <ProductsUnavailable /> : this.props.children;
  }
}
