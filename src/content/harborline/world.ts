import type { WorldPack } from "../types";

export const harborline: WorldPack = {
  id: "harborline",
  name: "Harborline",
  tagline: "A coastal city where every errand is a scene.",
  targetLanguage: "Spanish",
  targetLanguageCode: "es",
  nativeLanguage: "English",
  nativeLanguageCode: "en",
  characters: [
    {
      id: "mira",
      name: "Mira",
      role: "Café owner",
      bio: "Runs Mercado Café with pride. Warm, patient, and loves teaching food words.",
      traits: ["warm", "patient", "slightly chatty"],
      speechRegister: "informal",
      slangDensity: "low",
      teachingHook: "Over-explains menu items with friendly gestures.",
      accentColor: "#f97316",
      emoji: "☕",
    },
    {
      id: "tomi",
      name: "Tomi",
      role: "Courier",
      bio: "Always mid-delivery. Speaks fast, slangy, and rewards clear requests.",
      traits: ["rushed", "friendly", "direct"],
      speechRegister: "informal",
      slangDensity: "high",
      teachingHook: "Forces you to be concise under mild time pressure.",
      accentColor: "#22c55e",
      emoji: "🛵",
    },
    {
      id: "ana",
      name: "Ana",
      role: "Hotel clerk",
      bio: "Front desk at Hotel Bruma. Polite, formal, perfect for service Spanish.",
      traits: ["professional", "precise", "calm"],
      speechRegister: "formal",
      slangDensity: "low",
      teachingHook: "Models polite request forms and usted usage.",
      accentColor: "#6366f1",
      emoji: "🏨",
    },
    {
      id: "luis",
      name: "Luis",
      role: "Cowork founder",
      bio: "Runs CoWork Loft. Loves small talk that slides into meeting logistics.",
      traits: ["upbeat", "networking", "clear"],
      speechRegister: "mixed",
      slangDensity: "medium",
      teachingHook: "Business phrases without corporate sludge.",
      accentColor: "#0ea5e9",
      emoji: "💼",
    },
    {
      id: "sofia",
      name: "Sofía",
      role: "Fellow traveler",
      bio: "Also learning the ropes. Peers with you, shares tips, sometimes messes up too.",
      traits: ["curious", "encouraging", "playful"],
      speechRegister: "informal",
      slangDensity: "medium",
      teachingHook: "Peer energy: you can ask her what something means.",
      accentColor: "#ec4899",
      emoji: "🎒",
    },
  ],
  locations: [
    {
      id: "mercado-cafe",
      name: "Mercado Café",
      blurb: "Sunny corner café with perfect breakfasts and gossip.",
      vibe: "warm morning bustle",
      background: "from-amber-200 via-orange-100 to-rose-100",
      emoji: "☕",
      mapX: 22,
      mapY: 38,
    },
    {
      id: "central-station",
      name: "Central Station",
      blurb: "Trains, delays, and announcements you half-understand.",
      vibe: "echoey urgency",
      background: "from-slate-300 via-sky-100 to-indigo-100",
      emoji: "🚉",
      mapX: 58,
      mapY: 28,
    },
    {
      id: "hotel-bruma",
      name: "Hotel Bruma",
      blurb: "Boutique hotel with foggy windows and excellent wifi.",
      vibe: "calm formal lobby",
      background: "from-indigo-200 via-violet-100 to-slate-100",
      emoji: "🏨",
      mapX: 78,
      mapY: 48,
    },
    {
      id: "cowork-loft",
      name: "CoWork Loft",
      blurb: "Shared desks, espresso, and soft networking.",
      vibe: "casual professional",
      background: "from-cyan-200 via-sky-50 to-emerald-50",
      emoji: "💻",
      mapX: 40,
      mapY: 62,
    },
    {
      id: "plaza-market",
      name: "Plaza Market",
      blurb: "Open stalls, fruit piles, friendly bargaining.",
      vibe: "colorful chaos",
      background: "from-lime-200 via-yellow-100 to-orange-100",
      emoji: "🛍️",
      mapX: 30,
      mapY: 78,
    },
    {
      id: "night-ferry",
      name: "Night Ferry",
      blurb: "Harbor lights and easy conversations with strangers.",
      vibe: "breezy evening social",
      background: "from-blue-900 via-indigo-800 to-violet-900",
      emoji: "⛴️",
      mapX: 68,
      mapY: 76,
    },
  ],
  missions: [
    {
      id: "cafe-breakfast",
      title: "Order breakfast",
      locationId: "mercado-cafe",
      castIds: ["mira"],
      blurb: "You're hungry. Order coffee and something to eat from Mira.",
      learnerGoal: "Successfully order breakfast and confirm the total.",
      learningGoals: [
        "Greet politely",
        "Order food and drink",
        "Ask for the price",
        "Say thank you",
      ],
      targetPhrases: [
        "Buenos días",
        "Quisiera un café, por favor",
        "¿Cuánto cuesta?",
        "Gracias",
      ],
      successCriteria: [
        {
          id: "greet",
          description: "Greets Mira appropriately",
          weight: 1,
        },
        {
          id: "order-drink",
          description: "Orders a drink",
          weight: 2,
        },
        {
          id: "order-food",
          description: "Orders food or accepts a suggestion",
          weight: 2,
        },
        {
          id: "price",
          description: "Asks about or acknowledges the price",
          weight: 1,
        },
        {
          id: "polite-close",
          description: "Thanks or closes politely",
          weight: 1,
        },
      ],
      difficulty: "A1",
      maxTurns: 10,
      unlockedByDefault: true,
    },
    {
      id: "cafe-complaint",
      title: "Polite complaint",
      locationId: "mercado-cafe",
      castIds: ["mira"],
      blurb: "Your coffee is cold. Ask for a fresh one without sounding rude.",
      learnerGoal: "Explain the problem politely and get a replacement.",
      learningGoals: [
        "Describe a problem",
        "Use soft complaint language",
        "Request a solution",
      ],
      targetPhrases: [
        "Disculpe",
        "El café está frío",
        "¿Me puede traer otro, por favor?",
      ],
      successCriteria: [
        {
          id: "soft-open",
          description: "Opens with apology or softener",
          weight: 1,
        },
        {
          id: "state-problem",
          description: "States the problem clearly",
          weight: 2,
        },
        {
          id: "request-fix",
          description: "Requests a fix",
          weight: 2,
        },
      ],
      difficulty: "A2",
      maxTurns: 8,
      unlockedByDefault: false,
      requiresMissionIds: ["cafe-breakfast"],
      unlockHint: "Complete “Order breakfast” with Mira first.",
    },
    {
      id: "station-delay",
      title: "Missed connection",
      locationId: "central-station",
      castIds: ["tomi", "sofia"],
      blurb: "Your train is delayed. Find the next option and tell Sofía.",
      learnerGoal: "Get next-train info and share it with Sofía.",
      learningGoals: [
        "Ask about delays",
        "Understand simple time info",
        "Relay information",
      ],
      targetPhrases: [
        "¿A qué hora sale el próximo tren?",
        "Hay un retraso",
        "El próximo es a las...",
      ],
      successCriteria: [
        {
          id: "ask-next",
          description: "Asks about the next train or delay",
          weight: 2,
        },
        {
          id: "get-info",
          description: "Obtains usable schedule info",
          weight: 2,
        },
        {
          id: "relay",
          description: "Relays info to Sofía",
          weight: 1,
        },
      ],
      difficulty: "A2",
      maxTurns: 10,
      unlockedByDefault: false,
      requiresMissionIds: ["cafe-breakfast"],
      unlockHint: "Finish your first café mission to unlock the station.",
    },
    {
      id: "hotel-checkin",
      title: "Hotel check-in",
      locationId: "hotel-bruma",
      castIds: ["ana"],
      blurb: "Check in, ask about wifi, and request late checkout.",
      learnerGoal: "Complete check-in and two amenity requests.",
      learningGoals: [
        "Provide identity info",
        "Ask for wifi",
        "Request late checkout politely",
      ],
      targetPhrases: [
        "Tengo una reserva a nombre de...",
        "¿Cuál es la contraseña del wifi?",
        "¿Es posible el late check-out?",
      ],
      successCriteria: [
        {
          id: "name",
          description: "Gives or confirms reservation name",
          weight: 2,
        },
        {
          id: "wifi",
          description: "Asks about wifi",
          weight: 1,
        },
        {
          id: "late-checkout",
          description: "Requests late checkout",
          weight: 2,
        },
      ],
      difficulty: "A2",
      maxTurns: 10,
      unlockedByDefault: false,
      requiresMissionIds: ["station-delay"],
      unlockHint: "Clear the station delay scene first.",
    },
    {
      id: "cowork-meeting",
      title: "Reschedule a meeting",
      locationId: "cowork-loft",
      castIds: ["luis"],
      blurb: "You need to move tomorrow's call. Soften the request with Luis.",
      learnerGoal: "Politely reschedule and agree on a new time.",
      learningGoals: [
        "Soften a request",
        "Propose a new time",
        "Confirm agreement",
      ],
      targetPhrases: [
        "¿Podríamos mover la reunión?",
        "¿Te viene bien el jueves?",
        "Perfecto, queda así",
      ],
      successCriteria: [
        {
          id: "soften",
          description: "Uses soft request language",
          weight: 2,
        },
        {
          id: "propose-time",
          description: "Proposes or accepts a new time",
          weight: 2,
        },
        {
          id: "confirm",
          description: "Confirms the new plan",
          weight: 1,
        },
      ],
      difficulty: "B1",
      maxTurns: 10,
      unlockedByDefault: false,
      requiresMissionIds: ["hotel-checkin"],
      unlockHint: "Check in at Hotel Bruma to unlock cowork missions.",
    },
    {
      id: "market-allergies",
      title: "Market with allergies",
      locationId: "plaza-market",
      castIds: ["mira", "sofia"],
      blurb: "Buy fruit but explain a nut allergy clearly.",
      learnerGoal: "State allergy and complete a safe purchase.",
      learningGoals: [
        "State dietary restriction",
        "Ask about ingredients",
        "Buy something safely",
      ],
      targetPhrases: [
        "Soy alérgico/a a los frutos secos",
        "¿Esto lleva nueces?",
        "Entonces prefiero esto",
      ],
      successCriteria: [
        {
          id: "state-allergy",
          description: "Clearly states the allergy",
          weight: 2,
        },
        {
          id: "ask-safe",
          description: "Checks if item is safe",
          weight: 2,
        },
        {
          id: "purchase",
          description: "Completes a purchase decision",
          weight: 1,
        },
      ],
      difficulty: "A2",
      maxTurns: 10,
      unlockedByDefault: false,
      requiresMissionIds: ["cafe-complaint", "station-delay"],
      unlockHint: "Complete café complaint and station delay first.",
    },
    {
      id: "night-ferry-chat",
      title: "Ferry small talk",
      locationId: "night-ferry",
      castIds: ["sofia", "luis"],
      blurb: "Evening crossing. Make small talk and accept or decline a plan.",
      learnerGoal: "Chat casually and agree on a simple social plan (or decline politely).",
      learningGoals: [
        "Open small talk",
        "Share a simple opinion",
        "Accept or decline an invitation",
      ],
      targetPhrases: [
        "¿Vienes a menudo por aquí?",
        "Me parece bien",
        "Esta noche no puedo, ¿mañana?",
      ],
      successCriteria: [
        {
          id: "open-chat",
          description: "Starts or sustains small talk",
          weight: 2,
        },
        {
          id: "opinion",
          description: "Shares a simple opinion or preference",
          weight: 1,
        },
        {
          id: "plan",
          description: "Accepts, declines, or proposes an alternative plan",
          weight: 2,
        },
      ],
      difficulty: "B1",
      maxTurns: 10,
      unlockedByDefault: false,
      requiresMissionIds: ["cowork-meeting", "market-allergies"],
      unlockHint: "Finish cowork reschedule and market allergies first.",
    },
  ],
};

export function getMission(missionId: string) {
  const mission = harborline.missions.find((m) => m.id === missionId);
  if (!mission) throw new Error(`Unknown mission: ${missionId}`);
  return mission;
}

export function isMissionUnlocked(
  missionId: string,
  completedMissionIds: string[],
): boolean {
  const mission = harborline.missions.find((m) => m.id === missionId);
  if (!mission) return false;
  if (mission.unlockedByDefault && !mission.requiresMissionIds?.length) {
    return true;
  }
  const required = mission.requiresMissionIds ?? [];
  return required.every((id) => completedMissionIds.includes(id));
}

export function missingUnlocks(
  missionId: string,
  completedMissionIds: string[],
): string[] {
  const mission = harborline.missions.find((m) => m.id === missionId);
  if (!mission?.requiresMissionIds?.length) return [];
  return mission.requiresMissionIds.filter(
    (id) => !completedMissionIds.includes(id),
  );
}

/** Missions that became unlocked after completing `justCompletedId`. */
export function newlyUnlockedMissions(
  previousCompleted: string[],
  nextCompleted: string[],
) {
  return harborline.missions.filter((m) => {
    const wasLocked = !isMissionUnlocked(m.id, previousCompleted);
    const nowOpen = isMissionUnlocked(m.id, nextCompleted);
    return wasLocked && nowOpen;
  });
}

/** First unlocked mission not yet completed (story order). */
export function recommendNextMission(completedMissionIds: string[]) {
  return (
    harborline.missions.find(
      (m) =>
        isMissionUnlocked(m.id, completedMissionIds) &&
        !completedMissionIds.includes(m.id),
    ) ?? null
  );
}

export function getLocation(locationId: string) {
  const location = harborline.locations.find((l) => l.id === locationId);
  if (!location) throw new Error(`Unknown location: ${locationId}`);
  return location;
}

export function getCharacter(characterId: string) {
  const character = harborline.characters.find((c) => c.id === characterId);
  if (!character) throw new Error(`Unknown character: ${characterId}`);
  return character;
}

export function getCharacters(ids: string[]) {
  return ids.map(getCharacter);
}
