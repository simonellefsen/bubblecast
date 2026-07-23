import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  isMissionUnlocked,
  newlyUnlockedMissions,
  recommendNextMission,
} from "@/content/harborline/world";
import { suggestCefrNudge } from "@/lib/cefr-nudge";
import { isVocabDue, scheduleNextReview } from "@/lib/srs";
import {
  clearCachedAtmosphere,
  getCachedAtmosphere,
  hasCachedAtmosphere,
  setCachedAtmosphere,
} from "@/lib/atmosphere-cache";
import { formatDebriefPostcard } from "@/lib/debrief-postcard";
import {
  buildDrillItems,
  buildPhraseBank,
  phraseAnswersMatch,
} from "@/lib/phrase-bank";
import { shouldRequestAtmosphere } from "@/lib/prefs";
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

describe("atmosphere preference", () => {
  it("skips atmosphere without comic or budget", () => {
    assert.equal(
      shouldRequestAtmosphere({
        includeComic: false,
        prefEnabled: true,
        remainingBudget: 10,
      }),
      false,
    );
    assert.equal(
      shouldRequestAtmosphere({
        includeComic: true,
        prefEnabled: true,
        remainingBudget: 2,
      }),
      false,
    );
    assert.equal(
      shouldRequestAtmosphere({
        includeComic: true,
        prefEnabled: true,
        remainingBudget: 5,
      }),
      true,
    );
  });
});

describe("atmosphere location cache", () => {
  it("stores and retrieves by location id", () => {
    clearCachedAtmosphere("mercado-cafe");
    assert.equal(hasCachedAtmosphere("mercado-cafe"), false);
    const url = "data:image/png;base64,abc";
    setCachedAtmosphere("mercado-cafe", url);
    assert.equal(getCachedAtmosphere("mercado-cafe"), url);
    assert.equal(hasCachedAtmosphere("mercado-cafe"), true);
    clearCachedAtmosphere("mercado-cafe");
    assert.equal(getCachedAtmosphere("mercado-cafe"), null);
  });

  it("ignores non-data urls", () => {
    clearCachedAtmosphere("hotel-bruma");
    setCachedAtmosphere("hotel-bruma", "https://example.com/x.png");
    assert.equal(getCachedAtmosphere("hotel-bruma"), null);
  });
});

describe("debrief postcard", () => {
  it("formats a shareable summary", () => {
    const text = formatDebriefPostcard({
      missionTitle: "Order breakfast",
      locationLabel: "☕ Mercado Café",
      streakCount: 3,
      debrief: debrief({
        outcome: "success",
        score: 90,
        summary: "You got the coffee.",
        castReaction: "Mira smiles.",
        xpEarned: 40,
        newWords: [{ word: "café", gloss: "coffee" }],
        criteriaResults: [
          { id: "order", met: true, note: "ok" },
          { id: "price", met: false, note: "skipped" },
        ],
      }),
      siteUrl: "https://bubblecast.vercel.app",
    });
    assert.match(text, /Bubblecast postcard/);
    assert.match(text, /Order breakfast/);
    assert.match(text, /SUCCESS · 90\/100 · \+40 XP/);
    assert.match(text, /3-day streak/);
    assert.match(text, /café \(coffee\)/);
    assert.match(text, /Goals: 1\/2/);
  });
});

describe("phrase bank drill", () => {
  it("builds cards from Harborline missions", () => {
    const bank = buildPhraseBank();
    assert.ok(bank.length >= 4);
    assert.ok(bank.some((c) => c.spanish.includes("café") || c.spanish.includes("Buenos")));
  });

  it("scopes to mission ids", () => {
    const bank = buildPhraseBank({ missionIds: ["cafe-breakfast"] });
    assert.ok(bank.every((c) => c.missionId === "cafe-breakfast"));
    assert.ok(bank.length >= 3);
  });

  it("builds MCQ items with correct option present", () => {
    const items = buildDrillItems(buildPhraseBank({ missionIds: ["cafe-breakfast"] }), 4);
    assert.ok(items.length >= 1);
    for (const item of items) {
      assert.equal(item.options[item.correctIndex], item.card.spanish);
      assert.ok(item.options.length >= 2 && item.options.length <= 4);
    }
  });

  it("normalizes phrase answers for fuzzy match", () => {
    assert.equal(phraseAnswersMatch("¿Cuánto cuesta?", "cuanto cuesta"), true);
    assert.equal(phraseAnswersMatch("Gracias", "Por favor"), false);
  });
});
