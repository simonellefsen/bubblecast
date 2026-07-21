"use client";

import Link from "next/link";
import { harborline } from "@/content/harborline/world";
import type { LearnerProfile } from "@/content/types";

export function CityMap({ learner }: { learner: LearnerProfile }) {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-medium uppercase tracking-wide text-orange-600">
            Harborline
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">City map</h1>
          <p className="mt-1 max-w-xl text-slate-600">
            Pick a place. Comics warm you up, live scenes put you on stage, missions decide if you pulled it off.
          </p>
        </div>
        <div className="rounded-2xl border border-orange-100 bg-white px-4 py-3 text-sm shadow-sm">
          <div className="font-semibold">{learner.displayName}</div>
          <div className="text-slate-500">
            CEFR {learner.cefr} · {learner.xp} XP · {learner.completedMissionIds.length} scenes
          </div>
        </div>
      </div>

      <div className="relative min-h-[360px] overflow-hidden rounded-3xl border border-sky-100 bg-gradient-to-br from-sky-100 via-amber-50 to-emerald-50 shadow-inner">
        <div className="pointer-events-none absolute inset-0 opacity-40 [background-image:radial-gradient(#94a3b8_1px,transparent_1px)] [background-size:18px_18px]" />
        {harborline.locations.map((loc) => {
          const missions = harborline.missions.filter((m) => m.locationId === loc.id);
          return (
            <div
              key={loc.id}
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${loc.mapX}%`, top: `${loc.mapY}%` }}
            >
              <div className="group relative">
                <button
                  type="button"
                  className="flex h-14 w-14 items-center justify-center rounded-2xl border-2 border-white bg-white/90 text-2xl shadow-lg transition group-hover:scale-110"
                  title={loc.name}
                >
                  {loc.emoji}
                </button>
                <div className="invisible absolute left-1/2 top-full z-10 mt-2 w-64 -translate-x-1/2 rounded-2xl border border-slate-200 bg-white p-3 opacity-0 shadow-xl transition group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
                  <div className="font-semibold">{loc.name}</div>
                  <p className="mt-1 text-xs text-slate-500">{loc.blurb}</p>
                  <ul className="mt-2 space-y-1">
                    {missions.map((m) => {
                      const done = learner.completedMissionIds.includes(m.id);
                      return (
                        <li key={m.id}>
                          <Link
                            href={`/play/mission/${m.id}`}
                            className="flex items-center justify-between rounded-lg px-2 py-1.5 text-sm hover:bg-orange-50"
                          >
                            <span>
                              {m.title}{" "}
                              <span className="text-xs text-slate-400">{m.difficulty}</span>
                            </span>
                            {done ? (
                              <span className="text-xs text-emerald-600">done</span>
                            ) : (
                              <span className="text-xs text-orange-600">play →</span>
                            )}
                          </Link>
                        </li>
                      );
                    })}
                    {missions.length === 0 ? (
                      <li className="px-2 text-xs text-slate-400">No missions yet</li>
                    ) : null}
                  </ul>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <section className="grid gap-3 sm:grid-cols-2">
        {harborline.missions.map((m) => {
          const loc = harborline.locations.find((l) => l.id === m.locationId)!;
          const done = learner.completedMissionIds.includes(m.id);
          return (
            <Link
              key={m.id}
              href={`/play/mission/${m.id}`}
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-orange-200 hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    {loc.emoji} {loc.name}
                  </div>
                  <h3 className="mt-1 font-semibold">{m.title}</h3>
                  <p className="mt-1 text-sm text-slate-600">{m.blurb}</p>
                </div>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                  {m.difficulty}
                </span>
              </div>
              <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                <span>
                  Cast:{" "}
                  {m.castIds
                    .map((id) => harborline.characters.find((c) => c.id === id)?.name)
                    .join(", ")}
                </span>
                <span className={done ? "text-emerald-600" : "text-orange-600"}>
                  {done ? "Revisit" : "Start mission"}
                </span>
              </div>
            </Link>
          );
        })}
      </section>
    </div>
  );
}
