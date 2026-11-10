import { useState } from "react"
import { setLedPower } from "../lib/device"

type Props = {
  power: boolean
  onPowerChange: (power: boolean) => void
}

export default function PowerToggle({ power, onPowerChange }: Props) {
  const [error, setError] = useState(false)

  const togglePower = async () => {
    const nextPower = !power
    setError(false)
    onPowerChange(nextPower)
    const succeeded = await setLedPower(nextPower)
    if (!succeeded) {
      onPowerChange(power)
      setError(true)
    }
  }

  return (
    <div>
      <div className="control-row">
        <div>
          <p className="t-label control-name">LED 전원</p>
          <p className="t-caption power-copy">{power ? "켜짐" : "꺼짐"}</p>
        </div>
        <button
          className={`power-toggle ${power ? "on" : ""}`}
          type="button"
          role="switch"
          aria-checked={power}
          aria-label="LED 전원"
          onClick={() => void togglePower()}
        >
          <span className="power-track" aria-hidden="true">
            <span />
          </span>
        </button>
      </div>
      {error && (
        <p className="t-caption power-error" role="alert">
          전원 변경 실패, 다시 시도
        </p>
      )}
    </div>
  )
}
