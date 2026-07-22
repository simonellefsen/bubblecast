import type { VocabEntry } from "@/content/types";

/** Days until next review by status after a grade. */
const INTERVAL_DAYS: Record<VocabEntry["status"], number> = {
  new: 1,
  fuzzy: 3,
  known: 7,
};

export function scheduleNextReview(
  status: VocabEntry["status"],
  from = new Date(),
): string {
  const days = INTERVAL_DAYS[status] ?? 1;
  const d = new Date(from.getTime());
  d.setDate(d.getDate() + days);
  d.setHours(9, 0, 0, 0);
  return d.toISOString();
}

export function isVocabDue(entry: VocabEntry, now = new Date()): boolean {
  if (!entry.nextReviewAt) {
    // Untagged cards: new/fuzzy always due; known not until scheduled once
    return entry.status !== "known";
  }
  return new Date(entry.nextReviewAt).getTime() <= now.getTime();
}

export function countDueVocab(vocab: VocabEntry[], now = new Date()): number {
  return vocab.filter((v) => isVocabDue(v, now)).length;
}

/** Prefer due cards, then new/fuzzy, then known. */
export function sortForPractice(vocab: VocabEntry[], now = new Date()): VocabEntry[] {
  const rankStatus = (s: VocabEntry["status"]) =>
    s === "new" ? 0 : s === "fuzzy" ? 1 : 2;
  return [...vocab].sort((a, b) => {
    const ad = isVocabDue(a, now) ? 0 : 1;
    const bd = isVocabDue(b, now) ? 0 : 1;
    if (ad !== bd) return ad - bd;
    const rs = rankStatus(a.status) - rankStatus(b.status);
    if (rs !== 0) return rs;
    return (
      new Date(a.lastSeenAt).getTime() - new Date(b.lastSeenAt).getTime()
    );
  });
}
