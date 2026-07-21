# Bubblecast

**Learn a language by starring in a living cartoon sitcom.**

Bubblecast is a web language tutor for adults (travel & work). You explore **Harborline**, a coastal city with a recurring cast. Each mission can include:

1. **Comic warmup** — short speech-bubble panels that introduce phrases  
2. **Live scene** — improv dialogue with NPCs (typed replies)  
3. **Debrief** — mission score, gentle corrections, vocab journal, relationship XP  

Default pair: **English → Spanish**, CEFR A1–B1.

**Suggested deploy slug:** [bubblecast.vercel.app](https://bubblecast.vercel.app) (was free when checked).

## Stack

- Next.js (App Router) + Tailwind  
- xAI via Vercel AI SDK (`ai` + `@ai-sdk/xai`)  
- Structured generation with Zod schemas (Director / Cast / Coach / Comic Writer)  
- Local learner progress in `localStorage` (no auth in MVP)

## Setup

```bash
npm install
cp .env.example .env.local
# Add your key:
# XAI_API_KEY=...
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Get an API key at [console.x.ai](https://console.x.ai). Without a key, the app still boots and uses limited offline fallbacks for comics/openings/debriefs.

## Try the golden path

1. **Enter city** → Harborline map  
2. Start **Mercado Café → Order breakfast**  
3. Read the comic panels  
4. Jump into the live scene and order in Spanish (English is OK; cast will model Spanish)  
5. Use **Hint** if stuck, then **End** for debrief  
6. Check **Journal** and **Cast** relationship bars  

## Project layout

```
src/
  content/harborline/   # world pack: cast, locations, missions
  lib/ai/               # xAI client, prompts, schemas, scene service
  lib/session/          # in-memory scene sessions
  components/           # Stage, comic, map, avatars
  app/play/             # city + mission player
  app/api/scene/        # start | turn | hint | end
  app/api/comic/        # comic generation
```

## Scripts

| Command         | Purpose              |
|-----------------|----------------------|
| `npm run dev`   | Local dev server     |
| `npm run build` | Production build     |
| `npm run start` | Serve production     |
| `npm run lint`  | ESLint               |

## Product notes

- The LLM is a **director + cast + coach**, not a freeform chatbot.  
- Mission success uses communicative goals, not perfect grammar.  
- Image/video gen and voice I/O are intentionally deferred.  

## License

Private / unlicensed unless you add one.
