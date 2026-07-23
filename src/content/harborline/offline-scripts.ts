import type { CharacterId, Emotion } from "@/content/types";

export type ScriptedLine = {
  text: string;
  gloss: string;
  emotion: Emotion;
  /** Prefer this cast member when present in the scene */
  speakerId?: CharacterId;
};

export type MissionOfflineScript = {
  missionId: string;
  opening: ScriptedLine;
  /** Reply when a specific criterion is newly completed */
  onCriterion: Record<string, ScriptedLine>;
  /** When something landed but no specific criterion line */
  onAnyProgress: ScriptedLine[];
  /** When learner didn't hit a goal */
  onMiss: ScriptedLine[];
  /** Optional second-cast cheer */
  companion?: ScriptedLine;
};

/**
 * Mission-specific offline cast dialogue.
 * Falls back to generic lines in offline-play when a mission has no pack.
 */
export const OFFLINE_SCRIPTS: Record<string, MissionOfflineScript> = {
  "cafe-breakfast": {
    missionId: "cafe-breakfast",
    opening: {
      speakerId: "mira",
      text: "¡Buenos días! ¿Qué te apetece hoy?",
      gloss: "Good morning! What would you like today?",
      emotion: "warm",
    },
    onCriterion: {
      greet: {
        speakerId: "mira",
        text: "¡Hola! Con mucho gusto.",
        gloss: "Hi! With pleasure.",
        emotion: "happy",
      },
      "order-drink": {
        speakerId: "mira",
        text: "Un café, perfecto. ¿Con leche o solo?",
        gloss: "A coffee, perfect. With milk or black?",
        emotion: "curious",
      },
      "order-food": {
        speakerId: "mira",
        text: "Buena elección. Te lo preparo en un momento.",
        gloss: "Good choice. I'll get that ready in a moment.",
        emotion: "proud",
      },
      price: {
        speakerId: "mira",
        text: "Son cuatro euros cincuenta, por favor.",
        gloss: "That's four euros fifty, please.",
        emotion: "neutral",
      },
      "polite-close": {
        speakerId: "mira",
        text: "¡A ti! Que tengas un buen día.",
        gloss: "You're welcome! Have a good day.",
        emotion: "warm",
      },
    },
    onAnyProgress: [
      {
        speakerId: "mira",
        text: "Muy bien, te escucho.",
        gloss: "Very good, I'm listening.",
        emotion: "warm",
      },
    ],
    onMiss: [
      {
        speakerId: "mira",
        text: "¿Quieres un café o algo de comer? Dímelo en español si puedes.",
        gloss: "Do you want coffee or something to eat? Tell me in Spanish if you can.",
        emotion: "curious",
      },
    ],
  },

  "cafe-complaint": {
    missionId: "cafe-complaint",
    opening: {
      speakerId: "mira",
      text: "Hola de nuevo. ¿Todo bien con el pedido?",
      gloss: "Hi again. Everything OK with the order?",
      emotion: "warm",
    },
    onCriterion: {
      "soft-open": {
        speakerId: "mira",
        text: "Claro, dime con calma.",
        gloss: "Of course, tell me calmly.",
        emotion: "concerned",
      },
      "state-problem": {
        speakerId: "mira",
        text: "Ay, perdona. Tiene que estar caliente.",
        gloss: "Oh, sorry. It should be hot.",
        emotion: "concerned",
      },
      "request-fix": {
        speakerId: "mira",
        text: "Te traigo otro ahora mismo, sin problema.",
        gloss: "I'll bring you another right away, no problem.",
        emotion: "warm",
      },
    },
    onAnyProgress: [
      {
        speakerId: "mira",
        text: "Gracias por decírmelo con amabilidad.",
        gloss: "Thanks for telling me kindly.",
        emotion: "proud",
      },
    ],
    onMiss: [
      {
        speakerId: "mira",
        text: "¿Hay algún problema con el café? Puedes decir “está frío”.",
        gloss: "Is there a problem with the coffee? You can say “it's cold”.",
        emotion: "curious",
      },
    ],
  },

  "station-delay": {
    missionId: "station-delay",
    opening: {
      speakerId: "tomi",
      text: "¡Ey! El andén está un caos. ¿Buscas un tren?",
      gloss: "Hey! The platform is chaos. Looking for a train?",
      emotion: "impatient",
    },
    onCriterion: {
      "ask-next": {
        speakerId: "tomi",
        text: "El próximo a la costa sale en doce minutos, vía 3.",
        gloss: "The next coastal train leaves in twelve minutes, track 3.",
        emotion: "neutral",
      },
      "get-info": {
        speakerId: "tomi",
        text: "Sí: retraso de veinte minutos, pero ese sí sale.",
        gloss: "Yes: twenty-minute delay, but that one does leave.",
        emotion: "curious",
      },
      relay: {
        speakerId: "sofia",
        text: "¡Gracias! Entonces vamos a la vía 3.",
        gloss: "Thanks! Then let's go to track 3.",
        emotion: "happy",
      },
    },
    onAnyProgress: [
      {
        speakerId: "tomi",
        text: "Rápido, que se me acumulan los paquetes.",
        gloss: "Quick, packages are piling up.",
        emotion: "impatient",
      },
    ],
    onMiss: [
      {
        speakerId: "tomi",
        text: "Pregunta por el próximo tren o el retraso — ¡en español!",
        gloss: "Ask about the next train or the delay — in Spanish!",
        emotion: "curious",
      },
    ],
    companion: {
      speakerId: "sofia",
      text: "Yo también me he perdido un poco…",
      gloss: "I'm a bit lost too…",
      emotion: "amused",
    },
  },

  "hotel-checkin": {
    missionId: "hotel-checkin",
    opening: {
      speakerId: "ana",
      text: "Buenas tardes. Bienvenido/a a Hotel Bruma. ¿Tiene reserva?",
      gloss: "Good afternoon. Welcome to Hotel Bruma. Do you have a reservation?",
      emotion: "neutral",
    },
    onCriterion: {
      name: {
        speakerId: "ana",
        text: "Perfecto, aquí está su reserva. Documento, por favor.",
        gloss: "Perfect, here's your reservation. ID, please.",
        emotion: "warm",
      },
      wifi: {
        speakerId: "ana",
        text: "La red es BrumaGuest y la clave está en la llave.",
        gloss: "The network is BrumaGuest and the password is on the key card.",
        emotion: "neutral",
      },
      "late-checkout": {
        speakerId: "ana",
        text: "Puedo ofrecerle salida a las catorce horas sin cargo.",
        gloss: "I can offer you a 2 p.m. checkout at no charge.",
        emotion: "proud",
      },
    },
    onAnyProgress: [
      {
        speakerId: "ana",
        text: "Muy bien. ¿Algo más en lo que pueda ayudarle?",
        gloss: "Very well. Anything else I can help you with?",
        emotion: "warm",
      },
    ],
    onMiss: [
      {
        speakerId: "ana",
        text: "Puede decir su nombre de reserva o preguntar por el wifi.",
        gloss: "You can say your reservation name or ask about wifi.",
        emotion: "curious",
      },
    ],
  },

  "cowork-meeting": {
    missionId: "cowork-meeting",
    opening: {
      speakerId: "luis",
      text: "¡Hola! ¿Listo/a para la reunión de mañana?",
      gloss: "Hi! Ready for tomorrow's meeting?",
      emotion: "happy",
    },
    onCriterion: {
      soften: {
        speakerId: "luis",
        text: "Claro, dime — sin presión.",
        gloss: "Of course, tell me — no pressure.",
        emotion: "warm",
      },
      "propose-time": {
        speakerId: "luis",
        text: "El jueves a las once me viene genial.",
        gloss: "Thursday at eleven works great for me.",
        emotion: "happy",
      },
      confirm: {
        speakerId: "luis",
        text: "Hecho. Lo apunto en el calendario.",
        gloss: "Done. I'll put it on the calendar.",
        emotion: "proud",
      },
    },
    onAnyProgress: [
      {
        speakerId: "luis",
        text: "Me parece bien ir ajustando.",
        gloss: "I'm fine adjusting as we go.",
        emotion: "warm",
      },
    ],
    onMiss: [
      {
        speakerId: "luis",
        text: "¿Podríamos mover la reunión? Propón un día o hora.",
        gloss: "Could we move the meeting? Suggest a day or time.",
        emotion: "curious",
      },
    ],
  },

  "market-allergies": {
    missionId: "market-allergies",
    opening: {
      speakerId: "mira",
      text: "¡Hola! Fruta del día, bien fresca. ¿Qué te pongo?",
      gloss: "Hi! Fruit of the day, very fresh. What can I get you?",
      emotion: "warm",
    },
    onCriterion: {
      "state-allergy": {
        speakerId: "mira",
        text: "Gracias por avisar. Cuidamos mucho eso aquí.",
        gloss: "Thanks for saying so. We're careful about that here.",
        emotion: "concerned",
      },
      "ask-safe": {
        speakerId: "mira",
        text: "Estas manzanas no llevan frutos secos. Seguras.",
        gloss: "These apples have no nuts. Safe.",
        emotion: "happy",
      },
      purchase: {
        speakerId: "mira",
        text: "Dos euros. ¡Buen provecho!",
        gloss: "Two euros. Enjoy!",
        emotion: "proud",
      },
    },
    onAnyProgress: [
      {
        speakerId: "sofia",
        text: "Yo también pregunto siempre — mejor prevenir.",
        gloss: "I always ask too — better safe than sorry.",
        emotion: "amused",
      },
    ],
    onMiss: [
      {
        speakerId: "mira",
        text: "Si tienes alergia, dímelo claro. ¿Lleva nueces esto?",
        gloss: "If you have an allergy, say it clearly. Does this have nuts?",
        emotion: "curious",
      },
    ],
    companion: {
      speakerId: "sofia",
      text: "Buen punto sobre la alergia.",
      gloss: "Good point about the allergy.",
      emotion: "warm",
    },
  },

  "night-ferry-chat": {
    missionId: "night-ferry-chat",
    opening: {
      speakerId: "sofia",
      text: "Qué luz más bonita en el puerto… ¿Primera vez en el ferry?",
      gloss: "What beautiful light in the harbor… First time on the ferry?",
      emotion: "warm",
    },
    onCriterion: {
      "open-chat": {
        speakerId: "sofia",
        text: "A mí me encanta venir al atardecer.",
        gloss: "I love coming at sunset.",
        emotion: "happy",
      },
      opinion: {
        speakerId: "luis",
        text: "Totalmente de acuerdo — Harborline de noche es otra cosa.",
        gloss: "Totally agree — Harborline at night is something else.",
        emotion: "amused",
      },
      plan: {
        speakerId: "sofia",
        text: "Genial. Si no puede ser hoy, mañana también vale.",
        gloss: "Great. If not today, tomorrow works too.",
        emotion: "happy",
      },
    },
    onAnyProgress: [
      {
        speakerId: "luis",
        text: "Buena conversación para un cruce corto.",
        gloss: "Nice chat for a short crossing.",
        emotion: "warm",
      },
    ],
    onMiss: [
      {
        speakerId: "sofia",
        text: "Cuéntame algo simple — o di si te apetece un plan.",
        gloss: "Tell me something simple — or say if you fancy a plan.",
        emotion: "curious",
      },
    ],
    companion: {
      speakerId: "luis",
      text: "El mar pone a todo el mundo de buen humor.",
      gloss: "The sea puts everyone in a good mood.",
      emotion: "amused",
    },
  },
};

export function getOfflineScript(
  missionId: string,
): MissionOfflineScript | null {
  return OFFLINE_SCRIPTS[missionId] ?? null;
}
