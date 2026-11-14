import Link from "next/link";

/**
 * Root — gentle landing that routes people to scan a table QR.
 * The customer experience itself lives at /t/[token] (QR destination).
 * No admin/kitchen links are exposed here by design.
 */
export default function Home() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-6 text-center">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-3xl bg-ember-500 text-3xl shadow-lift">
        🍽️
      </div>
      <h1 className="font-display text-3xl font-semibold text-ink-900">
        Welcome to Saffron
      </h1>
      <p className="mt-3 max-w-sm text-ink-500">
        Point your phone camera at the QR code on your table to see the menu
        and order — no app download needed.
      </p>
      <div className="mt-8 w-full max-w-xs rounded-2xl border border-dashed border-ink-200 bg-white p-6">
        <p className="text-sm text-ink-400">
          QR code not scanning? Ask your server for help.
        </p>
      </div>
    </main>
  );
}
