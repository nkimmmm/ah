import type { CSSProperties } from "react"
import { SENSOR_MAX, SENSOR_MIN } from "../product"

type Props = {
  value?: number
  power: boolean
}

export default function SensorMoon({ value, power }: Props) {
  const level =
    value === undefined
      ? 0
      : Math.min(
          1,
          Math.max(0, (value - SENSOR_MIN) / (SENSOR_MAX - SENSOR_MIN)),
        )
  const brightness = Math.round(level * 100)
  const style = { "--level": level } as CSSProperties

  return (
    <section className="moon-section" aria-label="조명 상태">
      <div
        className="moon"
        style={style}
        data-power={power ? "on" : "off"}
        role="img"
        aria-label={power ? `조명 밝기 ${brightness}%` : "조명 꺼짐"}
      >
        <img src="/images/lamp.png" alt="" />
      </div>
      <p className="t-value current-value">
        {value === undefined ? "—" : value.toLocaleString("ko-KR")}
      </p>
    </section>
  )
}
