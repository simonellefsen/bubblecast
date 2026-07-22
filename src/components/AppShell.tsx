import Link from "next/link";
import { NetworkBanner } from "./NetworkBanner";

const links = [
  { href: "/play", label: "City" },
  { href: "/cast", label: "Cast" },
  { href: "/journal", label: "Journal" },
  { href: "/settings", label: "Settings" },
];

export function AppShell({
  children,
  title,
}: {
  children: React.ReactNode;
  title?: string;
}) {
  return (
    <div className="min-h-full bg-[radial-gradient(ellipse_at_top,_#fff7ed_0%,_#f8fafc_45%,_#eef2ff_100%)] text-slate-900">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-white focus:px-3 focus:py-2 focus:shadow"
      >
        Skip to content
      </a>
      <header className="sticky top-0 z-20 border-b border-orange-100/80 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
          <Link
            href="/"
            className="flex items-center gap-2 font-semibold tracking-tight"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/favicon.svg"
              alt=""
              width={32}
              height={32}
              className="h-8 w-8 rounded-xl shadow-sm"
            />
            <span>
              Bubblecast
              {title ? (
                <span className="ml-2 text-sm font-normal text-slate-500">
                  / {title}
                </span>
              ) : null}
            </span>
          </Link>
          <nav className="flex items-center gap-1 text-sm" aria-label="Primary">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="rounded-full px-3 py-1.5 text-slate-600 transition hover:bg-orange-50 hover:text-orange-700"
              >
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
        <NetworkBanner />
      </header>
      <main
        id="main"
        className="mx-auto w-full max-w-5xl flex-1 px-4 py-6"
      >
        {children}
      </main>
    </div>
  );
}
