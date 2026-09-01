import { getInstagramFeed } from '@yukizi/api-client';

/**
 * The Instagram rail on the homepage.
 *
 * Server-rendered on purpose. The obvious way to build this is Instagram's
 * embed script, but that is third-party JavaScript on the homepage — it would
 * undo the caching and LCP work and hand a render-blocking dependency to a
 * domain we do not control. Here the API has already fetched the posts, so the
 * markup ships with the page and the browser downloads nothing but images.
 *
 * Renders nothing at all when there are no posts. That covers the ordinary
 * cases — no account connected yet, an expired token, Instagram unreachable —
 * and in every one of them the homepage looks exactly as it does today rather
 * than showing an empty box with a heading over it.
 *
 * The images are Instagram's CDN URLs, deliberately plain <img> rather than
 * next/image: they are signed URLs that rotate, so optimising and caching them
 * at the edge would buy little and cost per-image transforms.
 */

/** Instagram captions run long; the rail needs a line, not an essay. */
function firstLine(caption: string | null): string {
  if (!caption) return '';
  const line = caption.split('\n')[0].trim();
  return line.length > 90 ? `${line.slice(0, 87)}…` : line;
}

/**
 * The admin setting is a full profile URL (it doubles as schema.org sameAs),
 * so the handle for the header link is read back out of it.
 */
function handleFrom(profileUrl?: string): string | null {
  if (!profileUrl) return null;
  const match = profileUrl.match(/instagram\.com\/+([^/?#]+)/i);
  return match ? match[1] : null;
}

export default async function InstagramFeed({ profileUrl }: { profileUrl?: string }) {
  let posts: Awaited<ReturnType<typeof getInstagramFeed>> = [];
  try {
    posts = await getInstagramFeed(8);
  } catch {
    return null;
  }
  if (!posts.length) return null;

  const handle = handleFrom(profileUrl);
  // Falls back to the first post's permalink, which always points at the
  // account — better than a dead link when the setting is blank.
  const headerHref = profileUrl || posts[0].permalink;

  return (
    <section aria-labelledby="instagram-heading" className="mx-auto w-full max-w-7xl px-4 pb-4 pt-10 sm:px-6">
      <div className="mb-4 flex items-baseline justify-between gap-4">
        <h2 id="instagram-heading" className="text-lg font-bold text-gray-900 sm:text-xl">
          Follow us on Instagram
        </h2>
        <a
          href={headerHref}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-semibold text-[#854cbc] hover:underline"
        >
          {handle ? `@${handle}` : 'View profile'}
        </a>
      </div>

      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
        {posts.map((post) => {
          const caption = firstLine(post.caption);
          return (
            <li key={post.id}>
              <a
                href={post.permalink}
                target="_blank"
                rel="noopener noreferrer"
                className="group block"
                // Without this the link reads as the bare URL to a screen
                // reader, and eight of them in a row are indistinguishable.
                aria-label={caption ? `Instagram post: ${caption}` : 'View this post on Instagram'}
              >
                <div className="aspect-square overflow-hidden rounded-xl bg-[#f8f8f8]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={post.mediaUrl}
                    alt={caption || 'Yukizi on Instagram'}
                    loading="lazy"
                    decoding="async"
                    width={300}
                    height={300}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
                {caption && (
                  <p className="mt-2 line-clamp-2 text-xs text-gray-600">{caption}</p>
                )}
              </a>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
