"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  getCharacters,
  getLocation,
  getMission,
  harborline,
} from "@/content/harborline/world";
import type {
  DebriefPacket,
  LearnerProfile,
  SceneSession,
} from "@/content/types";
import { loadLearner, saveLearner } from "@/lib/learner-client";
import { applyDebriefToLearner } from "@/lib/session/store";
import { CharacterAvatar } from "./CharacterAvatar";
import { ComicReader } from "./ComicReader";
import { SpeechBubble } from "./SpeechBubble";

type Phase = "loading" | "comic" | "live" | "debrief" | "error";

export function MissionPlayer({ missionId }: { missionId: string }) {
  const mission = useMemo(() => getMission(missionId), [missionId]);
  const location = useMemo(
    () => getLocation(mission.locationId),
    [mission.locationId],
  );
  const cast = useMemo(() => getCharacters(mission.castIds), [mission.castIds]);

  const [learner, setLearner] = useState<LearnerProfile | null>(null);
  const [phase, setPhase] = useState<Phase>("loading");
  const [session, setSession] = useState<SceneSession | null>(null);
  const [debrief, setDebrief] = useState<DebriefPacket | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [showGloss, setShowGloss] = useState(true);
  const [hintLevel, setHintLevel] = useState(0);
  const [hintText, setHintText] = useState<string | null>(null);
  const scroller = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLearner(loadLearner());
  }, []);

  useEffect(() => {
    if (!learner) return;
    let cancelled = false;
    (async () => {
      setPhase("loading");
      setError(null);
      try {
        const res = await fetch("/api/scene/start", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            missionId,
            learner: {
              cefr: learner.cefr,
              displayName: learner.displayName,
            },
            includeComic: true,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to start");
        if (cancelled) return;
        setSession(data.session);
        setPhase(data.session.comic ? "comic" : "live");
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Failed to start mission");
        setPhase("error");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [learner, missionId]);

  useEffect(() => {
    scroller.current?.scrollTo({
      top: scroller.current.scrollHeight,
      behavior: "smooth",
    });
  }, [session?.turns.length, phase]);

  async function enterLive() {
    if (!session) return;
    setBusy(true);
    try {
      const res = await fetch("/api/scene/turn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: session.id, action: "begin_live" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setSession(data.session);
      setPhase("live");
      setHintText(null);
      setHintLevel(0);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not enter scene");
    } finally {
      setBusy(false);
    }
  }

  async function sendTurn(e?: React.FormEvent) {
    e?.preventDefault();
    if (!session || !input.trim() || busy) return;
    setBusy(true);
    setHintText(null);
    const text = input.trim();
    setInput("");
    try {
      const res = await fetch("/api/scene/turn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: session.id, text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Turn failed");
      setSession(data.session);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Turn failed");
      setInput(text);
    } finally {
      setBusy(false);
    }
  }

  async function requestHint() {
    if (!session || busy) return;
    const levels = ["soft", "phrase", "full"] as const;
    const level = levels[Math.min(hintLevel, 2)];
    setBusy(true);
    try {
      const res = await fetch("/api/scene/hint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: session.id, level }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Hint failed");
      setHintText(
        data.hint.gloss
          ? `${data.hint.text} (${data.hint.gloss})`
          : data.hint.text,
      );
      setHintLevel((h) => Math.min(h + 1, 3));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Hint failed");
    } finally {
      setBusy(false);
    }
  }

  async function finishScene() {
    if (!session || !learner || busy) return;
    setBusy(true);
    try {
      const res = await fetch("/api/scene/end", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: session.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "End failed");
      setSession(data.session);
      setDebrief(data.debrief);
      const updated = applyDebriefToLearner(learner, data.debrief, mission.id);
      saveLearner(updated);
      setLearner(updated);
      setPhase("debrief");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not end scene");
    } finally {
      setBusy(false);
    }
  }

  if (phase === "loading" || !learner) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-slate-600">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-orange-200 border-t-orange-500" />
        <p>Director is setting the stage…</p>
      </div>
    );
  }

  if (phase === "error") {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
        <h2 className="font-semibold text-red-800">Couldn’t start mission</h2>
        <p className="mt-2 text-sm text-red-700">{error}</p>
        <p className="mt-2 text-sm text-red-600">
          Ensure <code className="rounded bg-white px-1">XAI_API_KEY</code> is set
          in <code className="rounded bg-white px-1">.env.local</code>. Offline
          fallbacks still work for some paths.
        </p>
        <Link href="/play" className="mt-4 inline-block text-sm text-orange-700">
          ← Back to map
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm text-slate-500">
            {location.emoji} {location.name} · {mission.difficulty}
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">{mission.title}</h1>
          <p className="text-sm text-slate-600">{mission.learnerGoal}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-2 rounded-full border bg-white px-3 py-1.5 text-xs text-slate-600">
            <input
              type="checkbox"
              checked={showGloss}
              onChange={(e) => setShowGloss(e.target.checked)}
            />
            English gloss
          </label>
          <Link
            href="/play"
            className="rounded-full border bg-white px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50"
          >
            Map
          </Link>
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          {error}
        </div>
      ) : null}

      {phase === "comic" && session?.comic ? (
        <div className="space-y-4">
          <ComicReader comic={session.comic} showGloss={showGloss} />
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={enterLive}
              disabled={busy}
              className="rounded-full bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white shadow hover:bg-orange-600 disabled:opacity-60"
            >
              Jump into live scene →
            </button>
            <button
              type="button"
              onClick={() => {
                setPhase("live");
                if (session) {
                  setSession({ ...session, status: "live" });
                }
              }}
              className="rounded-full border bg-white px-4 py-2.5 text-sm text-slate-700"
            >
              Skip comic
            </button>
          </div>
          <TargetPhrases phrases={mission.targetPhrases} />
        </div>
      ) : null}

      {phase === "live" && session ? (
        <div className="grid gap-4 lg:grid-cols-[1fr_240px]">
          <div
            className={`overflow-hidden rounded-3xl border border-white/60 bg-gradient-to-b ${location.background} shadow-lg`}
          >
            <div className="flex items-end justify-center gap-6 border-b border-white/40 bg-white/30 px-4 py-5 backdrop-blur-sm">
              {cast.map((c) => {
                const lastNpc = [...session.turns]
                  .reverse()
                  .find((t) => t.role === "npc" && t.speakerId === c.id);
                return (
                  <CharacterAvatar
                    key={c.id}
                    character={c}
                    emotion={lastNpc?.emotion ?? "neutral"}
                    speaking={Boolean(lastNpc)}
                    size="lg"
                  />
                );
              })}
            </div>

            <div
              ref={scroller}
              className="flex max-h-[420px] flex-col gap-3 overflow-y-auto bg-white/55 p-4 backdrop-blur"
            >
              {session.turns.map((t, i) => (
                <SpeechBubble key={`${t.at}-${i}`} turn={t} showGloss={showGloss} />
              ))}
            </div>

            {hintText ? (
              <div className="border-t border-amber-100 bg-amber-50/90 px-4 py-2 text-sm text-amber-900">
                💡 {hintText}
              </div>
            ) : null}

            <form
              onSubmit={sendTurn}
              className="flex flex-col gap-2 border-t border-white/50 bg-white/80 p-3 sm:flex-row"
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Reply in Spanish (English ok — cast will model Spanish)…"
                className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none ring-orange-300 focus:ring-2"
                disabled={busy || session.status === "ended"}
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={requestHint}
                  disabled={busy}
                  className="rounded-xl border bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  Hint
                </button>
                <button
                  type="submit"
                  disabled={busy || !input.trim()}
                  className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
                >
                  {busy ? "…" : "Say"}
                </button>
                <button
                  type="button"
                  onClick={finishScene}
                  disabled={busy}
                  className="rounded-xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-50"
                >
                  End
                </button>
              </div>
            </form>
          </div>

          <aside className="space-y-3">
            <div className="rounded-2xl border bg-white p-3 shadow-sm">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Beats
              </h3>
              <ul className="mt-2 space-y-2">
                {session.beats.map((b) => (
                  <li
                    key={b.id}
                    className={`rounded-lg px-2 py-1.5 text-sm ${
                      b.completed
                        ? "bg-emerald-50 text-emerald-800"
                        : "bg-slate-50 text-slate-700"
                    }`}
                  >
                    {b.completed ? "✓ " : "○ "}
                    {b.goal}
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-xs text-slate-500">
                Turns {session.turnCount}/{session.maxTurns}
              </p>
            </div>
            <TargetPhrases phrases={mission.targetPhrases} />
          </aside>
        </div>
      ) : null}

      {phase === "debrief" && debrief ? (
        <DebriefView debrief={debrief} missionTitle={mission.title} />
      ) : null}
    </div>
  );
}

function TargetPhrases({ phrases }: { phrases: string[] }) {
  return (
    <div className="rounded-2xl border bg-white p-3 shadow-sm">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
        Target phrases
      </h3>
      <ul className="mt-2 flex flex-wrap gap-2">
        {phrases.map((p) => (
          <li
            key={p}
            className="rounded-full bg-orange-50 px-2.5 py-1 text-xs font-medium text-orange-800"
          >
            {p}
          </li>
        ))}
      </ul>
    </div>
  );
}

function DebriefView({
  debrief,
  missionTitle,
}: {
  debrief: DebriefPacket;
  missionTitle: string;
}) {
  const tone =
    debrief.outcome === "success"
      ? "border-emerald-200 bg-emerald-50"
      : debrief.outcome === "partial"
        ? "border-amber-200 bg-amber-50"
        : "border-slate-200 bg-slate-50";

  return (
    <div className="space-y-4">
      <div className={`rounded-3xl border p-6 ${tone}`}>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Debrief · {missionTitle}
        </p>
        <h2 className="mt-1 text-2xl font-semibold capitalize">
          {debrief.outcome} · {debrief.score}/100 · +{debrief.xpEarned} XP
        </h2>
        <p className="mt-2 text-slate-700">{debrief.summary}</p>
        <p className="mt-3 text-sm italic text-slate-600">{debrief.castReaction}</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border bg-white p-4 shadow-sm">
          <h3 className="font-semibold">Criteria</h3>
          <ul className="mt-2 space-y-2 text-sm">
            {debrief.criteriaResults.map((c) => (
              <li key={c.id} className="flex gap-2">
                <span>{c.met ? "✅" : "⬜"}</span>
                <span>
                  <span className="font-medium">{c.id}</span>
                  <span className="block text-slate-500">{c.note}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-2xl border bg-white p-4 shadow-sm">
          <h3 className="font-semibold">New words</h3>
          <ul className="mt-2 space-y-1 text-sm">
            {debrief.newWords.map((w) => (
              <li key={w.word}>
                <span className="font-medium">{w.word}</span>
                <span className="text-slate-500"> — {w.gloss}</span>
              </li>
            ))}
            {debrief.newWords.length === 0 ? (
              <li className="text-slate-500">No new words this round.</li>
            ) : null}
          </ul>
        </div>
      </div>

      {debrief.corrections.length > 0 ? (
        <div className="rounded-2xl border bg-white p-4 shadow-sm">
          <h3 className="font-semibold">Gentle corrections</h3>
          <ul className="mt-2 space-y-3">
            {debrief.corrections.map((c, i) => (
              <li key={i} className="rounded-xl bg-slate-50 px-3 py-2 text-sm">
                <div className="text-slate-500 line-through">{c.original}</div>
                <div className="font-medium text-emerald-800">{c.suggested}</div>
                <div className="text-slate-600">{c.explanation}</div>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <Link
          href="/play"
          className="rounded-full bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white"
        >
          Back to city
        </Link>
        <Link
          href="/journal"
          className="rounded-full border bg-white px-5 py-2.5 text-sm text-slate-700"
        >
          Open journal
        </Link>
        <Link
          href="/cast"
          className="rounded-full border bg-white px-5 py-2.5 text-sm text-slate-700"
        >
          See cast
        </Link>
      </div>

      <p className="text-xs text-slate-400">
        World: {harborline.name} · progress saved in this browser
      </p>
    </div>
  );
}
