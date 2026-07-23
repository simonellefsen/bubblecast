"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { harborline } from "@/content/harborline/world";
import {
  fetchMissionHistory,
  type MissionRunRow,
} from "@/lib/supabase/learner-sync";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import {
  loadLocalDebriefs,
  type LocalDebriefRun,
} from "@/lib/local-debrief-log";

type HistoryRow = {
  id: string;
  mission_id: string;
  outcome: string;
  score: number;
  summary: string;
  xp_earned: number;
  created_at: string;
  source: "cloud" | "local";
};

function fromCloud(run: MissionRunRow): HistoryRow {
  return {
    id: run.id,
    mission_id: run.mission_id,
    outcome: run.outcome,
    score: run.score,
    summary: run.summary,
    xp_earned: run.xp_earned,
    created_at: run.created_at,
    source: "cloud",
  };
}

function fromLocal(run: LocalDebriefRun): HistoryRow {
  return {
    id: run.id,
    mission_id: run.mission_id,
    outcome: run.outcome,
    score: run.score,
    summary: run.summary,
    xp_earned: run.xp_earned,
    created_at: run.created_at,
    source: "local",
  };
}

export function MissionHistory() {
  const [runs, setRuns] = useState<HistoryRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [sourceNote, setSourceNote] = useState<string>("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const local = loadLocalDebriefs(12).map(fromLocal);

      if (!isSupabaseConfigured()) {
        if (cancelled) return;
        setRuns(local);
        setSourceNote(
          local.length
            ? "Local device history"
            : "Connect Supabase or finish a mission for history.",
        );
        setLoading(false);
        return;
      }

      const { runs: data, error: err } = await fetchMissionHistory(12);
      if (cancelled) return;

      if (err) {
        setError(err);
        setRuns(local);
        setSourceNote(
          local.length
            ? "Cloud failed — showing local history"
            : "Couldn’t load cloud history",
        );
        setLoading(false);
        return;
      }

      const cloud = (data ?? []).map(fromCloud);
      // Prefer cloud when present; fill gaps with local-only rows
      if (cloud.length > 0) {
        const cloudKeys = new Set(
          cloud.map(
            (r) => `${r.mission_id}:${r.score}:${r.created_at.slice(0, 16)}`,
          ),
        );
        const extras = local.filter((l) => {
          const k = `${l.mission_id}:${l.score}:${l.created_at.slice(0, 16)}`;
          return !cloudKeys.has(k);
        });
        setRuns([...cloud, ...extras].slice(0, 12));
        setSourceNote(
          extras.length
            ? "Cloud + local device history"
            : "From cloud mission runs (newest first)",
        );
      } else {
        setRuns(local);
        setSourceNote(
          local.length
            ? "Local device history (cloud empty)"
            : "No debriefs yet — finish a mission to start your log.",
        );
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return <p className="text-sm text-slate-500">Loading history…</p>;
  }

  if (runs.length === 0) {
    return (
      <div className="space-y-1">
        {error ? (
          <p className="text-sm text-amber-700">Couldn’t load history: {error}</p>
        ) : null}
        <p className="text-sm text-slate-500">{sourceNote}</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-slate-400">{sourceNote}</p>
      <ul className="space-y-2">
        {runs.map((run) => {
          const mission = harborline.missions.find((m) => m.id === run.mission_id);
          const when = new Date(run.created_at).toLocaleString(undefined, {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          });
          const tone =
            run.outcome === "success"
              ? "border-emerald-100 bg-emerald-50/60"
              : run.outcome === "partial"
                ? "border-amber-100 bg-amber-50/60"
                : "border-slate-100 bg-slate-50";
          return (
            <li
              key={run.id}
              className={`rounded-xl border px-3 py-2.5 text-sm ${tone}`}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <Link
                    href={`/play/mission/${run.mission_id}`}
                    className="font-semibold text-slate-900 hover:text-orange-700"
                  >
                    {mission?.title ?? run.mission_id}
                  </Link>
                  <p className="mt-0.5 line-clamp-2 text-xs text-slate-600">
                    {run.summary || "No summary"}
                  </p>
                </div>
                <div className="text-right text-xs text-slate-500">
                  <div className="capitalize font-medium text-slate-700">
                    {run.outcome} · {run.score}
                  </div>
                  <div>+{run.xp_earned} XP</div>
                  <div>
                    {when}
                    {run.source === "local" ? (
                      <span className="ml-1 text-slate-400">· local</span>
                    ) : null}
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
