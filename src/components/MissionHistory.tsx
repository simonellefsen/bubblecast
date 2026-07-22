"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { harborline } from "@/content/harborline/world";
import {
  fetchMissionHistory,
  type MissionRunRow,
} from "@/lib/supabase/learner-sync";
import { isSupabaseConfigured } from "@/lib/supabase/client";

export function MissionHistory() {
  const [runs, setRuns] = useState<MissionRunRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!isSupabaseConfigured()) {
        setLoading(false);
        return;
      }
      const { runs: data, error: err } = await fetchMissionHistory(12);
      if (cancelled) return;
      setRuns(data);
      setError(err ?? null);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!isSupabaseConfigured()) {
    return (
      <p className="text-sm text-slate-500">
        Connect Supabase to keep a cloud history of mission debriefs.
      </p>
    );
  }

  if (loading) {
    return <p className="text-sm text-slate-500">Loading history…</p>;
  }

  if (error) {
    return (
      <p className="text-sm text-amber-700">
        Couldn’t load history: {error}
      </p>
    );
  }

  if (runs.length === 0) {
    return (
      <p className="text-sm text-slate-500">
        No debriefs yet — finish a mission to start your log.
      </p>
    );
  }

  return (
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
                <div>{when}</div>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
