import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  isMissionUnlocked,
  newlyUnlockedMissions,
  recommendNextMission,
} from "@/content/harborline/world";
import { suggestCefrNudge } from "@/lib/cefr-nudge";
import { isVocabDue, scheduleNextReview } from "@/lib/srs";
import type { DebriefPacket, VocabEntry } from "@/content/types";

function debrief(partial: Partial<DebriefPacket>): DebriefPacket {
  return {
    outcome: "partial",
    score: 50,
    summary: "ok",
    criteriaResults: [],
    corrections: [],
    newWords: [],
    castReaction: "🙂",
    xpEarned: 20,
    relationshipDeltas: [],
    ...partial,
  };
}

describe("mission unlocks", () => {
  it("unlocks breakfast by default", () => {
    assert.equal(isMissionUnlocked("cafe-breakfast", []), true);
  });

  it("locks station until breakfast is done", () => {
    assert.equal(isMissionUnlocked("station-delay", []), false);
    assert.equal(isMissionUnlocked("station-delay", ["cafe-breakfast"]), true);
  });

  it("recommends first incomplete unlocked mission", () => {
    const next = recommendNextMission([]);
    assert.equal(next?.id, "cafe-breakfast");
    const after = recommendNextMission(["cafe-breakfast"]);
    assert.ok(after);
    assert.notEqual(after.id, "cafe-breakfast");
  });

  it("detects newly unlocked missions", () => {
    const unlocked = newlyUnlockedMissions([], ["cafe-breakfast"]);
    const ids = unlocked.map((m) => m.id);
    assert.ok(ids.includes("cafe-complaint"));
    assert.ok(ids.includes("station-delay"));
  });
});

describe("cefr nudge", () => {
  it("suggests up on strong success", () => {
    const nudge = suggestCefrNudge(
      "A1",
      debrief({ outcome: "success", score: 90 }),
    );
    assert.equal(nudge.direction, "up");
    assert.equal(nudge.suggested, "A2");
  });

  it("suggests down on tough fail", () => {
    const nudge = suggestCefrNudge(
      "A2",
      debrief({ outcome: "fail", score: 20 }),
    );
    assert.equal(nudge.direction, "down");
    assert.equal(nudge.suggested, "A1");
  });

  it("stays on middling scores", () => {
    const nudge = suggestCefrNudge(
      "A2",
      debrief({ outcome: "partial", score: 55 }),
    );
    assert.equal(nudge.direction, "stay");
    assert.equal(nudge.suggested, "A2");
  });
});

describe("srs-lite", () => {
  it("schedules longer intervals for known cards", () => {
    const known = new Date(scheduleNextReview("known")).getTime();
    const neu = new Date(scheduleNextReview("new")).getTime();
    assert.ok(known > neu);
  });

  it("treats past nextReviewAt as due", () => {
    const entry: VocabEntry = {
      word: "hola",
      gloss: "hi",
      status: "fuzzy",
      timesSeen: 2,
      lastSeenAt: new Date().toISOString(),
      nextReviewAt: new Date(Date.now() - 60_000).toISOString(),
    };
    assert.equal(isVocabDue(entry), true);
  });

  it("treats future nextReviewAt as not due", () => {
    const entry: VocabEntry = {
      word: "gracias",
      gloss: "thanks",
      status: "known",
      timesSeen: 3,
      lastSeenAt: new Date().toISOString(),
      nextReviewAt: new Date(Date.now() + 86_400_000).toISOString(),
    };
    assert.equal(isVocabDue(entry), false);
  });
});
