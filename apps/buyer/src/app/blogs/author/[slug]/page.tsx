import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import type { Metadata } from 'next';
import { getBlogs } from '@yukizi/api-client';
import { absoluteUrl, SITE_NAME } from '@/lib/seo/site';
import { authorSlug, personSchema, breadcrumbSchema } from '@/lib/seo/schema';
import { graph } from '@/lib/seo/schema';
import JsonLd from '@/components/seo/JsonLd';
import SiteFooter from '@/components/shared/SiteFooter';

/**
 * A page per author.
 *
 * Posts used to carry a bare `{"@type":"Person","name":"..."}` with nothing
 * behind it — no URL, no bio, no way for two posts by the same person to
 * resolve to the same entity. Asking readers to trust authentication advice
 * from an anonymous byline is a credibility problem, not a schema nitpick.
 *
 * Authors have no slug in the CMS, so it is derived from the name. That is
 * stable as long as the name is, and a rename is rare enough to be worth the
 * simplicity.
 */
export const revalidate = 3600;

async function findAuthor(slug: string) {
  try {
    const res = await getBlogs({ limit: 100, status: 'PUBLISHED' });
    const posts = (res.data ?? []).filter((p) => p.author?.name && authorSlug(p.author.name) === slug);
    if (!posts.length) return null;
    return { author: posts[0].author!, posts };
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const found = await findAuthor(params.slug);
  if (!found) return { title: 'Author not found' };
  const { author, posts } = found;
  const description =
    author.bio?.trim() ||
    `${posts.length} article${posts.length === 1 ? '' : 's'} by ${author.name} on the ${SITE_NAME} blog.`;
  return {
    title: `${author.name} — ${SITE_NAME} Blog`,
    description,
    alternates: { canonical: absoluteUrl(`/blogs/author/${params.slug}`) },
    openGraph: {
      title: `${author.name} — ${SITE_NAME} Blog`,
      description,
      url: absoluteUrl(`/blogs/author/${params.slug}`),
      siteName: SITE_NAME,
      locale: 'en_IN',
      type: 'profile',
    },
  };
}

export default async function AuthorPage({ params }: { params: { slug: string } }) {
  const found = await findAuthor(params.slug);
  // An author with no published posts is not a page — a real 404 rather than
  // an empty one, same rule the product and category pages follow.
  if (!found) notFound();
  const { author, posts } = found;

  return (
    <>
      <JsonLd
        data={graph(
          personSchema({ name: author.name, bio: author.bio, avatar: author.avatar }),
          breadcrumbSchema([
            { name: 'Home', path: '/' },
            { name: 'Blog', path: '/blogs' },
            { name: author.name },
          ]),
        )}
      />
      <main className="mx-auto max-w-3xl px-4 py-12">
        <nav className="mb-6 text-sm text-gray-500">
          <Link href="/blogs" className="hover:text-gray-900">← Back to the blog</Link>
        </nav>

        <header className="mb-10 flex items-start gap-4">
          {author.avatar && (
            <Image
              src={author.avatar}
              alt={`${author.name} - ${SITE_NAME}`}
              width={64}
              height={64}
              loading="lazy"
              className="h-16 w-16 flex-shrink-0 rounded-full object-cover"
            />
          )}
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{author.name}</h1>
            {author.bio && <p className="mt-2 text-sm leading-relaxed text-gray-600">{author.bio}</p>}
            <p className="mt-2 text-xs text-gray-400">
              {posts.length} article{posts.length === 1 ? '' : 's'}
            </p>
          </div>
        </header>

        <ul className="space-y-6">
          {posts.map((post) => (
            <li key={post.id} className="border-b border-gray-100 pb-6 last:border-0">
              <Link href={`/blogs/${post.slug}`} className="group">
                <h2 className="text-lg font-semibold text-gray-900 group-hover:text-[#854cbc]">
                  {post.title}
                </h2>
                {post.excerpt && <p className="mt-1 text-sm text-gray-600">{post.excerpt}</p>}
              </Link>
            </li>
          ))}
        </ul>
      </main>
      <SiteFooter />
    </>
  );
}
