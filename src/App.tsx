import { useEffect, useState } from "react"
import ConnectionControl from "./components/ConnectionControl"
import PowerToggle from "./components/PowerToggle"
import ProductHeader from "./components/ProductHeader"
import SensorChart from "./components/SensorChart"
import SensorMoon from "./components/SensorMoon"
import {
  connectSensor,
  disconnectSensor,
  loadPower,
  type Reading,
  type Status,
} from "./lib/device"
import { MAX_POINTS } from "./product"

export default function App() {
  const [status, setStatus] = useState<Status>("disconnected")
  const [power, setPower] = useState(false)
  const [readings, setReadings] = useState<Reading[]>([])

  useEffect(() => {
    let active = true

    void loadPower().then((loadedPower) => {
      if (active) setPower(loadedPower)
    })

    return () => {
      active = false
      void disconnectSensor()
    }
  }, [])

  const handleConnect = async () => {
    await connectSensor({
      onInit: setReadings,
      onReading: (reading) => {
        setReadings((current) => [...current, reading].slice(-MAX_POINTS))
      },
      onStatus: setStatus,
    })
  }

  const handleDisconnect = async () => {
    await disconnectSensor()
    setStatus("disconnected")
  }

  return (
    <main className="app-shell">
      <ProductHeader />
      <SensorMoon
        value={readings.at(-1)?.value}
        power={power}
        onPowerChange={setPower}
      />

      <div className="lower-grid">
        <section className="controls" aria-label="조명 제어">
          <ConnectionControl
            status={status}
            onConnect={handleConnect}
            onDisconnect={handleDisconnect}
          />
          <PowerToggle power={power} onPowerChange={setPower} />
        </section>
        <SensorChart readings={readings} />
      </div>
    </main>
  )
}
