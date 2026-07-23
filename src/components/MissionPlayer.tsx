"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  getCharacters,
  getLocation,
  getMission,
  harborline,
  isMissionUnlocked,
  newlyUnlockedMissions,
} from "@/content/harborline/world";
import type {
  CefrLevel,
  DebriefPacket,
  LearnerProfile,
  MissionTemplate,
  SceneSession,
} from "@/content/types";
import {
  evaluateAchievements,
  type Achievement,
} from "@/lib/achievements";
import {
  hydrateLearner,
  saveLearner,
  saveLearnerAfterDebrief,
} from "@/lib/learner-client";
import { buildSceneLearnerContext } from "@/lib/learner-context";
import {
  clearActiveScene,
  loadActiveScene,
  saveActiveScene,
} from "@/lib/session/client-session";
import { applyDebriefToLearner } from "@/lib/session/store";
import { suggestCefrNudge, type CefrNudge } from "@/lib/cefr-nudge";
import { recordActivity } from "@/lib/streak";
import {
  getCachedAtmosphere,
  setCachedAtmosphere,
} from "@/lib/atmosphere-cache";
import {
  resolveSceneCefr,
  type SceneDifficultyPref,
} from "@/lib/cefr-adapt";
import {
  loadComicAtmospherePref,
  saveComicAtmospherePref,
  shouldRequestAtmosphere,
} from "@/lib/prefs";
import {
  isOfflineSession,
  offlineBeginLive,
  offlineDebrief,
  offlineHint,
  offlineLearnerTurn,
} from "@/lib/session/offline-play";
import { buildOfflineSession } from "@/lib/session/offline-start";
import { checkAiBudget, DAILY_AI_SOFT_CAP, loadUsage, recordAiUsage } from "@/lib/usage";
import { AchievementsPanel } from "./AchievementsPanel";
import { CharacterAvatar } from "./CharacterAvatar";
import { ComicReader } from "./ComicReader";
import { MissionBrief } from "./MissionBrief";
import { SpeechBubble } from "./SpeechBubble";

type Phase = "brief" | "loading" | "comic" | "live" | "debrief" | "error";

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
  const [resumed, setResumed] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [includeComic, setIncludeComic] = useState(true);
  const [includeAtmosphere, setIncludeAtmosphere] = useState(true);
  const [difficultyPref, setDifficultyPref] =
    useState<SceneDifficultyPref>("match");
  const [loadingStep, setLoadingStep] = useState("Checking traveler profile…");
  const [unlockedNow, setUnlockedNow] = useState<MissionTemplate[]>([]);
  const [streakCount, setStreakCount] = useState(0);
  const [cefrNudge, setCefrNudge] = useState<CefrNudge | null>(null);
  const [newAchievements, setNewAchievements] = useState<Achievement[]>([]);
  const [showKeys, setShowKeys] = useState(false);
  const [atmosphereDataUrl, setAtmosphereDataUrl] = useState<string | null>(
    null,
  );
  const scroller = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function commitSession(
    next: SceneSession,
    nextPhase: "comic" | "live" | "debrief",
  ) {
    setSession(next);
    if (nextPhase === "comic" || nextPhase === "live") {
      setPhase(nextPhase);
      saveActiveScene(missionId, next, nextPhase);
    } else {
      setPhase(nextPhase);
      clearActiveScene(missionId);
    }
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setPhase("loading");
      setError(null);
      setResumed(false);
      try {
        setLoadingStep("Checking traveler profile…");
        const { learner: hydrated } = await hydrateLearner();
        if (cancelled) return;
        setLearner(hydrated);

        setLoadingStep("Looking for a saved scene…");
        setIncludeAtmosphere(loadComicAtmospherePref());
        const existing = loadActiveScene(missionId);
        if (existing?.session) {
          setSession(existing.session);
          setPhase(existing.phase);
          setResumed(true);
          // Restore comic art from location cache (not stored in session JSON)
          if (existing.phase === "comic") {
            const cached = getCachedAtmosphere(mission.locationId);
            if (cached) setAtmosphereDataUrl(cached);
          }
          return;
        }

        // Wait for user confirmation (mission brief) before AI spend
        setPhase("brief");
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Failed to load mission");
        setPhase("error");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [missionId]);

  function sceneCefrForStart() {
    if (!learner) return "A1" as const;
    return resolveSceneCefr(learner.cefr, mission.difficulty, difficultyPref);
  }

  function startOfflineFromBrief() {
    if (!learner || busy) return;
    if (!isMissionUnlocked(missionId, learner.completedMissionIds)) {
      setError(mission.unlockHint ?? "Mission locked");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const learnerContext = buildSceneLearnerContext(learner, mission.castIds);
      const sceneCefr = sceneCefrForStart();
      const offline = buildOfflineSession({
        missionId,
        cefr: sceneCefr,
        includeComic,
        learnerContext,
        displayName: learner.displayName,
      });
      // Prefer cached atmosphere even offline (no new Imagine call)
      if (includeComic && includeAtmosphere) {
        const cached = getCachedAtmosphere(mission.locationId);
        setAtmosphereDataUrl(cached);
      } else {
        setAtmosphereDataUrl(null);
      }
      const nextPhase = offline.comic ? "comic" : "live";
      commitSession(offline, nextPhase);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Offline start failed");
      setPhase("error");
    } finally {
      setBusy(false);
    }
  }

  async function startFromBrief() {
    if (!learner || busy) return;
    if (!isMissionUnlocked(missionId, learner.completedMissionIds)) {
      setError(mission.unlockHint ?? "Mission locked");
      return;
    }
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      startOfflineFromBrief();
      return;
    }
    const remaining = Math.max(0, DAILY_AI_SOFT_CAP - loadUsage().count);
    // Prefer cached Imagine art for this location — free, no server call
    const cachedArt =
      includeComic && includeAtmosphere
        ? getCachedAtmosphere(mission.locationId)
        : null;
    const wantAtmosphere =
      !cachedArt &&
      shouldRequestAtmosphere({
        includeComic,
        prefEnabled: includeAtmosphere,
        remainingBudget: remaining,
      });
    // Start costs 1; atmosphere may cost +1 when it actually returns
    const budget = checkAiBudget(1);
    if (!budget.ok) {
      setError(budget.message);
      return;
    }
    setBusy(true);
    setPhase("loading");
    setError(null);
    const sceneCefr = sceneCefrForStart();
    try {
      setLoadingStep(
        cachedArt
          ? includeComic
            ? "Director + comic (reusing location art)…"
            : "Director planning beats…"
          : wantAtmosphere
            ? "Director + comic + Imagine atmosphere…"
            : includeComic
              ? "Director + comic script…"
              : "Director planning beats…",
      );
      const learnerContext = buildSceneLearnerContext(learner, mission.castIds);
      const res = await fetch("/api/scene/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          missionId,
          learner: {
            cefr: sceneCefr,
            displayName: learner.displayName,
          },
          includeComic,
          includeAtmosphere: wantAtmosphere,
          learnerContext,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to start");
      recordAiUsage(1);
      if (data.atmosphere?.dataUrl) {
        const url = data.atmosphere.dataUrl as string;
        setCachedAtmosphere(mission.locationId, url);
        setAtmosphereDataUrl(url);
        recordAiUsage(1);
      } else if (cachedArt) {
        setAtmosphereDataUrl(cachedArt);
      } else {
        setAtmosphereDataUrl(null);
      }
      setLoadingStep("Setting the stage…");
      // Ensure baseline is set for mid-mission adapt
      const sessionWithBaseline = {
        ...data.session,
        cefr: data.session.cefr ?? sceneCefr,
        cefrBaseline: data.session.cefrBaseline ?? sceneCefr,
      };
      const nextPhase = sessionWithBaseline.comic ? "comic" : "live";
      commitSession(sessionWithBaseline, nextPhase);
      const after = loadUsage().count;
      if (after >= DAILY_AI_SOFT_CAP * 0.8) {
        const left = Math.max(0, DAILY_AI_SOFT_CAP - after);
        setError(`AI budget tip: ~${left} free actions left today (soft cap).`);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to start mission");
      setPhase("error");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    scroller.current?.scrollTo({
      top: scroller.current.scrollHeight,
      behavior: "smooth",
    });
  }, [session?.turns.length, phase]);

  // Live-scene shortcuts (ignored while typing in inputs handled by target check)
  useEffect(() => {
    if (phase !== "live" || !session) return;
    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement | null)?.tagName;
      const typing =
        tag === "INPUT" || tag === "TEXTAREA" || (e.target as HTMLElement)?.isContentEditable;
      if (e.key === "?" || (e.key === "/" && e.shiftKey)) {
        if (!typing) {
          e.preventDefault();
          setShowKeys((v) => !v);
        }
        return;
      }
      if (typing) return;
      if (e.key === "h" || e.key === "H") {
        e.preventDefault();
        void requestHint();
      }
      if (e.key === "e" || e.key === "E") {
        e.preventDefault();
        void finishScene();
      }
      const digit = Number(e.key);
      if (digit >= 1 && digit <= 9) {
        const phrase = mission.targetPhrases[digit - 1];
        if (phrase) {
          e.preventDefault();
          setInput((prev) => {
            const trimmed = prev.trim();
            return trimmed ? `${trimmed} ${phrase}` : phrase;
          });
          requestAnimationFrame(() => inputRef.current?.focus());
        }
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- stable mission phrases
  }, [phase, session?.id, busy, hintLevel]);

  async function enterLive() {
    if (!session) return;
    setBusy(true);
    try {
      if (isOfflineSession(session)) {
        commitSession(offlineBeginLive(session), "live");
        setAtmosphereDataUrl(null);
        setHintText(null);
        setHintLevel(0);
        setResumed(false);
        setError(null);
        return;
      }
      // Prefer local transition; keep API for consistency / status stamp
      const res = await fetch("/api/scene/turn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session, action: "begin_live" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      commitSession(data.session, "live");
      setAtmosphereDataUrl(null);
      setHintText(null);
      setHintLevel(0);
      setResumed(false);
    } catch (e) {
      // Offline/local fallback if API fails
      const local = offlineBeginLive({ ...session, offline: true });
      commitSession(local, "live");
      setAtmosphereDataUrl(null);
      setError(
        e instanceof Error
          ? `AI unavailable — offline cast: ${e.message}`
          : "AI unavailable — using offline cast",
      );
    } finally {
      setBusy(false);
    }
  }

  async function sendTurn(e?: React.FormEvent) {
    e?.preventDefault();
    if (!session || !input.trim() || busy) return;

    const text = input.trim();

    // Scripted offline path (no AI budget, works offline)
    if (isOfflineSession(session)) {
      setBusy(true);
      setHintText(null);
      setInput("");
      try {
        const next = offlineLearnerTurn(session, text);
        commitSession(next, "live");
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Offline turn failed");
        setInput(text);
      } finally {
        setBusy(false);
        requestAnimationFrame(() => inputRef.current?.focus());
      }
      return;
    }

    if (typeof navigator !== "undefined" && !navigator.onLine) {
      // Auto-switch AI scene into offline scripted mode
      setBusy(true);
      setHintText(null);
      setInput("");
      try {
        const base = { ...session, offline: true as const };
        const next = offlineLearnerTurn(base, text);
        commitSession(next, "live");
        setError("Went offline mid-scene — switched to scripted cast.");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Offline turn failed");
        setInput(text);
      } finally {
        setBusy(false);
        requestAnimationFrame(() => inputRef.current?.focus());
      }
      return;
    }

    const budget = checkAiBudget(1);
    if (!budget.ok) {
      setError(budget.message);
      return;
    }
    setBusy(true);
    setStreaming(true);
    setHintText(null);
    setInput("");
    try {
      const res = await fetch("/api/scene/turn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session, text, stream: true }),
      });

      if (!res.ok) {
        // Fallback to non-stream JSON
        const failBody = await res.json().catch(() => ({}));
        throw new Error(failBody.error || "Turn failed");
      }

      const contentType = res.headers.get("content-type") ?? "";
      if (!contentType.includes("ndjson") || !res.body) {
        const data = await res.json();
        if (data.session) commitSession(data.session, "live");
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let lastSession: SceneSession | null = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const event = JSON.parse(line) as {
              type: string;
              session?: SceneSession;
              error?: string;
            };
            if (event.error) throw new Error(event.error);
            if (event.session) {
              lastSession = event.session;
              // Live preview — don't spam sessionStorage every chunk
              setSession(event.session);
              setPhase("live");
              if (event.type === "done") {
                commitSession(event.session, "live");
              }
            }
          } catch (parseErr) {
            if (parseErr instanceof SyntaxError) continue;
            throw parseErr;
          }
        }
      }

      if (buffer.trim()) {
        try {
          const event = JSON.parse(buffer) as {
            type: string;
            session?: SceneSession;
          };
          if (event.session) {
            lastSession = event.session;
            commitSession(event.session, "live");
          }
        } catch {
          /* ignore trailing junk */
        }
      }

      if (!lastSession) {
        // Ultimate fallback: non-stream request
        const res2 = await fetch("/api/scene/turn", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ session, text, stream: false }),
        });
        const data = await res2.json();
        if (!res2.ok) throw new Error(data.error || "Turn failed");
        commitSession(data.session, "live");
        lastSession = data.session;
      }

      if (lastSession) {
        const after = recordAiUsage(1);
        if (budget.warn || after.count >= DAILY_AI_SOFT_CAP * 0.8) {
          const left = Math.max(0, DAILY_AI_SOFT_CAP - after.count);
          setError(`AI budget tip: ~${left} free actions left today (soft cap).`);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Turn failed");
      setInput(text);
    } finally {
      setBusy(false);
      setStreaming(false);
      // Mobile-friendly: return focus for the next reply
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }

  async function requestHint() {
    if (!session || busy) return;
    const levels = ["soft", "phrase", "full"] as const;
    const level = levels[Math.min(hintLevel, 2)];
    setBusy(true);
    try {
      if (isOfflineSession(session) || (typeof navigator !== "undefined" && !navigator.onLine)) {
        const hint = offlineHint(session, level);
        setHintText(hint.gloss ? `${hint.text} (${hint.gloss})` : hint.text);
        setHintLevel((h) => Math.min(h + 1, 3));
        return;
      }
      const res = await fetch("/api/scene/hint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session, level }),
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
      // Local beat hints if API fails
      try {
        const hint = offlineHint(session, level);
        setHintText(hint.gloss ? `${hint.text} (${hint.gloss})` : hint.text);
        setHintLevel((h) => Math.min(h + 1, 3));
      } catch {
        setError(err instanceof Error ? err.message : "Hint failed");
      }
    } finally {
      setBusy(false);
    }
  }

  async function applyDebriefLocal(debriefPacket: DebriefPacket) {
    if (!session || !learner) return;
    commitSession({ ...session, status: "ended" }, "debrief");
    setDebrief(debriefPacket);
    const prevCompleted = learner.completedMissionIds;
    const updated = applyDebriefToLearner(learner, debriefPacket, mission.id);
    setUnlockedNow(
      newlyUnlockedMissions(prevCompleted, updated.completedMissionIds),
    );
    const streak = recordActivity();
    setStreakCount(streak.count);
    setCefrNudge(suggestCefrNudge(learner.cefr, debriefPacket));
    setNewAchievements(evaluateAchievements(updated));
    const { error: syncError } = await saveLearnerAfterDebrief(
      updated,
      mission.id,
      debriefPacket,
    );
    try {
      const { appendLocalDebrief } = await import("@/lib/local-debrief-log");
      appendLocalDebrief(mission.id, debriefPacket);
    } catch {
      /* ignore */
    }
    setLearner(updated);
    clearActiveScene(missionId);
    if (syncError) {
      setError(`Saved locally; cloud sync: ${syncError}`);
    }
  }

  async function finishScene() {
    if (!session || !learner || busy) return;
    setBusy(true);
    try {
      if (isOfflineSession(session) || (typeof navigator !== "undefined" && !navigator.onLine)) {
        const packet = offlineDebrief(session);
        await applyDebriefLocal(packet);
        setError(null);
        return;
      }
      const res = await fetch("/api/scene/end", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "End failed");
      commitSession(data.session, "debrief");
      setDebrief(data.debrief);
      const prevCompleted = learner.completedMissionIds;
      const updated = applyDebriefToLearner(learner, data.debrief, mission.id);
      setUnlockedNow(
        newlyUnlockedMissions(prevCompleted, updated.completedMissionIds),
      );
      const streak = recordActivity();
      setStreakCount(streak.count);
      setCefrNudge(suggestCefrNudge(learner.cefr, data.debrief));
      setNewAchievements(evaluateAchievements(updated));
      const { error: syncError } = await saveLearnerAfterDebrief(
        updated,
        mission.id,
        data.debrief,
      );
      try {
        const { appendLocalDebrief } = await import("@/lib/local-debrief-log");
        appendLocalDebrief(mission.id, data.debrief);
      } catch {
        /* ignore */
      }
      setLearner(updated);
      clearActiveScene(missionId);
      if (syncError) {
        setError(`Saved locally; cloud sync: ${syncError}`);
      }
    } catch (err) {
      // Local debrief fallback when AI end fails
      try {
        const packet = offlineDebrief({ ...session, offline: true });
        await applyDebriefLocal(packet);
        setError(
          err instanceof Error
            ? `AI debrief unavailable — local score: ${err.message}`
            : "AI debrief unavailable — local score applied",
        );
      } catch {
        setError(err instanceof Error ? err.message : "Could not end scene");
      }
    } finally {
      setBusy(false);
    }
  }

  async function restartMission() {
    clearActiveScene(missionId);
    setSession(null);
    setDebrief(null);
    setError(null);
    setResumed(false);
    setHintLevel(0);
    setHintText(null);
    if (!learner) return;
    setPhase("brief");
  }

  if (phase === "loading" && !learner) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-slate-600">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-orange-200 border-t-orange-500" />
        <p className="text-sm">{loadingStep}</p>
      </div>
    );
  }

  if (!learner) {
    return <p className="text-slate-500">Loading profile…</p>;
  }

  if (phase === "brief") {
    const locked = !isMissionUnlocked(missionId, learner.completedMissionIds);
    return (
      <MissionBrief
        mission={mission}
        location={location}
        cast={cast}
        learner={learner}
        busy={busy}
        onStart={() => void startFromBrief()}
        onStartOffline={() => startOfflineFromBrief()}
        includeComic={includeComic}
        onIncludeComicChange={setIncludeComic}
        includeAtmosphere={includeAtmosphere}
        onIncludeAtmosphereChange={(v) => {
          setIncludeAtmosphere(v);
          saveComicAtmospherePref(v);
        }}
        atmosphereCached={!!getCachedAtmosphere(mission.locationId)}
        difficultyPref={difficultyPref}
        onDifficultyPrefChange={setDifficultyPref}
        locked={locked}
        lockHint={mission.unlockHint}
      />
    );
  }

  if (phase === "loading") {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 text-slate-600">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-orange-200 border-t-orange-500" />
        <div className="text-center">
          <p className="font-medium text-slate-800">Setting up your scene</p>
          <p className="mt-1 max-w-sm text-sm text-slate-500">{loadingStep}</p>
        </div>
        <ol className="space-y-1 text-left text-xs text-slate-400">
          {[
            "Profile",
            "Saved scene check",
            "Director + comic (parallel)",
            "Stage ready",
          ].map((label) => (
            <li key={label} className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-orange-300" />
              {label}
            </li>
          ))}
        </ol>
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
          on the server. Offline fallbacks still work for some paths.
        </p>
        <div className="mt-4 flex gap-3">
          <button
            type="button"
            onClick={() => void restartMission()}
            className="text-sm font-medium text-orange-700"
          >
            Try again
          </button>
          <Link href="/play" className="text-sm text-slate-600">
            ← Back to map
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm text-slate-500">
            {location.emoji} {location.name} · mission {mission.difficulty}
            {session ? ` · scene CEFR ${session.cefr}` : ""}
            {session?.cefrAdapted ? " · adapted" : ""}
            {session && isOfflineSession(session) ? " · offline cast" : ""}
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

      {resumed ? (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-sm text-sky-900">
          <span>Resumed your in-progress scene (safe after refresh).</span>
          <button
            type="button"
            onClick={() => void restartMission()}
            className="font-medium underline"
            disabled={busy}
          >
            Start over
          </button>
        </div>
      ) : null}

      {error ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          {error}
        </div>
      ) : null}

      {phase === "comic" && session?.comic ? (
        <div className="space-y-4">
          <ComicReader
            comic={session.comic}
            showGloss={showGloss}
            atmosphereDataUrl={atmosphereDataUrl}
          />
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
                const next = { ...session, status: "live" as const };
                commitSession(next, "live");
                setAtmosphereDataUrl(null);
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
        <div className="grid gap-4 pb-28 lg:grid-cols-[1fr_240px] lg:pb-0">
          {showKeys ? (
            <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600 lg:col-span-2">
              <span className="font-semibold text-slate-800">Shortcuts: </span>
              <kbd className="rounded bg-slate-100 px-1">H</kbd> hint ·{" "}
              <kbd className="rounded bg-slate-100 px-1">E</kbd> end ·{" "}
              <kbd className="rounded bg-slate-100 px-1">1–9</kbd> insert phrase ·{" "}
              <kbd className="rounded bg-slate-100 px-1">?</kbd> toggle this help
              (when not typing)
            </div>
          ) : null}
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
              role="log"
              aria-live="polite"
              aria-relevant="additions"
              aria-busy={streaming}
              className="flex max-h-[50vh] flex-col gap-3 overflow-y-auto bg-white/55 p-4 backdrop-blur sm:max-h-[420px]"
            >
              {session.turns.map((t, i) => {
                const isLast = i === session.turns.length - 1;
                const isStreamingBubble =
                  streaming && isLast && t.role === "npc";
                return (
                  <SpeechBubble
                    key={`${t.at}-${i}-${t.role}`}
                    turn={t}
                    showGloss={showGloss}
                    streaming={isStreamingBubble}
                  />
                );
              })}
            </div>

            {hintText ? (
              <div className="border-t border-amber-100 bg-amber-50/90 px-4 py-2 text-sm text-amber-900 lg:static">
                💡 {hintText}
              </div>
            ) : null}

            <form
              onSubmit={sendTurn}
              className="fixed inset-x-0 bottom-0 z-30 flex flex-col gap-2 border-t border-orange-100 bg-white/95 p-3 shadow-[0_-8px_30px_rgba(15,23,42,0.08)] backdrop-blur sm:flex-row lg:static lg:border-white/50 lg:bg-white/80 lg:shadow-none"
            >
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Reply in Spanish (English ok — cast will model Spanish)…"
                className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none ring-orange-300 focus:ring-2"
                disabled={busy || session.status === "ended"}
                enterKeyHint="send"
                autoComplete="off"
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
              <button
                type="button"
                className="mt-2 text-[11px] font-medium text-orange-700 underline"
                onClick={() => setShowKeys((v) => !v)}
              >
                {showKeys ? "Hide" : "Show"} keyboard shortcuts
              </button>
            </div>
            <TargetPhrases
              phrases={mission.targetPhrases}
              onInsert={(phrase) => {
                setInput((prev) => {
                  const trimmed = prev.trim();
                  return trimmed ? `${trimmed} ${phrase}` : phrase;
                });
                requestAnimationFrame(() => inputRef.current?.focus());
              }}
            />
          </aside>
        </div>
      ) : null}

      {phase === "debrief" && debrief && learner ? (
        <DebriefView
          debrief={debrief}
          missionTitle={mission.title}
          locationLabel={`${location.emoji} ${location.name}`}
          unlocked={unlockedNow}
          streakCount={streakCount}
          cefrNudge={cefrNudge}
          currentCefr={learner.cefr}
          newAchievements={newAchievements}
          onApplyCefr={(level) => {
            const next = {
              ...learner,
              cefr: level,
              updatedAt: new Date().toISOString(),
            };
            setLearner(next);
            saveLearner(next);
            setCefrNudge({
              suggested: level,
              direction: "stay",
              reason: `CEFR set to ${level}.`,
            });
          }}
        />
      ) : null}
    </div>
  );
}

function TargetPhrases({
  phrases,
  onInsert,
}: {
  phrases: string[];
  /** When set, phrases become a tappable phrase bank. */
  onInsert?: (phrase: string) => void;
}) {
  return (
    <div className="rounded-2xl border bg-white p-3 shadow-sm">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
        Target phrases
      </h3>
      {onInsert ? (
        <p className="mt-1 text-[11px] text-slate-400">Tap to insert into your reply</p>
      ) : null}
      <ul className="mt-2 flex flex-wrap gap-2">
        {phrases.map((p) => (
          <li key={p}>
            {onInsert ? (
              <button
                type="button"
                onClick={() => onInsert(p)}
                className="rounded-full bg-orange-50 px-2.5 py-1 text-left text-xs font-medium text-orange-800 ring-orange-200 transition hover:bg-orange-100 hover:ring-2 active:scale-[0.98]"
              >
                {p}
              </button>
            ) : (
              <span className="rounded-full bg-orange-50 px-2.5 py-1 text-xs font-medium text-orange-800">
                {p}
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function DebriefView({
  debrief,
  missionTitle,
  locationLabel,
  unlocked,
  streakCount,
  cefrNudge,
  currentCefr,
  onApplyCefr,
  newAchievements,
}: {
  debrief: DebriefPacket;
  missionTitle: string;
  locationLabel: string;
  unlocked: MissionTemplate[];
  streakCount: number;
  cefrNudge: CefrNudge | null;
  currentCefr: CefrLevel;
  onApplyCefr: (level: CefrLevel) => void;
  newAchievements: Achievement[];
}) {
  const [shareNote, setShareNote] = useState<string | null>(null);
  const tone =
    debrief.outcome === "success"
      ? "border-emerald-200 bg-emerald-50"
      : debrief.outcome === "partial"
        ? "border-amber-200 bg-amber-50"
        : "border-slate-200 bg-slate-50";

  async function sharePostcard() {
    const { formatDebriefPostcard, shareDebriefPostcard } = await import(
      "@/lib/debrief-postcard"
    );
    const text = formatDebriefPostcard({
      missionTitle,
      locationLabel,
      debrief,
      streakCount,
      siteUrl:
        typeof window !== "undefined"
          ? window.location.origin
          : "https://bubblecast.vercel.app",
    });
    const result = await shareDebriefPostcard(text, `Bubblecast · ${missionTitle}`);
    if (result === "shared") setShareNote("Shared");
    else if (result === "copied") setShareNote("Postcard copied");
    else setShareNote("Couldn’t share — try copy");
    setTimeout(() => setShareNote(null), 2000);
  }

  async function copyPostcard() {
    const { formatDebriefPostcard } = await import("@/lib/debrief-postcard");
    const text = formatDebriefPostcard({
      missionTitle,
      locationLabel,
      debrief,
      streakCount,
      siteUrl:
        typeof window !== "undefined"
          ? window.location.origin
          : "https://bubblecast.vercel.app",
    });
    try {
      await navigator.clipboard.writeText(text);
      setShareNote("Postcard copied");
    } catch {
      setShareNote("Copy failed");
    }
    setTimeout(() => setShareNote(null), 2000);
  }

  return (
    <div className="space-y-4">
      <div className={`rounded-3xl border p-6 ${tone}`}>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Debrief · {locationLabel} · {missionTitle}
        </p>
        <h2 className="mt-1 text-2xl font-semibold capitalize">
          {debrief.outcome} · {debrief.score}/100 · +{debrief.xpEarned} XP
        </h2>
        <p className="mt-2 text-slate-700">{debrief.summary}</p>
        <p className="mt-3 text-sm italic text-slate-600">{debrief.castReaction}</p>
        {streakCount > 0 ? (
          <p className="mt-3 text-sm font-medium text-slate-700">
            🔥 {streakCount}-day streak
          </p>
        ) : null}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button
            type="button"
            className="rounded-full border border-slate-300 bg-white/80 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-white"
            onClick={() => void sharePostcard()}
          >
            Share postcard
          </button>
          <button
            type="button"
            className="rounded-full border border-slate-300 bg-white/80 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-white"
            onClick={() => void copyPostcard()}
          >
            Copy postcard
          </button>
          {shareNote ? (
            <span className="text-xs font-medium text-emerald-700">{shareNote}</span>
          ) : null}
        </div>
      </div>

      {cefrNudge && cefrNudge.direction !== "stay" ? (
        <div className="rounded-2xl border border-violet-200 bg-violet-50 p-4 text-sm text-violet-950">
          <p className="font-semibold">Level tip (optional)</p>
          <p className="mt-1 text-violet-900/90">{cefrNudge.reason}</p>
          <button
            type="button"
            className="mt-3 rounded-full bg-violet-600 px-4 py-2 text-xs font-semibold text-white hover:bg-violet-700"
            onClick={() => onApplyCefr(cefrNudge.suggested)}
          >
            Switch to {cefrNudge.suggested}
          </button>
          <span className="ml-2 text-xs text-violet-700">
            Current: {currentCefr}
          </span>
        </div>
      ) : null}

      {newAchievements.length > 0 ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <h3 className="font-semibold text-amber-950">Achievements unlocked</h3>
          <ul className="mt-2 space-y-1 text-sm text-amber-900">
            {newAchievements.map((a) => (
              <li key={a.id}>
                {a.emoji} <span className="font-medium">{a.title}</span> —{" "}
                {a.description}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <AchievementsPanel highlight={newAchievements} />

      {unlocked.length > 0 ? (
        <div className="rounded-2xl border border-sky-200 bg-sky-50 p-4 shadow-sm">
          <h3 className="font-semibold text-sky-900">New places unlocked</h3>
          <ul className="mt-3 space-y-2">
            {unlocked.map((m) => {
              const loc = harborline.locations.find((l) => l.id === m.locationId);
              return (
                <li key={m.id}>
                  <Link
                    href={`/play/mission/${m.id}`}
                    className="flex items-center justify-between rounded-xl border border-sky-100 bg-white px-3 py-2 text-sm hover:border-sky-300"
                  >
                    <span>
                      {loc?.emoji} <span className="font-medium">{m.title}</span>
                      <span className="ml-2 text-xs text-slate-400">
                        {m.difficulty}
                      </span>
                    </span>
                    <span className="text-sky-700">Play →</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}

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
        {unlocked[0] ? (
          <Link
            href={`/play/mission/${unlocked[0].id}`}
            className="rounded-full bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white"
          >
            Next unlock →
          </Link>
        ) : null}
        <Link
          href="/play"
          className="rounded-full bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white"
        >
          Back to city
        </Link>
        <Link
          href="/journal#phrase-drill"
          className="rounded-full border bg-white px-5 py-2.5 text-sm text-slate-700"
        >
          Free phrase drill
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
        World: {harborline.name} · progress synced when Supabase is configured
      </p>
    </div>
  );
}
