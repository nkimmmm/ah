import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

type Reading = {
  id: number
  created_at: string
  value: number
}

type ConnectionState = 'connecting' | 'connected' | 'error'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null

function parseReading(row: Record<string, unknown>): Reading | null {
  const id = Number(row.id)
  const value = Number(row.value)
  const createdAt = typeof row.created_at === 'string' ? row.created_at : ''

  if (!Number.isFinite(id) || !Number.isFinite(value) || !createdAt) return null
  return { id, created_at: createdAt, value }
}

function mergeReadings(current: Reading[], incoming: Reading[]): Reading[] {
  const byId = new Map(current.map((reading) => [reading.id, reading]))
  incoming.forEach((reading) => byId.set(reading.id, reading))
  return [...byId.values()]
    .sort((a, b) => Date.parse(a.created_at) - Date.parse(b.created_at))
    .slice(-100)
}

function formatTime(value: string | undefined): string {
  if (!value) return '아직 수신된 데이터가 없습니다.'
  return new Intl.DateTimeFormat('ko-KR', {
    dateStyle: 'medium',
    timeStyle: 'medium',
  }).format(new Date(value))
}

function ReadingsChart({ readings }: { readings: Reading[] }) {
  const observedMin = Math.min(...readings.map((reading) => reading.value))
  const observedMax = Math.max(...readings.map((reading) => reading.value))
  const flatPadding = Math.max(Math.abs(observedMax) * 0.05, 1)
  const min = observedMin === observedMax ? observedMin - flatPadding : observedMin
  const max = observedMin === observedMax ? observedMax + flatPadding : observedMax
  const span = max - min || 1
  const x = (index: number) => 48 + (index / Math.max(readings.length - 1, 1)) * 604
  const y = (value: number) => 208 - ((value - min) / span) * 166
  const path = readings.map((reading, index) => `${index === 0 ? 'M' : 'L'} ${x(index)} ${y(reading.value)}`).join(' ')

  return (
    <div className="chart-scroll">
      <svg className="line-chart live-readings-chart" viewBox="0 0 700 252" role="img" aria-label={`Supabase 최근 ${readings.length}개 센서값 선 그래프`}>
        {[0, .25, .5, .75, 1].map((step) => {
          const value = max - span * step
          const lineY = 42 + step * 166
          return (
            <g key={step}>
              <line x1="48" y1={lineY} x2="652" y2={lineY} className="grid" />
              <text x="40" y={lineY + 4} textAnchor="end" className="axis">
                {value.toLocaleString('ko-KR', { maximumFractionDigits: 2 })}
              </text>
            </g>
          )
        })}
        {readings.length > 1 && <path d={`${path} L 652 208 L 48 208 Z`} className="reading-area" />}
        {readings.length > 1 && <path d={path} className="trend-line" />}
        {readings.length === 1 && <circle cx={x(0)} cy={y(readings[0].value)} r="5" className="trend-dot" />}
        {readings.length > 1 && <circle cx={x(readings.length - 1)} cy={y(readings[readings.length - 1].value)} r="5" className="trend-dot" />}
        <text x="48" y="239" className="axis">{formatTime(readings[0]?.created_at)}</text>
        <text x="652" y="239" textAnchor="end" className="axis">{formatTime(readings[readings.length - 1]?.created_at)}</text>
      </svg>
    </div>
  )
}

export default function App() {
  const [readings, setReadings] = useState<Reading[]>([])
  const [connection, setConnection] = useState<ConnectionState>('connecting')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!supabase) {
      setConnection('error')
      setError('VITE_SUPABASE_URL 또는 VITE_SUPABASE_ANON_KEY를 .env에서 찾을 수 없습니다.')
      setLoading(false)
      return
    }

    let active = true
    const channel = supabase
      .channel('dashboard-readings')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'readings',
      }, (payload) => {
        const reading = parseReading(payload.new as Record<string, unknown>)
        if (reading && active) setReadings((current) => mergeReadings(current, [reading]))
      })
      .subscribe((status, subscriptionError) => {
        if (!active) return
        if (status === 'SUBSCRIBED') {
          setConnection('connected')
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          setConnection('error')
          setError(subscriptionError?.message || 'Realtime 구독에 실패했습니다. Supabase에서 readings Realtime 활성화를 확인하세요.')
        }
      })

    const loadLatest = async () => {
      const { data, error: queryError } = await supabase
        .from('readings')
        .select('id, created_at, value')
        .order('created_at', { ascending: false })
        .limit(100)

      if (!active) return
      if (queryError) {
        setError(`readings 조회 실패: ${queryError.message}`)
      } else {
        const latest = (data ?? [])
          .map((row) => parseReading(row as unknown as Record<string, unknown>))
          .filter((reading): reading is Reading => reading !== null)
        setReadings((current) => mergeReadings(current, latest))
      }
      setLoading(false)
    }

    void loadLatest()
    return () => {
      active = false
      void supabase.removeChannel(channel)
    }
  }, [])

  const latest = readings[readings.length - 1]
  const connectionText = connection === 'connected'
    ? 'Realtime 연결됨'
    : connection === 'error'
      ? '연결 확인 필요'
      : 'Realtime 연결 중'

  return (
    <main>
      <header>
        <div className="brand"><span className="brand-mark">S</span><span>SENSOR <b>STREAM</b></span></div>
        <div className="header-meta"><span>SUPABASE · PUBLIC.READINGS</span></div>
      </header>

      <section className="hero">
        <p className="eyebrow">LIVE SENSOR MONITOR · REALTIME</p>
        <h1>Sensor readings</h1>
        <p>Supabase에 저장된 센서값을 실시간으로 확인합니다.<small>Latest value and the most recent 100 readings.</small></p>
      </section>

      <div className="live-dashboard">
        <section className="live-overview" aria-label="최신 센서값">
          <div>
            <p className="live-label">현재값 <small>LATEST VALUE</small></p>
            <strong className="live-value">
              {latest ? latest.value.toLocaleString('ko-KR', { maximumFractionDigits: 4 }) : '—'}
            </strong>
          </div>
          <div className="live-meta">
            <span className={`connection-state ${connection}`}><i />{connectionText}</span>
            <span>수신 시각 · {formatTime(latest?.created_at)}</span>
            <span>그래프 데이터 · {readings.length} / 100</span>
          </div>
        </section>

        <article className="panel wide live-chart-panel">
          <div className="panel-head">
            <div><h3>최근 센서값 <small>LAST 100 READINGS</small></h3><p>단위: readings.value · 시간순</p></div>
            <span className="legend"><i />Supabase Realtime</span>
          </div>
          {error && <p className="live-error" role="alert">{error}</p>}
          {loading && readings.length === 0
            ? <div className="serial-empty">Supabase에서 최근 데이터를 불러오는 중입니다.</div>
            : readings.length
              ? <ReadingsChart readings={readings} />
              : <div className="serial-empty">아직 readings 데이터가 없습니다.</div>}
        </article>
      </div>

      <footer><span>DATA SOURCE · Supabase public.readings</span><span>새 INSERT 행은 Realtime으로 반영됩니다.</span></footer>
    </main>
  )
}
