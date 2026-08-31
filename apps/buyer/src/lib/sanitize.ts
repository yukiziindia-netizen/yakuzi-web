import DOMPurify from 'isomorphic-dompurify';

/**
 * Sanitise CMS-authored HTML before it goes through dangerouslySetInnerHTML.
 *
 * Blog post bodies come from the admin rich-text editor and were being
 * injected raw, so anything that could write a post could also run script on
 * yukizi.com — reading a signed-in reader's session from the same origin.
 * Admin is a trusted role, but "trusted" is an access-control statement, not
 * an output-encoding one: a compromised admin account, a stored payload from
 * a pasted document, or a future path that lets less-trusted input reach the
 * editor all end at the same place.
 *
 * Allows what a blog post legitimately needs — headings, lists, tables,
 * links, images, embedded video — and drops script, event handlers,
 * javascript: URLs, and anything that can pull the page apart (form, style,
 * base). isomorphic-dompurify so the same rules apply during SSR and on the
 * client, rather than markup being scrubbed in one place and not the other.
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
