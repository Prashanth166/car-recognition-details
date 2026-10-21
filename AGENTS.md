# AGENTS.md

CarLens: single-page car recognition app. User uploads a car photo → AI returns make/model, launch year, specs and current price.

## Architecture

| Piece | Location | Notes |
| --- | --- | --- |
| Page | `src/routes/index.tsx` | Hero + uploader, market selector, status states (idle/analyzing/done/notCar/error), "Your garage" history |
| Result card | `src/components/car-result.tsx` | Renders a `CarResult`: title, launch year, price, summary, highlights, spec grid |
| Client helpers & types | `src/lib/car.ts` | `CarResult` type, `resizeImage` (browser downscale to JPEG), `identifyCar` (POST multipart), `formatPrice` |
| API | `netlify/functions/identify.mts` | v2 Netlify Function at `/api/identify`. Accepts `image` + `market` form fields, calls Gemini (`gemini-3-flash-preview`) via Netlify AI Gateway with a JSON response schema |
| Theme | `src/styles.css` | Dark-only (`<html class="dark">`), orange `--primary`. Fonts: Saira Condensed (display), IBM Plex Sans (body), JetBrains Mono (`font-mono`) loaded in `__root.tsx` |
| Hero image | `public/img/hero.png` | AI-generated; always served via `/.netlify/images?...&fm=webp` |

## Conventions / decisions

- The `CarResult` shape in `src/lib/car.ts` must stay in sync with `responseSchema` in the function.
- Images are downscaled client-side (1280px for analysis, 320px thumbnails for history) to keep requests well under function body limits.
- History lives only in `localStorage` (`carlens:scans`, max 8; `carlens:market`) — read inside `useEffect` to avoid hydration mismatches. If cross-device history is ever needed, move it to Netlify Database + Blobs.
- Prices come from model knowledge, not a live pricing feed; the UI labels them as estimates.
- Don't pass API keys to `new GoogleGenAI({})` — AI Gateway injects them.
