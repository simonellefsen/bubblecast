"use client";

import type { ComicScript } from "@/content/types";
import { getCharacter } from "@/content/harborline/world";
import { CharacterAvatar } from "./CharacterAvatar";

export function ComicReader({
  comic,
  showGloss,
}: {
  comic: ComicScript;
  showGloss: boolean;
}) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">{comic.title}</h2>
        <p className="text-sm text-slate-500">Comic preview · tap phrases to remember them later</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {comic.panels.map((panel) => (
          <article
            key={panel.index}
            className="flex flex-col overflow-hidden rounded-2xl border border-orange-100 bg-white shadow-sm"
          >
            <div className="flex items-center justify-between gap-2 border-b border-orange-50 bg-orange-50/60 px-3 py-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-orange-700">
                Panel {panel.index + 1}
              </span>
              {panel.targetPhrase ? (
                <span className="rounded-full bg-white px-2 py-0.5 text-xs font-medium text-orange-800 shadow-sm">
                  {panel.targetPhrase}
                </span>
              ) : null}
            </div>
            <div className="flex flex-1 flex-col gap-3 bg-gradient-to-b from-amber-50/80 to-white p-4">
              {panel.caption ? (
                <p className="text-center text-xs italic text-slate-500">{panel.caption}</p>
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
                      className="rounded-xl border bg-white px-3 py-2 text-sm shadow-sm"
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
          </article>
        ))}
      </div>
      {comic.teachingNotes.length > 0 ? (
        <ul className="rounded-xl border border-slate-200 bg-white/70 px-4 py-3 text-sm text-slate-600">
          {comic.teachingNotes.map((n) => (
            <li key={n} className="list-disc ml-4">
              {n}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
