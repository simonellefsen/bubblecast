export type CefrLevel = "A1" | "A2" | "B1" | "B2";

export type CharacterId =
  | "mira"
  | "tomi"
  | "ana"
  | "luis"
  | "sofia";

export type LocationId =
  | "mercado-cafe"
  | "central-station"
  | "hotel-bruma"
  | "cowork-loft"
  | "plaza-market"
  | "night-ferry";

export type Emotion =
  | "neutral"
  | "happy"
  | "curious"
  | "impatient"
  | "warm"
  | "concerned"
  | "amused"
  | "proud";

export interface Character {
  id: CharacterId;
  name: string;
  role: string;
  bio: string;
  traits: string[];
  speechRegister: "formal" | "informal" | "mixed";
  slangDensity: "low" | "medium" | "high";
  teachingHook: string;
  accentColor: string;
  emoji: string;
}

export interface Location {
  id: LocationId;
  name: string;
  blurb: string;
  vibe: string;
  background: string;
  emoji: string;
  mapX: number;
  mapY: number;
}

export interface MissionCriterion {
  id: string;
  description: string;
  weight: number;
}

export interface MissionTemplate {
  id: string;
  title: string;
  locationId: LocationId;
  castIds: CharacterId[];
  blurb: string;
  learnerGoal: string;
  learningGoals: string[];
  targetPhrases: string[];
  successCriteria: MissionCriterion[];
  difficulty: CefrLevel;
  maxTurns: number;
  unlockedByDefault: boolean;
}

export interface WorldPack {
  id: string;
  name: string;
  tagline: string;
  targetLanguage: string;
  targetLanguageCode: string;
  nativeLanguage: string;
  nativeLanguageCode: string;
  characters: Character[];
  locations: Location[];
  missions: MissionTemplate[];
}

export interface VocabEntry {
  word: string;
  gloss: string;
  status: "new" | "fuzzy" | "known";
  timesSeen: number;
  lastSeenAt: string;
}

export interface Relationship {
  characterId: CharacterId;
  score: number;
  notes: string;
}

export interface LearnerProfile {
  id: string;
  displayName: string;
  cefr: CefrLevel;
  targetLanguage: string;
  nativeLanguage: string;
  completedMissionIds: string[];
  vocab: VocabEntry[];
  relationships: Relationship[];
  xp: number;
  createdAt: string;
  updatedAt: string;
}

export interface DialogueLine {
  speakerId: CharacterId | "learner" | "narrator";
  text: string;
  gloss?: string;
  emotion?: Emotion;
}

export interface ComicPanel {
  index: number;
  caption?: string;
  lines: DialogueLine[];
  focusCharacterIds: CharacterId[];
  targetPhrase?: string;
}

export interface ComicScript {
  title: string;
  missionId: string;
  panels: ComicPanel[];
  teachingNotes: string[];
}

export interface SceneBeat {
  id: string;
  goal: string;
  hintSoft: string;
  hintPhrase: string;
  hintFull: string;
  completed: boolean;
}

export interface NpcTurn {
  speakerId: CharacterId;
  text: string;
  gloss?: string;
  emotion: Emotion;
  stageNote?: string;
}

export interface SceneTurn {
  role: "learner" | "npc" | "system";
  speakerId?: CharacterId | "learner";
  text: string;
  gloss?: string;
  emotion?: Emotion;
  at: string;
}

export interface SceneSession {
  id: string;
  missionId: string;
  locationId: LocationId;
  castIds: CharacterId[];
  cefr: CefrLevel;
  status: "comic" | "live" | "ended";
  beats: SceneBeat[];
  turns: SceneTurn[];
  turnCount: number;
  maxTurns: number;
  comic?: ComicScript;
  createdAt: string;
  updatedAt: string;
}

export interface CorrectionCard {
  original: string;
  suggested: string;
  explanation: string;
}

export interface DebriefPacket {
  outcome: "success" | "partial" | "fail";
  score: number;
  summary: string;
  criteriaResults: { id: string; met: boolean; note: string }[];
  corrections: CorrectionCard[];
  newWords: { word: string; gloss: string }[];
  castReaction: string;
  xpEarned: number;
  relationshipDeltas: { characterId: CharacterId; delta: number }[];
}
