import { useEffect, useRef, useState } from "react"
import type { Reading } from "../lib/device"
import { SENSOR_MAX } from "../product"

const HEIGHT = 200
const LEFT = 40
const RIGHT = 8
const TOP = 8
const BOTTOM = 20

export default function SensorChart({ readings }: { readings: Reading[] }) {
  const sectionRef = useRef<HTMLElement>(null)
  const [width, setWidth] = useState(0)

  useEffect(() => {
    const element = sectionRef.current
    if (!element) return

    const observer = new ResizeObserver(([entry]) => {
      setWidth(entry.contentRect.width)
    })
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  const plotWidth = Math.max(0, width - LEFT - RIGHT)
  const plotHeight = HEIGHT - TOP - BOTTOM
  const points = readings
    .map((reading, index) => {
      const x = LEFT + (index / Math.max(1, readings.length - 1)) * plotWidth
      const normalized = Math.min(1, Math.max(0, reading.value / SENSOR_MAX))
      const y = TOP + (1 - normalized) * plotHeight
      return `${x},${y}`
    })
    .join(" ")
  const latest = readings.at(-1)?.value

  return (
    <section
      className="chart-section"
      aria-label="실시간 센서값"
      ref={sectionRef}
    >
      {readings.length === 0 ? (
        <p className="t-body chart-empty">
          센서를 연결하면 값이 여기에 그려집니다.
        </p>
      ) : (
        <svg
          width={width}
          height={HEIGHT}
          viewBox={`0 0 ${width} ${HEIGHT}`}
          role="img"
          aria-label={`센서값 추이, 현재 ${latest?.toLocaleString("ko-KR")}`}
        >
          {[SENSOR_MAX, SENSOR_MAX / 2, 0].map((value) => {
            const y = TOP + (1 - value / SENSOR_MAX) * plotHeight
            return (
              <g key={value}>
                <line
                  className="chart-grid"
                  x1={LEFT}
                  x2={width - RIGHT}
                  y1={y}
                  y2={y}
                />
                <text className="chart-label" x={LEFT - 4} y={y + 4}>
                  {Math.round(value).toLocaleString("ko-KR")}
                </text>
              </g>
            )
          })}
          <polyline className="chart-line" points={points} />
          <text
            className="chart-label chart-label-start"
            x={LEFT}
            y={HEIGHT - 2}
          >
            −60s
          </text>
          <text
            className="chart-label chart-label-end"
            x={width - RIGHT}
            y={HEIGHT - 2}
          >
            지금
          </text>
        </svg>
      )}
    </section>
  )
}
