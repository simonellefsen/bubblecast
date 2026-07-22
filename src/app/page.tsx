import Link from "next/link";
import { harborline } from "@/content/harborline/world";

export default function HomePage() {
  return (
    <div className="relative min-h-full overflow-hidden bg-slate-950 text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_20%_20%,_#fb923c55,_transparent_50%),radial-gradient(ellipse_at_80%_0%,_#818cf855,_transparent_40%),radial-gradient(ellipse_at_50%_100%,_#34d39933,_transparent_45%)] motion-reduce:hidden" />
      <div className="relative mx-auto flex min-h-full max-w-5xl flex-col px-4 py-10">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-2 font-semibold">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/favicon.svg"
              alt=""
              width={36}
              height={36}
              className="h-9 w-9 rounded-xl shadow-sm shadow-orange-500/30"
            />
            Bubblecast
          </div>
          <Link
            href="/play"
            className="rounded-full border border-white/20 px-4 py-1.5 text-sm text-white/90 hover:bg-white/10"
          >
            Enter city
          </Link>
        </header>

        <section className="mt-16 max-w-2xl">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-orange-300">
            Language tutor · living cartoon scenes
          </p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">
            Learn Spanish by starring in a coastal sitcom.
          </h1>
          <p className="mt-4 text-lg text-white/75">
            {harborline.tagline} Comics teach phrases, live scenes put you on
            stage with a recurring cast, and missions judge whether you actually
            got the coffee — or the wifi password.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/play/mission/cafe-breakfast"
              className="rounded-full bg-orange-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-orange-500/30 hover:bg-orange-400"
            >
              Start: Order breakfast
            </Link>
            <Link
              href="/play"
              className="rounded-full border border-white/25 bg-white/5 px-6 py-3 text-sm font-medium text-white hover:bg-white/10"
            >
              Open Harborline map
            </Link>
            <Link
              href="/cast"
              className="rounded-full border border-white/25 bg-white/5 px-6 py-3 text-sm font-medium text-white hover:bg-white/10"
            >
              Meet the cast
            </Link>
          </div>
        </section>

        <section className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              title: "Comic warmups",
              body: "Short speech-bubble panels introduce phrases in context.",
            },
            {
              title: "Live scenes",
              body: "Improv with Mira, Tomi, Ana and friends. Hints + phrase bank.",
            },
            {
              title: "Unlocks",
              body: "Café → station → hotel → cowork → market → night ferry.",
            },
            {
              title: "Journal",
              body: "Practice vocab, track bonds, export progress anytime.",
            },
          ].map((card) => (
            <div
              key={card.title}
              className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur"
            >
              <h2 className="text-lg font-semibold">{card.title}</h2>
              <p className="mt-2 text-sm text-white/70">{card.body}</p>
            </div>
          ))}
        </section>

        <p className="mt-auto pt-16 text-xs text-white/40">
          Adults · travel & work · CEFR A1–B1 · xAI + Supabase · install as a
          home-screen app
        </p>
      </div>
    </div>
  );
}
