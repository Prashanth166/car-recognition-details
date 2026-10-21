# CarLens

CarLens is a web page that recognises cars from photos. Upload (or drag and drop) any picture of a car and it returns:

- **Make and model**, plus generation/trim and body type, with a confidence score
- **Launch year** — when the model first came to market, and its production years
- **Price today** — approximate new ex-showroom/MSRP range (or used value if discontinued) for a market you choose
- **Spec sheet** — engine, power, torque, transmission, drivetrain, fuel, mileage/range, 0–100 km/h, top speed, seating
- Highlights and possible alternative matches when the photo is ambiguous

Recent identifications are kept in "Your garage" on the device (browser local storage).

## Tech

- TanStack Start (React 19) + Tailwind CSS 4 + shadcn/ui components
- Netlify Function (`/api/identify`) calling Google Gemini through **Netlify AI Gateway** (no API keys to manage)
- Netlify Image CDN for the hero image

## Run locally

```bash
pnpm install
netlify dev   # runs the site and the /api/identify function together
```

AI Gateway activates after the site has at least one production deploy on Netlify.

## Notes

Results are AI estimates; prices vary by city, variant, taxes and dealer.
