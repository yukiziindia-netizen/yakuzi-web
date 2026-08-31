'use client';

import { useMemo, useState } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ChevronDown, ChevronUp, X } from 'lucide-react';
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
 *
 * The controls are deliberately the ones the storefront already had: the same
 * accordion sections, the same custom radio and checkbox marks in #854cbc, the
 * same twin-handle price slider, and option lists rendered as radios rather
 * than native dropdowns. Making the filter page-aware was the change; how it
 * looks and feels was not.
 */

const ACCENT = '#854cbc';

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
          const [, ...rest] = field.options;
          if (
            rest.some((o) =>
              Object.entries(o.params).every(([k, v]) =>
                v === null ? !params.get(k) : params.get(k) === v,
              ),
            )
          ) {
            count += 1;
          }
          break;
        }
        case 'toggle': {
          const v = params.get(field.key);
          if (v && v !== 'All') count += 1;
          break;
        }
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

/** The storefront's radio mark. */
function RadioMark({ on }: { on: boolean }) {
  return (
    <div
      className={`w-[18px] h-[18px] rounded-full border-2 flex items-center justify-center transition-colors flex-shrink-0 ${
        on ? 'border-[#854cbc]' : 'border-gray-200 group-hover:border-[#854cbc]/50'
      }`}
    >
      {on && <div className="w-2 h-2 rounded-full bg-[#854cbc]" />}
    </div>
  );
}

/** The storefront's checkbox mark. */
function CheckMark({ on }: { on: boolean }) {
  return (
    <div
      className={`w-[18px] h-[18px] rounded-[4px] border flex items-center justify-center transition-colors flex-shrink-0 ${
        on ? 'bg-[#854cbc] border-[#854cbc] text-white' : 'border-gray-300 bg-white'
      }`}
    >
      {on && <Check className="w-3 h-3" strokeWidth={3} />}
    </div>
  );
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
    const toOptions = (list: unknown): SelectOption[] => {
      if (!Array.isArray(list)) return [];
      return list
        .map((item) => {
          if (typeof item === 'string') return { label: item, value: item };
          const rec = item as Record<string, string>;
          const label = rec.name ?? rec.title;
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

  /** Option list rendered as radios, the way Location and Brand always were. */
  const renderRadioList = (
    key: string,
    paramKey: string,
    options: SelectOption[],
    allowToggleOff = true,
  ) => (
    <div key={key} className="space-y-3 pt-1">
      {options.map((opt) => {
        const on = (params.get(paramKey) ?? 'All') === opt.value;
        return (
          <label
            key={opt.value}
            className="flex items-center gap-3 cursor-pointer group"
            onClick={(e) => {
              e.preventDefault();
              const next = on && allowToggleOff && opt.value !== 'All' ? 'All' : opt.value;
              apply({ [paramKey]: next });
            }}
          >
            <RadioMark on={on} />
            <span className="text-base text-gray-700 font-medium">{opt.label}</span>
          </label>
        );
      })}
    </div>
  );

  const renderField = (field: FilterField, key: string) => {
    switch (field.kind) {
      case 'sort': {
        const activeIndex = field.options.findIndex((o) =>
          Object.entries(o.params).every(([k, v]) => (v === null ? !params.get(k) : params.get(k) === v)),
        );
        const active = activeIndex === -1 ? 0 : activeIndex;
        return (
          <div key={key} className="space-y-3 pt-1">
            {field.options.map((opt, i) => (
              <label
                key={opt.label}
                className="flex items-center gap-3 cursor-pointer group"
                onClick={(e) => {
                  e.preventDefault();
                  apply(opt.params);
                }}
              >
                <RadioMark on={i === active} />
                <span className="text-base text-gray-700 font-medium">{opt.label}</span>
              </label>
            ))}
          </div>
        );
      }

      case 'toggle': {
        const onValue = field.trueValue ?? 'true';
        const on = params.get(field.key) === onValue;
        return (
          <label
            key={key}
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => apply({ [field.key]: on ? null : onValue })}
          >
            <CheckMark on={on} />
            <span className="text-gray-700 text-base font-medium">
              {field.label}
              {field.hint && <span className="block text-xs text-gray-400 font-normal">{field.hint}</span>}
            </span>
          </label>
        );
      }

      case 'chips':
        return renderRadioList(key, field.key, field.options);

      case 'select':
        return renderRadioList(key, field.key, optionsFor(field));

      case 'range': {
        // Twin-handle slider, unchanged from the original price control: a
        // filled purple track between the handles, and the two inputs
        // overlaid with pointer-events only on the thumbs.
        const min = Number(params.get(field.minKey) ?? 0);
        const max = Number(params.get(field.maxKey) ?? field.ceiling);
        const pct = (v: number) => (v / field.ceiling) * 100;
        return (
          <div key={key} className="px-1 relative">
            <div className="relative w-full h-1 bg-gray-200 rounded-full mt-6 mb-4 flex items-center">
              <div
                className="absolute h-full bg-[#854cbc] rounded-full pointer-events-none"
                style={{ left: `${pct(min)}%`, width: `${pct(max - min)}%` }}
              />
              <input
                type="range"
                aria-label={`${field.label} minimum`}
                min={0}
                max={field.ceiling}
                step={field.step}
                value={min}
                onChange={(e) => {
                  const val = Math.min(Number(e.target.value), max - field.step);
                  apply({ [field.minKey]: val <= 0 ? null : String(val) });
                }}
                className="absolute w-full appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-[#854cbc] [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:pointer-events-auto z-20"
              />
              <input
                type="range"
                aria-label={`${field.label} maximum`}
                min={0}
                max={field.ceiling}
                step={field.step}
                value={max}
                onChange={(e) => {
                  const val = Math.max(Number(e.target.value), min + field.step);
                  // At the ceiling the cap is removed rather than written, so
                  // dearer products are never silently excluded.
                  apply({ [field.maxKey]: val >= field.ceiling ? null : String(val) });
                }}
                className="absolute w-full appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-[#854cbc] [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:pointer-events-auto z-10"
              />
            </div>
            <div className="flex justify-between mt-2 text-sm text-gray-500 font-medium">
              <span>{field.prefix}{min.toLocaleString('en-IN')}</span>
              <span>
                {field.prefix}{max.toLocaleString('en-IN')}{max >= field.ceiling ? '+' : ''}
              </span>
            </div>
          </div>
        );
      }

      case 'dateRange':
        return (
          <div key={key} className="flex gap-3 pt-1">
            <label className="flex-1 text-sm text-gray-500 font-medium">
              From
              <input
                type="date"
                value={params.get(field.fromKey) ?? ''}
                onChange={(e) => apply({ [field.fromKey]: e.target.value || null })}
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-base text-gray-700 font-medium focus:border-[#854cbc] focus:outline-none"
              />
            </label>
            <label className="flex-1 text-sm text-gray-500 font-medium">
              To
              <input
                type="date"
                value={params.get(field.toKey) ?? ''}
                onChange={(e) => apply({ [field.toKey]: e.target.value || null })}
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-base text-gray-700 font-medium focus:border-[#854cbc] focus:outline-none"
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
            <button
              onClick={onClose}
              aria-label="Close filters"
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-900 bg-white/80 rounded-full z-[80] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex flex-col h-full bg-white text-[#333] p-6 pr-8">
              <div className="mb-6 pt-2">
                <h2 className="text-2xl font-bold text-gray-800">{config.title}</h2>
                {config.subtitle && <p className="mt-1 text-sm text-gray-500">{config.subtitle}</p>}
              </div>

              <div className="flex-1 overflow-y-auto scrollbar-hide pb-24 pr-4">
                {config.sections.map((section, si) => (
                  <div key={section.id}>
                    <div className="space-y-4 mb-6">
                      <button
                        type="button"
                        onClick={() => setOpen((o) => ({ ...o, [section.id]: !o[section.id] }))}
                        className="flex items-center justify-between w-full font-bold text-gray-800 text-base"
                        aria-expanded={open[section.id] ?? true}
                      >
                        {section.title}
                        {(open[section.id] ?? true)
                          ? <ChevronUp className="w-4 h-4 text-gray-500" strokeWidth={3} />
                          : <ChevronDown className="w-4 h-4 text-gray-500" strokeWidth={3} />}
                      </button>
                      <AnimatePresence>
                        {(open[section.id] ?? true) && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="space-y-3.5">
                              {section.fields.map((field, i) => renderField(field, `${section.id}-${i}`))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                    {si < config.sections.length - 1 && (
                      <div className="border-t border-gray-200 mb-4" />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Filters apply the moment they change, as they always have. This
                bar only offers a way back out of them. */}
            <div className="absolute inset-x-0 bottom-0 flex gap-3 border-t border-gray-100 bg-white px-6 py-4 pb-24 lg:pb-4">
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
                className="flex-1 rounded-full bg-[#854cbc] py-3 text-sm font-bold text-white transition-opacity hover:opacity-90"
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

export { ACCENT as FILTER_ACCENT };
