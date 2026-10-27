import { useMemo, useState } from 'react'

type Region = { name: string; values: (number | null)[] }

const periods = ['2026.03', '2026.04', '2026.05', '2026.06', '2026.07', '2026.08']
const rows: Region[] = [
  { name: '전국', values: [43126, 52056, 36291, 41487, 34764, 23419] },
  { name: '강원특별자치도', values: [1125, 2907, 2594, 3954, 2354, 699] },
  { name: '경기도', values: [7449, 10251, 7431, 8487, 7330, 5513] },
  { name: '경상남도', values: [2645, 2792, 2322, 2200, 2076, 1714] },
  { name: '경상북도', values: [2272, 4718, 4429, 4034, 2786, 1372] },
  { name: '광주광역시', values: [913, 812, 219, 407, null, null] },
  { name: '대구광역시', values: [1265, 842, 387, 672, 466, 381] },
  { name: '대전광역시', values: [1842, 517, 148, 423, 397, 252] },
  { name: '부산광역시', values: [2909, 2886, 610, 1055, 1305, 562] },
  { name: '서울특별시', values: [11024, 9662, 3871, 4816, 4193, 3787] },
  { name: '세종특별자치시', values: [222, 84, 82, 75, 66, 75] },
  { name: '울산광역시', values: [608, 405, 369, 348, 594, 404] },
  { name: '인천광역시', values: [1599, 1530, 1182, 1258, 1291, 1258] },
  { name: '전라남도', values: [2071, 3254, 3622, 3367, null, null] },
  { name: '전북특별자치도', values: [2064, 3209, 2415, 3745, 2894, 1102] },
  { name: '제주특별자치도', values: [516, 686, 448, 668, 764, 728] },
  { name: '충청남도', values: [3197, 4565, 3409, 3948, 3681, 2401] },
  { name: '충청북도', values: [1405, 2936, 2753, 2030, 1301, 911] },
  { name: '전남광주통합특별시', values: [null, null, null, null, 3266, 2260] },
]

const fmt = (value: number | null) => (value == null ? '자료 없음' : `${value.toLocaleString('ko-KR')}세대`)

function SearchIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4 4" /></svg>
}

function TrendChart({ region }: { region: Region }) {
  const valid = region.values.filter((v): v is number => v !== null)
  const max = Math.ceil(Math.max(...valid) / 1000) * 1000 || 1
  const x = (i: number) => 58 + i * 119
  const y = (v: number) => 224 - (v / max) * 176
  const path = region.values
    .map((v, i) => (v == null ? '' : `${i === 0 || region.values[i - 1] == null ? 'M' : 'L'} ${x(i)} ${y(v)}`))
    .join(' ')

  return (
    <div className="chart-scroll">
      <svg className="line-chart" viewBox="0 0 700 270" role="img" aria-label={`${region.name} 월별 추이`}>
        {[0, .25, .5, .75, 1].map((t) => (
          <g key={t}>
            <line x1="58" y1={224 - t * 176} x2="653" y2={224 - t * 176} className="grid" />
            <text x="48" y={228 - t * 176} textAnchor="end" className="axis">{Math.round(max * t / 1000)}k</text>
          </g>
        ))}
        <path d={path} className="trend-area" />
        <path d={path} className="trend-line" />
        {region.values.map((v, i) => v != null && (
          <g key={periods[i]}>
            <circle cx={x(i)} cy={y(v)} r="5" className="trend-dot" />
            <text x={x(i)} y={y(v) - 13} textAnchor="middle" className="value-label">{v.toLocaleString()}</text>
          </g>
        ))}
        {periods.map((p, i) => <text key={p} x={x(i)} y="250" textAnchor="middle" className="axis">{p.slice(5)}월</text>)}
      </svg>
    </div>
  )
}

function NormalizedChart({ selected }: { selected: string }) {
  const chartRows = rows.slice(1).filter((r) => r.values.filter((v) => v != null).length > 1)
  const x = (i: number) => 46 + i * 121
  const y = (v: number) => 214 - v * 168

  return (
    <div className="chart-scroll">
      <svg className="line-chart" viewBox="0 0 700 255" role="img" aria-label="지역별 정규화 추이">
        {[0, .25, .5, .75, 1].map((t) => (
          <g key={t}>
            <line x1="46" y1={y(t)} x2="651" y2={y(t)} className="grid" />
            <text x="36" y={y(t) + 4} textAnchor="end" className="axis">{t.toFixed(t === 0 || t === 1 ? 0 : 2)}</text>
          </g>
        ))}
        {chartRows.map((r) => {
          const valid = r.values.filter((v): v is number => v != null)
          const min = Math.min(...valid), max = Math.max(...valid)
          const points = r.values.map((v, i) => v == null ? '' : `${i === 0 || r.values[i - 1] == null ? 'M' : 'L'} ${x(i)} ${y(max === min ? .5 : (v - min) / (max - min))}`).join(' ')
          return <path key={r.name} d={points} className={r.name === selected ? 'norm-line selected' : 'norm-line'} />
        })}
        {periods.map((p, i) => <text key={p} x={x(i)} y="239" textAnchor="middle" className="axis">{p.slice(5)}월</text>)}
      </svg>
    </div>
  )
}

export default function App() {
  const [selected, setSelected] = useState('전국')
  const [query, setQuery] = useState('')
  const [periodIndex, setPeriodIndex] = useState(periods.length - 1)
  const current = rows.find((r) => r.name === selected) ?? rows[0]
  const latest = current.values[periodIndex]
  const previous = periodIndex > 0 ? current.values[periodIndex - 1] : null
  const delta = latest != null && previous != null ? ((latest - previous) / previous) * 100 : null
  const results = rows.filter((r) => r.name.includes(query.trim()))
  const ranking = useMemo(() => rows.slice(1).filter((r) => r.values[periodIndex] != null)
    .sort((a, b) => (b.values[periodIndex] ?? 0) - (a.values[periodIndex] ?? 0)), [periodIndex])
  const rankMax = ranking[0]?.values[periodIndex] ?? 1

  const choose = (name: string) => {
    setSelected(name)
    setQuery('')
  }

  return (
    <main>
      <header>
        <div className="brand"><span className="brand-mark">K</span><span>KOSIS <b>VIEW</b></span></div>
        <div className="header-meta"><span>통계청 공개데이터</span><i /><span>2026.03 — 2026.08</span></div>
      </header>

      <section className="hero">
        <p className="eyebrow">POPULATION MOVEMENT · 2026</p>
        <h1>Foreign Resident Inflow by Region</h1>
        <p>전국 및 시도별 외국인 신규 유입 세대의 흐름을 한눈에 살펴보세요.<small>Explore new foreign resident household inflows across Korea.</small></p>
        <div className="search-wrap">
          <SearchIcon />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="지역 검색 · Search regions (예: 서울, 경기도)" aria-label="지역 검색" />
          <kbd>⌘ K</kbd>
          {query && (
            <div className="search-results">
              {results.length ? results.map((r) => (
                <button key={r.name} onClick={() => choose(r.name)}><span>{r.name}</span><small>{fmt(r.values[periodIndex])}</small></button>
              )) : <p>일치하는 지역이 없습니다.</p>}
            </div>
          )}
        </div>
      </section>

      <div className="content">
        <nav className="region-nav" aria-label="지역 선택">
          <div className="nav-title"><span>지역 선택 <em>REGIONS</em></span><small>{rows.length}</small></div>
          {rows.map((r) => (
            <button key={r.name} className={selected === r.name ? 'active' : ''} onClick={() => choose(r.name)}>
              <span>{r.name}</span><span className="chevron">›</span>
            </button>
          ))}
        </nav>

        <div className="dashboard">
          <div className="section-heading">
            <div><p>선택 지역 · SELECTED REGION</p><h2>{selected}</h2></div>
            <label>기준 시점 · PERIOD<select value={periodIndex} onChange={(e) => setPeriodIndex(Number(e.target.value))}>{periods.map((p, i) => <option value={i} key={p}>{p.replace('.', '년 ')}월</option>)}</select></label>
          </div>

          <div className="stats">
            <article><p>{periods[periodIndex].replace('.', '년 ')}월 신규 유입 <small>NEW INFLOW</small></p><strong>{fmt(latest).replace('세대', '')}</strong><span>세대 · households</span></article>
            <article><p>전월 대비 <small>MONTH-OVER-MONTH</small></p><strong className={delta != null && delta < 0 ? 'down' : 'up'}>{delta == null ? '—' : `${delta > 0 ? '+' : ''}${delta.toFixed(1)}%`}</strong><span>{previous == null ? '비교 자료 없음' : `전월 ${fmt(previous)}`}</span></article>
            <article><p>지역 순위 <small>REGIONAL RANK</small></p><strong>{selected === '전국' ? '—' : `${ranking.findIndex((r) => r.name === selected) + 1}위`}</strong><span>전체 {ranking.length}개 지역</span></article>
          </div>

          <article className="panel wide">
            <div className="panel-head"><div><h3>월별 유입 추이 <small>MONTHLY TREND</small></h3><p>단위: 세대 · Unit: households</p></div><span className="legend"><i />{selected}</span></div>
            <TrendChart region={current} />
          </article>

          <div className="panel-grid">
            <article className="panel ranking-panel">
              <div className="panel-head"><div><h3>지역별 유입 순위 <small>REGIONAL RANKING</small></h3><p>{periods[periodIndex].replace('.', '년 ')}월 · 단위: 세대</p></div></div>
              <div className="bars">
                {ranking.slice(0, 8).map((r, i) => (
                  <button key={r.name} onClick={() => choose(r.name)}>
                    <b>{String(i + 1).padStart(2, '0')}</b><span className="bar-name">{r.name}</span>
                    <span className="bar-track"><i style={{ width: `${((r.values[periodIndex] ?? 0) / rankMax) * 100}%` }} /></span>
                    <strong>{(r.values[periodIndex] ?? 0).toLocaleString()}</strong>
                  </button>
                ))}
              </div>
            </article>

            <article className="panel">
              <div className="panel-head"><div><h3>지역별 정규화 추이 <small>NORMALIZED TREND</small></h3><p>지역별 최솟값 0 · 최댓값 1</p></div><span className="legend"><i />{selected}</span></div>
              <NormalizedChart selected={selected} />
              <p className="note">각 지역의 기간 내 최솟값과 최댓값을 기준으로 정규화했습니다. · Normalized to each region’s minimum and maximum.</p>
            </article>
          </div>
        </div>
      </div>
      <footer><span>출처 · Source: 통계청 (Statistics Korea)</span><span>결측값(-)은 계산에서 제외되었습니다. · Missing values are excluded.</span></footer>
    </main>
  )
}
