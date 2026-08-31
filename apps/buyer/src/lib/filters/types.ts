/**
 * Page-aware filters.
 *
 * One filter button, one drawer, contents chosen by the page you are on. The
 * button used to open the product-catalogue filter everywhere it appeared —
 * including /orders, /blogs and /profile, where it wrote sortBy/minPrice into
 * a URL nothing read.
 *
 * Every filter lives in the query string. That keeps the panel generic (it
 * only ever reads and writes params), makes a filtered view shareable and
 * survivable across a refresh, and means a page opts in simply by reading the
 * params it declared.
 */

export interface SelectOption {
  label: string;
  value: string;
}

/** Where a select gets its options when they are not known at build time. */
export type OptionSource = 'cities' | 'manufacturers' | 'categories';

export type FilterField =
  /** Radio list. Writes one or two params (e.g. sortBy + sortOrder). */
  | {
      kind: 'sort';
      label: string;
      options: { label: string; params: Record<string, string | null> }[];
    }
  /** On/off. Absent from the URL when off, never `?flag=false`. */
  | { kind: 'toggle'; key: string; label: string; hint?: string; trueValue?: string }
  /** Two-handle numeric range. */
  | { kind: 'range'; minKey: string; maxKey: string; label: string; ceiling: number; step: number; prefix?: string }
  /** Dropdown; `options` or `source` (fetched), not both. */
  | { kind: 'select'; key: string; label: string; options?: SelectOption[]; source?: OptionSource }
  /** Chip row — same as select but rendered inline for short lists. */
  | { kind: 'chips'; key: string; label: string; options: SelectOption[] }
  /** Two date inputs. */
  | { kind: 'dateRange'; fromKey: string; toKey: string; label: string };

export interface FilterSection {
  id: string;
  title: string;
  fields: FilterField[];
}

export interface FilterConfig {
  /** Shown as the drawer heading, e.g. "Filter orders". */
  title: string;
  /** One line under the heading saying what is being filtered. */
  subtitle?: string;
  sections: FilterSection[];
}

/** Every param any config can write — used to clear all and to count. */
export function configParamKeys(config: FilterConfig): string[] {
  const keys: string[] = [];
  for (const section of config.sections) {
    for (const field of section.fields) {
      switch (field.kind) {
        case 'sort':
          for (const opt of field.options) keys.push(...Object.keys(opt.params));
          break;
        case 'toggle':
        case 'select':
        case 'chips':
          keys.push(field.key);
          break;
        case 'range':
          keys.push(field.minKey, field.maxKey);
          break;
        case 'dateRange':
          keys.push(field.fromKey, field.toKey);
          break;
      }
    }
  }
  return [...new Set(keys)];
}
