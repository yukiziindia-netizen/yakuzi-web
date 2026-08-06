import { COMPANY } from '@/config/company';

export function PolicySection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-10">
      <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
      <div className="mt-3 space-y-3 text-sm leading-relaxed text-gray-600">
        {children}
      </div>
    </section>
  );
}

export default function PolicyPage({
  title,
  intro,
  showLastUpdated = true,
  children,
}: {
  title: string;
  intro?: string;
  showLastUpdated?: boolean;
  children: React.ReactNode;
}) {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
        {title}
      </h1>

      {showLastUpdated && (
        <p className="mt-3 text-xs uppercase tracking-wider text-gray-400">
          Last updated {COMPANY.policiesLastUpdated}
        </p>
      )}

      {intro && (
        <p className="mt-6 text-base leading-relaxed text-gray-600">{intro}</p>
      )}

      <div className="mt-2">{children}</div>
    </main>
  );
}
