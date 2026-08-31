import DOMPurify from 'isomorphic-dompurify';

/**
 * Sanitise CMS-authored HTML before it goes through dangerouslySetInnerHTML.
 *
 * The same fix landed in the buyer app (web#220); this app renders the same
 * post bodies from the same admin editor and was still injecting them raw, so
 * closing it in one place and not the other left the hole open.
 *
 * Allows what a blog post legitimately needs — headings, lists, tables, links,
 * images, embedded video — and drops script, event handlers, javascript: URLs,
 * and anything that can pull the page apart (form, style, base). Kept
 * deliberately identical to the buyer app's rules so the two cannot drift into
 * disagreeing about what is safe.
 */
export function sanitizeHtml(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: [
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'p', 'br', 'hr', 'div', 'span', 'blockquote', 'pre', 'code',
      'strong', 'b', 'em', 'i', 'u', 's', 'sub', 'sup', 'mark', 'small',
      'ul', 'ol', 'li', 'dl', 'dt', 'dd',
      'a', 'img', 'figure', 'figcaption',
      'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td', 'caption',
      'iframe', 'video', 'source',
    ],
    ALLOWED_ATTR: [
      'href', 'target', 'rel', 'title',
      'src', 'alt', 'width', 'height', 'loading', 'decoding', 'srcset', 'sizes',
      'class', 'id', 'colspan', 'rowspan', 'start', 'type',
      'allow', 'allowfullscreen', 'frameborder', 'controls', 'poster',
    ],
    // Only http(s) and mailto — blocks javascript: and data: URL payloads.
    ALLOWED_URI_REGEXP: /^(?:https?:|mailto:|[^a-z]|[a-z+.-]+(?:[^a-z+.\-:]|$))/i,
    FORBID_TAGS: ['script', 'style', 'form', 'input', 'button', 'base', 'object', 'embed'],
    // Belt and braces: DOMPurify strips on* handlers already.
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'style'],
  });
}
