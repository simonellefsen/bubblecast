import Link from "next/link";

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
      <header className="sticky top-0 z-20 border-b border-orange-100/80 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
          <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-orange-500 text-sm text-white shadow-sm">
              B
            </span>
            <span>
              Bubblecast
              {title ? (
                <span className="ml-2 text-sm font-normal text-slate-500">
                  / {title}
                </span>
              ) : null}
            </span>
          </Link>
          <nav className="flex items-center gap-1 text-sm">
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
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">{children}</main>
    </div>
  );
}
