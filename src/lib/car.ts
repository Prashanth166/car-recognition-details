export type CarSpecs = {
  engine?: string
  power?: string
  torque?: string
  transmission?: string
  drivetrain?: string
  fuelType?: string
  mileage?: string
  acceleration?: string
  topSpeed?: string
  seating?: string
}

export type CarResult = {
  isCar: boolean
  make?: string
  model?: string
  generation?: string
  trim?: string
  bodyType?: string
  launchYear?: string
  productionYears?: string
  confidence: number
  summary?: string
  price?: {
    currency?: string
    min?: number
    max?: number
    condition?: string
    note?: string
  }
  specs?: CarSpecs
  highlights?: string[]
  alternatives?: string[]
  market: string
}

export type Scan = {
  id: string
  thumb: string
  result: CarResult
  scannedAt: number
}

export const MARKETS = [
  'India',
  'United States',
  'United Kingdom',
  'European Union',
  'United Arab Emirates',
  'Canada',
  'Australia',
  'Japan',
] as const

// Downscale in the browser so uploads stay small and fast.
export async function resizeImage(file: File, maxSize: number, quality = 0.85) {
  const url = URL.createObjectURL(file)
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image()
      el.onload = () => resolve(el)
      el.onerror = () => reject(new Error('Could not read this image'))
      el.src = url
    })
    const scale = Math.min(1, maxSize / Math.max(img.width, img.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(img.width * scale)
    canvas.height = Math.round(img.height * scale)
    canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height)
    const blob = await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error('Could not process image'))),
        'image/jpeg',
        quality,
      ),
    )
    return { blob, dataUrl: canvas.toDataURL('image/jpeg', 0.7) }
  } finally {
    URL.revokeObjectURL(url)
  }
}

export async function identifyCar(image: Blob, market: string): Promise<CarResult> {
  const body = new FormData()
  body.append('image', image, 'car.jpg')
  body.append('market', market)
  const res = await fetch('/api/identify', { method: 'POST', body })
  const json = await res.json().catch(() => null)
  if (!res.ok || !json) {
    throw new Error(json?.error ?? 'Something went wrong. Please try again.')
  }
  return json as CarResult
}

export function formatPrice(price: CarResult['price']) {
  if (!price?.min && !price?.max) return null
  const currency = price.currency && /^[A-Z]{3}$/.test(price.currency) ? price.currency : 'USD'
  const fmt = new Intl.NumberFormat(currency === 'INR' ? 'en-IN' : 'en', {
    style: 'currency',
    currency,
    notation: 'compact',
    maximumFractionDigits: 2,
  })
  if (price.min && price.max && price.min !== price.max) {
    return `${fmt.format(price.min)} – ${fmt.format(price.max)}`
  }
  return fmt.format((price.min ?? price.max)!)
}

export function carTitle(r: CarResult) {
  return [r.make, r.model].filter(Boolean).join(' ') || 'Unknown car'
}
