import type { Config } from '@netlify/functions'
import { GoogleGenAI, Type } from '@google/genai'

const ai = new GoogleGenAI({})

const MAX_IMAGE_BYTES = 6 * 1024 * 1024
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

const PROMPT = `You are an automotive expert. Identify the car in this photo.
Return the most likely make, model, generation and trim, the year this model (or generation) was first launched in the market,
key specifications, and the current approximate price. For pricing, give the latest known new ex-showroom/MSRP range if it is still sold,
otherwise a typical used-market value range. Prices must be in the currency of the given market.
If the image does not show a car, set isCar to false and leave other fields empty.
Be honest about uncertainty through the confidence value (0-100). Keep the summary to 2-3 sentences.`

const responseSchema = {
  type: Type.OBJECT,
  properties: {
    isCar: { type: Type.BOOLEAN },
    make: { type: Type.STRING },
    model: { type: Type.STRING },
    generation: { type: Type.STRING },
    trim: { type: Type.STRING },
    bodyType: { type: Type.STRING },
    launchYear: { type: Type.STRING, description: 'Year first released in market, e.g. "2019"' },
    productionYears: { type: Type.STRING, description: 'e.g. "2019–present"' },
    confidence: { type: Type.NUMBER },
    summary: { type: Type.STRING },
    price: {
      type: Type.OBJECT,
      properties: {
        currency: { type: Type.STRING },
        min: { type: Type.NUMBER },
        max: { type: Type.NUMBER },
        condition: { type: Type.STRING, description: '"new" or "used"' },
        note: { type: Type.STRING },
      },
    },
    specs: {
      type: Type.OBJECT,
      properties: {
        engine: { type: Type.STRING },
        power: { type: Type.STRING },
        torque: { type: Type.STRING },
        transmission: { type: Type.STRING },
        drivetrain: { type: Type.STRING },
        fuelType: { type: Type.STRING },
        mileage: { type: Type.STRING, description: 'Fuel economy or EV range' },
        acceleration: { type: Type.STRING, description: '0-100 km/h time' },
        topSpeed: { type: Type.STRING },
        seating: { type: Type.STRING },
      },
    },
    highlights: { type: Type.ARRAY, items: { type: Type.STRING } },
    alternatives: {
      type: Type.ARRAY,
      description: 'Other cars it could be, if unsure',
      items: { type: Type.STRING },
    },
  },
  required: ['isCar', 'confidence'],
}

export default async (req: Request) => {
  if (req.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 })
  }

  let image: File | null = null
  let market = 'India'
  try {
    const form = await req.formData()
    const file = form.get('image')
    if (file instanceof File) image = file
    const m = form.get('market')
    if (typeof m === 'string' && m.trim()) market = m.trim().slice(0, 40)
  } catch {
    return Response.json({ error: 'Invalid upload' }, { status: 400 })
  }

  if (!image) return Response.json({ error: 'Please attach a photo' }, { status: 400 })
  if (!ALLOWED_TYPES.includes(image.type)) {
    return Response.json({ error: 'Use a JPG, PNG or WebP image' }, { status: 415 })
  }
  if (image.size > MAX_IMAGE_BYTES) {
    return Response.json({ error: 'Image is too large (max 6 MB)' }, { status: 413 })
  }

  const data = Buffer.from(await image.arrayBuffer()).toString('base64')

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [
        {
          role: 'user',
          parts: [
            { inlineData: { mimeType: image.type, data } },
            { text: `${PROMPT}\nMarket for pricing: ${market}. Today's date: ${new Date().toISOString().slice(0, 10)}.` },
          ],
        },
      ],
      config: { responseMimeType: 'application/json', responseSchema },
    })

    const result = JSON.parse(response.text ?? '{}')
    return Response.json({ ...result, market })
  } catch (err) {
    console.error('identify failed', err)
    return Response.json(
      { error: 'Could not analyse this photo right now. Please try again.' },
      { status: 502 },
    )
  }
}

export const config: Config = {
  path: '/api/identify',
}
