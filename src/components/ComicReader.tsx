"use client";

import { useEffect, useState } from "react";
import type { ComicScript } from "@/content/types";
import { getCharacter } from "@/content/harborline/world";
import { CharacterAvatar } from "./CharacterAvatar";

export function ComicReader({
  comic,
  showGloss,
  atmosphereDataUrl,
}: {
  comic: ComicScript;
  showGloss: boolean;
  /** Optional Imagine background — kept client-only, not in session JSON. */
  atmosphereDataUrl?: string | null;
}) {
  const panels = comic.panels;
  const [index, setIndex] = useState(0);
  const [mode, setMode] = useState<"focus" | "grid">("focus");

  useEffect(() => {
    setIndex(0);
  }, [comic.missionId, comic.title]);

  useEffect(() => {
    if (mode !== "focus") return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault();
        setIndex((i) => Math.min(panels.length - 1, i + 1));
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        setIndex((i) => Math.max(0, i - 1));
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mode, panels.length]);

  const panel = panels[index] ?? panels[0];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">{comic.title}</h2>
          <p className="text-sm text-slate-500">
            Comic preview · {mode === "focus" ? "← → or buttons to flip panels" : "all panels"}
            {atmosphereDataUrl ? " · Imagine backdrop" : ""}
          </p>
        </div>
        <div className="flex gap-2 text-xs">
          <button
            type="button"
            onClick={() => setMode("focus")}
            className={`rounded-full px-3 py-1 font-medium ${
              mode === "focus"
                ? "bg-orange-500 text-white"
                : "border bg-white text-slate-600"
            }`}
          >
            Focus
          </button>
          <button
            type="button"
            onClick={() => setMode("grid")}
            className={`rounded-full px-3 py-1 font-medium ${
              mode === "grid"
                ? "bg-orange-500 text-white"
                : "border bg-white text-slate-600"
            }`}
          >
            Grid
          </button>
        </div>
      </div>

      {mode === "focus" && panel ? (
        <div className="space-y-3">
          <PanelCard
            panel={panel}
            showGloss={showGloss}
            total={panels.length}
            atmosphereDataUrl={atmosphereDataUrl}
          />
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              disabled={index <= 0}
              onClick={() => setIndex((i) => Math.max(0, i - 1))}
              className="rounded-full border bg-white px-4 py-2 text-sm font-medium text-slate-700 disabled:opacity-40"
            >
              ← Prev
            </button>
            <div className="flex gap-1.5" aria-label="Panel progress">
              {panels.map((p, i) => (
                <button
                  key={p.index}
                  type="button"
                  aria-label={`Panel ${i + 1}`}
                  aria-current={i === index}
                  onClick={() => setIndex(i)}
                  className={`h-2 w-2 rounded-full ${
                    i === index ? "bg-orange-500" : "bg-slate-300"
                  }`}
                />
              ))}
            </div>
            <button
              type="button"
              disabled={index >= panels.length - 1}
              onClick={() => setIndex((i) => Math.min(panels.length - 1, i + 1))}
              className="rounded-full border bg-white px-4 py-2 text-sm font-medium text-slate-700 disabled:opacity-40"
            >
              Next →
            </button>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {panels.map((p) => (
            <PanelCard
              key={p.index}
              panel={p}
              showGloss={showGloss}
              total={panels.length}
              atmosphereDataUrl={atmosphereDataUrl}
            />
          ))}
        </div>
      )}

      {comic.teachingNotes.length > 0 ? (
        <ul className="rounded-xl border border-slate-200 bg-white/70 px-4 py-3 text-sm text-slate-600">
          {comic.teachingNotes.map((n) => (
            <li key={n} className="ml-4 list-disc">
              {n}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function PanelCard({
  panel,
  showGloss,
  total,
  atmosphereDataUrl,
}: {
  panel: ComicScript["panels"][number];
  showGloss: boolean;
  total: number;
  atmosphereDataUrl?: string | null;
}) {
  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-orange-100 bg-white shadow-sm">
      <div className="flex items-center justify-between gap-2 border-b border-orange-50 bg-orange-50/60 px-3 py-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-orange-700">
          Panel {panel.index + 1}
          {total > 1 ? ` / ${total}` : ""}
        </span>
        {panel.targetPhrase ? (
          <span className="rounded-full bg-white px-2 py-0.5 text-xs font-medium text-orange-800 shadow-sm">
            {panel.targetPhrase}
          </span>
        ) : null}
      </div>
      <div className="relative flex flex-1 flex-col gap-3 overflow-hidden p-4">
        {atmosphereDataUrl ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={atmosphereDataUrl}
              alt=""
              className="pointer-events-none absolute inset-0 h-full w-full object-cover"
              aria-hidden
            />
            <div
              className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/75 via-white/70 to-white/85"
              aria-hidden
            />
          </>
        ) : (
          <div
            className="pointer-events-none absolute inset-0 bg-gradient-to-b from-amber-50/80 to-white"
            aria-hidden
          />
        )}
        <div className="relative z-[1] flex flex-1 flex-col gap-3">
          {panel.caption ? (
            <p className="text-center text-xs italic text-slate-600 drop-shadow-sm">
              {panel.caption}
            </p>
          ) : null}
          <div className="flex justify-center gap-3">
            {panel.focusCharacterIds.map((id) => {
              try {
                const c = getCharacter(id);
                return <CharacterAvatar key={id} character={c} size="sm" />;
              } catch {
                return null;
              }
            })}
          </div>
          <div className="space-y-2">
            {panel.lines.map((line, i) => {
              let speaker: string = String(line.speakerId);
              let color = "#64748b";
              if (line.speakerId !== "learner" && line.speakerId !== "narrator") {
                try {
                  const c = getCharacter(line.speakerId);
                  speaker = c.name;
                  color = c.accentColor;
                } catch {
                  /* keep */
                }
              }
              return (
                <div
                  key={i}
                  className="rounded-xl border bg-white/95 px-3 py-2 text-sm shadow-sm backdrop-blur-sm"
                  style={{ borderColor: color }}
                >
                  <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                    {speaker}
                  </div>
                  <p className="font-medium text-slate-900">{line.text}</p>
                  {showGloss && line.gloss ? (
                    <p className="text-xs text-slate-500">{line.gloss}</p>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </article>
  );
}
