import { useCallback, useEffect, useRef, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { ImageUp, Loader2, RotateCcw, ScanLine, Trash2, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CarResultCard } from '@/components/car-result'
import { MARKETS, carTitle, formatPrice, identifyCar, resizeImage, type Scan } from '@/lib/car'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/')({
  component: Home,
})

const HISTORY_KEY = 'carlens:scans'
const MARKET_KEY = 'carlens:market'

type Status =
  | { kind: 'idle' }
  | { kind: 'analyzing'; preview: string }
  | { kind: 'done'; scan: Scan }
  | { kind: 'notCar'; preview: string }
  | { kind: 'error'; preview: string; message: string }

function Home() {
  const [status, setStatus] = useState<Status>({ kind: 'idle' })
  const [market, setMarket] = useState<string>('India')
  const [history, setHistory] = useState<Scan[]>([])
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const resultRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    try {
      const saved = localStorage.getItem(HISTORY_KEY)
      if (saved) setHistory(JSON.parse(saved))
      const m = localStorage.getItem(MARKET_KEY)
      if (m) setMarket(m)
    } catch {
      // ignore corrupt storage
    }
  }, [])

  const saveHistory = (next: Scan[]) => {
    setHistory(next)
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(next))
    } catch {
      // storage full; keep in memory only
    }
  }

  const handleFile = useCallback(
    async (file: File | undefined) => {
      if (!file) return
      if (!file.type.startsWith('image/')) {
        toast.error('Please choose an image file')
        return
      }
      let preview = ''
      try {
        const upload = await resizeImage(file, 1280)
        preview = upload.dataUrl
        setStatus({ kind: 'analyzing', preview })
        requestAnimationFrame(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
        const [result, thumb] = await Promise.all([
          identifyCar(upload.blob, market),
          resizeImage(file, 320, 0.7).then((t) => t.dataUrl),
        ])
        if (!result.isCar) {
          setStatus({ kind: 'notCar', preview })
          return
        }
        const scan: Scan = { id: crypto.randomUUID(), thumb, result, scannedAt: Date.now() }
        setStatus({ kind: 'done', scan: { ...scan, thumb: preview } })
        saveHistory([scan, ...history].slice(0, 8))
      } catch (err) {
        setStatus({
          kind: 'error',
          preview,
          message: err instanceof Error ? err.message : 'Something went wrong',
        })
      }
    },
    [market, history],
  )

  const busy = status.kind === 'analyzing'

  return (
    <div className="min-h-screen">
      <header className="absolute inset-x-0 top-0 z-10">
        <div className="mx-auto flex max-w-content items-center justify-between px-4 py-5 sm:px-6">
          <a href="/" className="flex items-center gap-2 font-display text-2xl font-extrabold uppercase tracking-wide">
            <ScanLine className="size-6 text-primary" aria-hidden />
            Car<span className="text-primary">Lens</span>
          </a>
          <span className="hidden font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground sm:block">
            AI car recognition
          </span>
        </div>
      </header>

      <section className="relative overflow-hidden border-b">
        <img
          src="/.netlify/images?url=/img/hero.png&w=1800&fm=webp&q=75"
          alt=""
          className="absolute inset-0 h-full w-full object-cover object-[70%_center] opacity-70"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/85 to-background/10" />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-background to-transparent" />

        <div className="relative mx-auto grid max-w-content gap-10 px-4 pb-16 pt-32 sm:px-6 lg:grid-cols-[1.1fr_1fr] lg:pb-24 lg:pt-40">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.25em] text-primary">Snap · Upload · Know</p>
            <h1 className="mt-4 font-display text-5xl font-extrabold uppercase leading-[0.9] tracking-tight sm:text-7xl">
              Name that car
              <br />
              from <span className="text-primary">one photo</span>
            </h1>
            <p className="mt-6 max-w-md text-lg text-muted-foreground">
              Upload any car picture and CarLens tells you the make and model, when it launched in the market, its full
              spec sheet, and what it costs today.
            </p>
          </div>

          <div className="flex flex-col gap-4">
            <button
              type="button"
              disabled={busy}
              onClick={() => inputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault()
                setDragging(true)
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => {
                e.preventDefault()
                setDragging(false)
                handleFile(e.dataTransfer.files[0])
              }}
              className={cn(
                'group flex min-h-64 flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed bg-card/70 p-8 text-center backdrop-blur transition-colors motion-reduce:transition-none',
                'hover:border-primary hover:bg-card/90 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:opacity-60',
                dragging && 'border-primary bg-primary/10',
              )}
            >
              <span className="flex size-16 items-center justify-center rounded-full bg-primary text-primary-foreground transition-transform group-hover:scale-105 motion-reduce:transition-none">
                {busy ? <Loader2 className="size-7 animate-spin" aria-hidden /> : <ImageUp className="size-7" aria-hidden />}
              </span>
              <span className="font-display text-2xl font-bold uppercase tracking-wide">
                {busy ? 'Analysing…' : 'Drop a car photo'}
              </span>
              <span className="text-sm text-muted-foreground">or click to browse · JPG, PNG, WebP</span>
            </button>
            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              aria-label="Upload car photo"
              onChange={(e) => {
                handleFile(e.target.files?.[0])
                e.target.value = ''
              }}
            />

            <div className="flex flex-wrap items-center gap-3">
              <label htmlFor="market" className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                Prices for
              </label>
              <Select
                value={market}
                onValueChange={(v) => {
                  setMarket(v)
                  localStorage.setItem(MARKET_KEY, v)
                }}
              >
                <SelectTrigger id="market" className="w-52 bg-card/80">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MARKETS.map((m) => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-content px-4 py-12 sm:px-6">
        <div ref={resultRef} className="scroll-mt-6">
          {status.kind === 'idle' && <HowItWorks />}
          {status.kind === 'analyzing' && <AnalyzingCard preview={status.preview} />}
          {status.kind === 'done' && <CarResultCard result={status.scan.result} image={status.scan.thumb} />}
          {status.kind === 'notCar' && (
            <Alert>
              <AlertTriangle />
              <AlertTitle>No car spotted</AlertTitle>
              <AlertDescription>
                We couldn't find a car in that photo. Try a clearer shot with the whole vehicle in frame.
              </AlertDescription>
            </Alert>
          )}
          {status.kind === 'error' && (
            <Alert variant="destructive">
              <AlertTriangle />
              <AlertTitle>Analysis failed</AlertTitle>
              <AlertDescription>
                {status.message}
                <Button size="sm" variant="outline" className="mt-3" onClick={() => inputRef.current?.click()}>
                  <RotateCcw /> Try another photo
                </Button>
              </AlertDescription>
            </Alert>
          )}
          {status.kind !== 'idle' && status.kind !== 'analyzing' && (
            <div className="mt-6 flex justify-center">
              <Button onClick={() => inputRef.current?.click()}>
                <ImageUp /> Identify another car
              </Button>
            </div>
          )}
        </div>

        {history.length > 0 && (
          <section className="mt-16">
            <div className="flex items-end justify-between gap-4">
              <h2 className="font-display text-3xl font-bold uppercase tracking-wide">Your garage</h2>
              <Button variant="ghost" size="sm" onClick={() => saveHistory([])}>
                <Trash2 /> Clear
              </Button>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">Recent identifications, saved on this device.</p>
            <ul className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {history.map((scan) => (
                <li key={scan.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setStatus({ kind: 'done', scan })
                      resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                    }}
                    className="group block w-full overflow-hidden rounded-lg border bg-card text-left transition-colors hover:border-primary focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 motion-reduce:transition-none"
                  >
                    <img src={scan.thumb} alt="" className="aspect-[4/3] w-full object-cover" />
                    <div className="p-3">
                      <p className="truncate font-display text-lg font-bold uppercase leading-tight">
                        {carTitle(scan.result)}
                      </p>
                      <p className="truncate font-mono text-xs text-muted-foreground">
                        {scan.result.launchYear ?? '—'} · {formatPrice(scan.result.price) ?? 'Price n/a'}
                      </p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>

      <footer className="border-t">
        <p className="mx-auto max-w-content px-4 py-6 text-xs text-muted-foreground sm:px-6">
          CarLens results are AI estimates. Prices are approximate and vary by city, variant, taxes and dealer — confirm
          with a dealer before buying.
        </p>
      </footer>
    </div>
  )
}

function AnalyzingCard({ preview }: { preview: string }) {
  return (
    <div className="overflow-hidden rounded-xl border bg-card md:grid md:grid-cols-[5fr_7fr]" aria-busy="true">
      <div className="relative overflow-hidden bg-muted">
        <img src={preview} alt="Uploaded car" className="h-full max-h-96 w-full object-cover opacity-80" />
        <div className="absolute inset-x-0 top-0 h-1 animate-[scan_1.8s_ease-in-out_infinite] bg-primary shadow-[0_0_24px_4px] shadow-primary motion-reduce:hidden" />
      </div>
      <div className="flex flex-col gap-4 p-6 sm:p-8">
        <p className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.2em] text-primary">
          <Loader2 className="size-3.5 animate-spin" aria-hidden /> Scanning body lines, grille & badges…
        </p>
        <Skeleton className="h-12 w-3/4" />
        <div className="grid gap-3 sm:grid-cols-2">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
      </div>
    </div>
  )
}

function HowItWorks() {
  const steps = [
    { n: '01', title: 'Upload a photo', body: 'Any angle works — street shots, car shows, screenshots or ads.' },
    { n: '02', title: 'AI recognition', body: 'Grille, headlights and body lines are matched to the exact make and model.' },
    { n: '03', title: 'Get the details', body: 'Launch year, engine, power, mileage and today’s price in your market.' },
  ]
  return (
    <section>
      <h2 className="font-display text-3xl font-bold uppercase tracking-wide">How it works</h2>
      <ol className="mt-6 grid gap-4 md:grid-cols-3">
        {steps.map((s) => (
          <li key={s.n} className="rounded-xl border bg-card p-6">
            <span className="font-mono text-sm text-primary">{s.n}</span>
            <h3 className="mt-3 font-display text-2xl font-bold uppercase">{s.title}</h3>
            <p className="mt-2 text-muted-foreground">{s.body}</p>
          </li>
        ))}
      </ol>
    </section>
  )
}
