import Link from "next/link";
import { AppShell } from "@/components/AppShell";

export const metadata = {
  title: "Offline · Bubblecast",
  description: "You’re offline — free practice still works on Bubblecast.",
};

export default function OfflinePage() {
  return (
    <AppShell title="Offline">
      <div className="mx-auto max-w-lg space-y-6">
        <div className="rounded-3xl border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
            No connection
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
            You’re offline
          </h1>
          <p className="mt-2 text-slate-600">
            AI cast needs the network, but Bubblecast still works for free practice
            and offline mission scripts once this device has opened those pages
            online once.
          </p>
        </div>

        <section className="rounded-2xl border bg-white p-4 shadow-sm">
          <h2 className="font-semibold text-slate-900">What still works</h2>
          <ul className="mt-2 space-y-2 text-sm text-slate-600">
            <li>· Free phrase drill (no AI)</li>
            <li>· Vocab journal cards on this device</li>
            <li>· Offline cast on missions you’ve warmed up</li>
            <li>· Local debrief history & streak</li>
          </ul>
        </section>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/journal#phrase-drill"
            className="rounded-full bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white shadow hover:bg-orange-600"
          >
            Free phrase drill
          </Link>
          <Link
            href="/play/mission/cafe-breakfast"
            className="rounded-full border bg-white px-5 py-2.5 text-sm font-medium text-slate-800"
          >
            Café offline warmup
          </Link>
          <Link
            href="/play"
            className="rounded-full border bg-white px-5 py-2.5 text-sm font-medium text-slate-800"
          >
            City map
          </Link>
          <Link
            href="/journal"
            className="rounded-full border bg-white px-5 py-2.5 text-sm font-medium text-slate-800"
          >
            Journal
          </Link>
        </div>

        <p className="text-xs text-slate-400">
          Tip: open City, Journal, and a mission while online so the app shell
          caches for airplane mode.
        </p>
      </div>
    </AppShell>
  );
}
