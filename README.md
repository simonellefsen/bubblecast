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
- **Supabase** (shared free project): schema `bubblecast` + views `public.bubblecast_*`  
- Local cache in `localStorage` + anonymous auth cloud sync  
- **Serverless-safe scenes**: full session state is sent with each turn (works on Vercel); mid-mission refresh recovers from `sessionStorage`  
- **Streaming NPC bubbles**: live turns stream via NDJSON so dialogue appears progressively  
- **Cost / latency guards**: parallel mission start, AI timeouts, turn budget, session size limits  
- **Journal practice**: flip cards, mark new/fuzzy/known (syncs to Supabase)  
- **Hub continuity**: resume in-progress missions from the map; cloud debrief history  
- **Mission brief**: review goals/cast/phrases before AI spend; cast uses bond + focus vocab  
- **Unlock path**: café → station → hotel → cowork; market needs two prior missions  
- **Cast memory notes**: debriefs stamp relationship notes shown on Cast page  
- **PWA manifest**: standalone home-screen install (`/manifest.webmanifest`)  







## Setup

```bash
npm install
cp .env.example .env.local
# Add:
# XAI_API_KEY=...
# NEXT_PUBLIC_SUPABASE_URL=...
# NEXT_PUBLIC_SUPABASE_ANON_KEY=...
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Supabase (shared multi-app project)

Bubblecast is an isolated tenant — see [`supabase/README.md`](./supabase/README.md).

1. Enable **Anonymous** sign-ins (Auth → Providers).  
2. Set the two `NEXT_PUBLIC_SUPABASE_*` env vars (Vercel + local).  
3. Migrations live in `supabase/migrations/` (already applied to the Shared project via MCP).  

Get an xAI key at [console.x.ai](https://console.x.ai). Without it, scenes use limited offline fallbacks.

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
  lib/supabase/         # browser client + learner sync (bubblecast_* only)
  lib/session/          # in-memory scene sessions
  components/           # Stage, comic, map, avatars
  app/play/             # city + mission player
  app/api/scene/        # start | turn | hint | end
  supabase/migrations/  # Bubblecast-only SQL (schema bubblecast)
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
