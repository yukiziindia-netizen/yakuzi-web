'use client';

import { useMemo, useState } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, X } from 'lucide-react';
import { useCategories, useCities, useManufacturers } from '@/hooks/useProducts';
import { track } from '@/lib/analytics/tracker';
import { configParamKeys } from '@/lib/filters/types';
import type { FilterConfig, FilterField, SelectOption } from '@/lib/filters/types';

/**
 * Renders whatever the page's filter config declares.
 *
 * Everything is a query param, so this component never needs to know what a
 * page does with a filter — it writes the params the config names, and the
 * page reads the ones it declared. That is what lets one drawer serve the
 * catalogue, orders, the seller list and the blog without branching.
 */

interface FilterPanelProps {
  config: FilterConfig;
  isOpen: boolean;
  onClose: () => void;
  isDesktop: boolean;
}

/** Params currently set, ignoring anything this config does not own. */
export function activeFilterCount(config: FilterConfig, params: URLSearchParams): number {
  let count = 0;
  for (const section of config.sections) {
    for (const field of section.fields) {
      switch (field.kind) {
        case 'sort': {
          // Only counts when something other than the first (default) option
          // is chosen — a default sort is not a filter the user applied.
          const [first, ...rest] = field.options;
          void first;
          if (rest.some((o) => Object.entries(o.params).every(([k, v]) => v === null ? !params.get(k) : params.get(k) === v))) {
            count += 1;
          }
          break;
        }
        case 'toggle':
          if (params.get(field.key) === 'true') count += 1;
          break;
        case 'select':
        case 'chips': {
          const v = params.get(field.key);
          if (v && v !== 'All') count += 1;
          break;
        }
        case 'range':
          if (params.get(field.minKey) || params.get(field.maxKey)) count += 1;
          break;
        case 'dateRange':
          if (params.get(field.fromKey) || params.get(field.toKey)) count += 1;
          break;
      }
    }
  }
  return count;
}

export function FilterPanel({ config, isOpen, onClose, isDesktop }: FilterPanelProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const { data: cities } = useCities();
  const { data: manufacturers } = useManufacturers();
  const { data: categories } = useCategories();

  const [open, setOpen] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(config.sections.map((s) => [s.id, true])),
  );

  const params = useMemo(() => new URLSearchParams(searchParams.toString()), [searchParams]);
  const count = activeFilterCount(config, params);

  /**
   * Write params and navigate.
   *
   * A null value deletes the param rather than writing an empty or default
   * one. The old panel always wrote minPrice and maxPrice, so touching any
   * filter pinned the ceiling at ₹10,000 and silently hid every product
   * above it.
   */
  const apply = (changes: Record<string, string | null>) => {
    const next = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(changes)) {
      if (value === null || value === '' || value === 'All') next.delete(key);
      else next.set(key, value);
    }
    const qs = next.toString();
    track('filter_use', { path: pathname, query: qs.slice(0, 300) });
    router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  const clearAll = () => {
    const next = new URLSearchParams(searchParams.toString());
    for (const key of configParamKeys(config)) next.delete(key);
    const qs = next.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  const optionsFor = (field: Extract<FilterField, { kind: 'select' }>): SelectOption[] => {
    if (field.options) return field.options;
    const toOptions = (list: unknown, labelKey = 'name'): SelectOption[] => {
      if (!Array.isArray(list)) return [];
      return list
        .map((item) => {
          if (typeof item === 'string') return { label: item, value: item };
          const rec = item as Record<string, string>;
          const label = rec[labelKey] ?? rec.name ?? rec.title;
          return label ? { label, value: rec.slug ?? label } : null;
        })
        .filter((o): o is SelectOption => !!o);
    };
    const dynamic =
      field.source === 'cities' ? toOptions(cities)
        : field.source === 'manufacturers' ? toOptions(manufacturers)
          : field.source === 'categories' ? toOptions(categories)
            : [];
    return [{ label: 'All', value: 'All' }, ...dynamic];
  };

  const renderField = (field: FilterField, key: string) => {
    switch (field.kind) {
      case 'sort': {
        const activeIndex = field.options.findIndex((o) =>
          Object.entries(o.params).every(([k, v]) => (v === null ? !params.get(k) : params.get(k) === v)),
        );
        return (
          <div key={key} className="space-y-2">
            {field.options.map((opt, i) => (
              <label key={opt.label} className="flex items-center gap-3 cursor-pointer py-1">
                <input
                  type="radio"
                  name={`${key}-sort`}
                  checked={i === (activeIndex === -1 ? 0 : activeIndex)}
                  onChange={() => apply(opt.params)}
                  className="h-4 w-4 accent-[#562996]"
                />
                <span className="text-sm text-gray-700">{opt.label}</span>
              </label>
            ))}
          </div>
        );
      }

      case 'toggle': {
        const on = params.get(field.key) === 'true';
        return (
          <label key={key} className="flex items-start gap-3 cursor-pointer py-1">
            <input
              type="checkbox"
              checked={on}
              onChange={() => apply({ [field.key]: on ? null : 'true' })}
              className="mt-0.5 h-4 w-4 rounded accent-[#562996]"
            />
            <span>
              <span className="block text-sm text-gray-700">{field.label}</span>
              {field.hint && <span className="block text-xs text-gray-400">{field.hint}</span>}
            </span>
          </label>
        );
      }

      case 'chips':
        return (
          <div key={key} className="flex flex-wrap gap-2">
            {field.options.map((opt) => {
              const active = (params.get(field.key) ?? 'All') === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => apply({ [field.key]: opt.value })}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                    active ? 'bg-[#562996] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        );

      case 'select': {
        const opts = optionsFor(field);
        return (
          <select
            key={key}
            value={params.get(field.key) ?? 'All'}
            onChange={(e) => apply({ [field.key]: e.target.value })}
            className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-700 focus:border-[#562996] focus:outline-none"
            aria-label={field.label}
          >
            {opts.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        );
      }

      case 'range': {
        const min = Number(params.get(field.minKey) ?? 0);
        const max = Number(params.get(field.maxKey) ?? field.ceiling);
        return (
          <div key={key} className="space-y-3">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>{field.prefix}{min.toLocaleString('en-IN')}</span>
              <span>
                {field.prefix}{max.toLocaleString('en-IN')}
                {max >= field.ceiling && '+'}
              </span>
            </div>
            <div className="flex gap-3">
              <label className="flex-1 text-xs text-gray-500">
                Min
                <input
                  type="number"
                  min={0}
                  max={field.ceiling}
                  step={field.step}
                  value={min || ''}
                  placeholder="0"
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    apply({ [field.minKey]: !v ? null : String(Math.min(v, max)) });
                  }}
                  className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:border-[#562996] focus:outline-none"
                />
              </label>
              <label className="flex-1 text-xs text-gray-500">
                Max
                <input
                  type="number"
                  min={0}
                  max={field.ceiling}
                  step={field.step}
                  value={params.get(field.maxKey) ?? ''}
                  placeholder={`${field.ceiling}+`}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    // Clearing, or setting the ceiling, removes the cap
                    // entirely — it must not quietly exclude dearer products.
                    apply({ [field.maxKey]: !v || v >= field.ceiling ? null : String(Math.max(v, min)) });
                  }}
                  className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:border-[#562996] focus:outline-none"
                />
              </label>
            </div>
          </div>
        );
      }

      case 'dateRange':
        return (
          <div key={key} className="flex gap-3">
            <label className="flex-1 text-xs text-gray-500">
              From
              <input
                type="date"
                value={params.get(field.fromKey) ?? ''}
                onChange={(e) => apply({ [field.fromKey]: e.target.value || null })}
                className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:border-[#562996] focus:outline-none"
              />
            </label>
            <label className="flex-1 text-xs text-gray-500">
              To
              <input
                type="date"
                value={params.get(field.toKey) ?? ''}
                onChange={(e) => apply({ [field.toKey]: e.target.value || null })}
                className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:border-[#562996] focus:outline-none"
              />
            </label>
          </div>
        );
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Below the floating nav's z-[90], matching the cart/search sheets. */}
          <motion.div
            key="filter-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-[85]"
          />
          <motion.div
            key="filter-panel"
            initial={isDesktop ? { x: '100%' } : { y: '100%' }}
            animate={isDesktop ? { x: 0 } : { y: 0 }}
            exit={isDesktop ? { x: '100%' } : { y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-0 lg:inset-y-0 lg:left-auto lg:right-0 lg:w-[420px] lg:max-w-[90vw] bg-white z-[86] shadow-2xl flex flex-col overflow-hidden"
            role="dialog"
            aria-label={config.title}
          >
            <div className="flex items-start justify-between gap-3 border-b border-gray-100 px-5 py-4">
              <div>
                <h2 className="text-base font-bold text-gray-900">{config.title}</h2>
                {config.subtitle && <p className="mt-0.5 text-xs text-gray-500">{config.subtitle}</p>}
              </div>
              <button onClick={onClose} aria-label="Close filters" className="rounded-full p-2 text-gray-400 transition-colors hover:text-gray-900">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4 pb-32">
              {config.sections.map((section) => (
                <div key={section.id} className="border-b border-gray-100 py-4 last:border-0">
                  <button
                    type="button"
                    onClick={() => setOpen((o) => ({ ...o, [section.id]: !o[section.id] }))}
                    className="flex w-full items-center justify-between text-left"
                    aria-expanded={open[section.id] ?? true}
                  >
                    <span className="text-sm font-bold text-gray-900">{section.title}</span>
                    <ChevronDown
                      className={`h-4 w-4 text-gray-400 transition-transform ${open[section.id] ? 'rotate-180' : ''}`}
                    />
                  </button>
                  <AnimatePresence initial={false}>
                    {(open[section.id] ?? true) && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="space-y-3 pt-3">
                          {section.fields.map((field, i) => renderField(field, `${section.id}-${i}`))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>

            <div className="absolute inset-x-0 bottom-0 flex gap-3 border-t border-gray-100 bg-white px-5 py-4 pb-24 lg:pb-4">
              <button
                type="button"
                onClick={clearAll}
                disabled={count === 0}
                className="flex-1 rounded-full border border-gray-200 py-3 text-sm font-bold text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-40"
              >
                Clear all
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-full bg-[#562996] py-3 text-sm font-bold text-white transition-opacity hover:opacity-90"
              >
                Show results{count > 0 ? ` (${count})` : ''}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
