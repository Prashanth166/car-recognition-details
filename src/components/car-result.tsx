import {
  CalendarDays,
  Fuel,
  Gauge,
  Cog,
  Users,
  Zap,
  Timer,
  Route as RouteIcon,
  Wrench,
  CircleDot,
  Tag,
  Sparkles,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { carTitle, formatPrice, type CarResult, type CarSpecs } from '@/lib/car'

const SPEC_ROWS: { key: keyof CarSpecs; label: string; icon: LucideIcon }[] = [
  { key: 'engine', label: 'Engine', icon: Wrench },
  { key: 'power', label: 'Power', icon: Zap },
  { key: 'torque', label: 'Torque', icon: Cog },
  { key: 'transmission', label: 'Transmission', icon: CircleDot },
  { key: 'drivetrain', label: 'Drivetrain', icon: RouteIcon },
  { key: 'fuelType', label: 'Fuel', icon: Fuel },
  { key: 'mileage', label: 'Mileage / Range', icon: Gauge },
  { key: 'acceleration', label: '0–100 km/h', icon: Timer },
  { key: 'topSpeed', label: 'Top speed', icon: Gauge },
  { key: 'seating', label: 'Seating', icon: Users },
]

export function CarResultCard({ result, image }: { result: CarResult; image: string }) {
  const price = formatPrice(result.price)
  const specs = SPEC_ROWS.filter((row) => result.specs?.[row.key])
  const confidence = Math.max(0, Math.min(100, Math.round(result.confidence)))
  const variant = [result.generation, result.trim].filter(Boolean).join(' · ')

  return (
    <article className="overflow-hidden rounded-xl border bg-card animate-in fade-in slide-in-from-bottom-4 duration-500 motion-reduce:animate-none">
      <div className="grid md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <div className="relative bg-muted">
          <img src={image} alt={carTitle(result)} className="h-full max-h-96 w-full object-cover md:max-h-none" />
          <div className="absolute left-3 top-3">
            <Badge className="bg-background/80 text-foreground backdrop-blur">
              {confidence}% match
            </Badge>
          </div>
        </div>

        <div className="flex flex-col gap-6 p-6 sm:p-8">
          <header>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-primary">
              {result.make ?? 'Identified'}
              {result.bodyType ? ` / ${result.bodyType}` : ''}
            </p>
            <h2 className="mt-2 font-display text-4xl font-extrabold uppercase leading-none tracking-tight sm:text-5xl">
              {carTitle(result)}
            </h2>
            {variant && <p className="mt-2 text-muted-foreground">{variant}</p>}
          </header>

          <div className="grid gap-3 sm:grid-cols-2">
            <Stat icon={CalendarDays} label="Launched in market" value={result.launchYear ?? '—'} sub={result.productionYears} />
            <Stat
              icon={Tag}
              label={`${result.price?.condition === 'used' ? 'Used value' : 'Price today'} · ${result.market}`}
              value={price ?? 'Not available'}
              sub={result.price?.note}
              accent
            />
          </div>

          {result.summary && <p className="leading-relaxed text-muted-foreground">{result.summary}</p>}

          {result.highlights && result.highlights.length > 0 && (
            <ul className="flex flex-wrap gap-2">
              {result.highlights.map((h) => (
                <li key={h} className="flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm">
                  <Sparkles className="size-3.5 text-primary" aria-hidden />
                  {h}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {specs.length > 0 && (
        <section className="border-t p-6 sm:p-8">
          <h3 className="font-display text-xl font-bold uppercase tracking-wide">Spec sheet</h3>
          <dl className="mt-4 grid gap-px overflow-hidden rounded-lg border bg-border sm:grid-cols-2 lg:grid-cols-3">
            {specs.map(({ key, label, icon: Icon }) => (
              <div key={key} className="flex items-start gap-3 bg-card p-4">
                <Icon className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                <div>
                  <dt className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">{label}</dt>
                  <dd className="mt-0.5 font-medium">{result.specs![key]}</dd>
                </div>
              </div>
            ))}
          </dl>
        </section>
      )}

      {result.alternatives && result.alternatives.length > 0 && confidence < 85 && (
        <p className="border-t px-6 py-4 text-sm text-muted-foreground sm:px-8">
          Could also be: {result.alternatives.join(', ')}
        </p>
      )}
    </article>
  )
}

function Stat({
  icon: Icon,
  label,
  value,
  sub,
  accent,
}: {
  icon: LucideIcon
  label: string
  value: string
  sub?: string
  accent?: boolean
}) {
  return (
    <div className={accent ? 'rounded-lg border border-primary/40 bg-primary/10 p-4' : 'rounded-lg border bg-muted/50 p-4'}>
      <p className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
        <Icon className="size-3.5" aria-hidden />
        {label}
      </p>
      <p className={`mt-1 font-display text-3xl font-bold ${accent ? 'text-primary' : ''}`}>{value}</p>
      {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
    </div>
  )
}
