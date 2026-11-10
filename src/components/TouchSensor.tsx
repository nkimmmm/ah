import { useRef, useState } from "react"
import { setLedPower } from "../lib/device"

type Props = {
  power: boolean
  onPowerChange: (power: boolean) => void
}

export default function TouchSensor({ power, onPowerChange }: Props) {
  const [pressed, setPressed] = useState(false)
  const [error, setError] = useState(false)
  const pressedRef = useRef(false)
  const desiredPower = useRef(power)
  const updateQueue = useRef(Promise.resolve())

  const changePower = (nextPower: boolean) => {
    desiredPower.current = nextPower
    onPowerChange(nextPower)
    setError(false)

    updateQueue.current = updateQueue.current.then(async () => {
      const succeeded = await setLedPower(nextPower)
      if (!succeeded && desiredPower.current === nextPower) {
        onPowerChange(!nextPower)
        setError(true)
      }
    })
  }

  const startPress = () => {
    if (pressedRef.current) return
    pressedRef.current = true
    setPressed(true)
    changePower(true)
  }

  const endPress = () => {
    if (!pressedRef.current) return
    pressedRef.current = false
    setPressed(false)
    changePower(false)
  }

  return (
    <div className="touch-control">
      <button
        className={`t-label touch-sensor ${pressed ? "active" : ""}`}
        type="button"
        aria-label="터치 센서, 누르는 동안 조명 켜기"
        aria-pressed={pressed}
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture(event.pointerId)
          startPress()
        }}
        onPointerUp={endPress}
        onPointerCancel={endPress}
        onLostPointerCapture={endPress}
        onKeyDown={(event) => {
          if (!event.repeat && (event.key === " " || event.key === "Enter")) {
            event.preventDefault()
            startPress()
          }
        }}
        onKeyUp={(event) => {
          if (event.key === " " || event.key === "Enter") {
            event.preventDefault()
            endPress()
          }
        }}
        onBlur={endPress}
        onClick={(event) => event.preventDefault()}
      >
        터치 센서
      </button>
      <p
        className={`t-caption touch-status ${error ? "error" : ""}`}
        role="status"
      >
        {error
          ? "전원 변경 실패, 다시 시도"
          : pressed
            ? "터치 중, 켜짐"
            : "누르는 동안 켜짐"}
      </p>
    </div>
  )
}
