import type { RealtimeChannel } from "@supabase/supabase-js"
import { DEVICE_ID, MAX_POINTS, SENSOR_MAX, SENSOR_MIN } from "../product"
import { db, IS_DEMO } from "./supabase"

export type Reading = {
  value: number
  created_at: string
}
export type Status = "disconnected" | "connecting" | "connected" | "error"

type ConnectOptions = {
  onInit: (rows: Reading[]) => void
  onReading: (row: Reading) => void
  onStatus: (status: Status) => void
}

let channel: RealtimeChannel | null = null
let demoTimer: ReturnType<typeof setInterval> | null = null
let demoPower = false

function parseReading(row: Record<string, unknown>): Reading | null {
  const value = Number(row.value)
  const createdAt = typeof row.created_at === "string" ? row.created_at : ""
  return Number.isFinite(value) && createdAt
    ? { value, created_at: createdAt }
    : null
}

function demoValue(step: number) {
  const center = (SENSOR_MAX + SENSOR_MIN) / 2
  const amplitude = (SENSOR_MAX - SENSOR_MIN) * 0.42
  return Math.round(center + Math.sin(step / 7) * amplitude)
}

export async function connectSensor(opts: ConnectOptions): Promise<void> {
  await disconnectSensor()
  opts.onStatus("connecting")

  if (IS_DEMO || !db) {
    const now = Date.now()
    let step = 0
    const rows = Array.from({ length: MAX_POINTS }, (_, index) => {
      step = index
      return {
        value: demoValue(index),
        created_at: new Date(now - (MAX_POINTS - index) * 500).toISOString(),
      }
    })
    opts.onInit(rows)
    opts.onStatus("connected")
    demoTimer = setInterval(() => {
      step += 1
      opts.onReading({
        value: demoValue(step),
        created_at: new Date().toISOString(),
      })
    }, 500)
    return
  }

  const { data, error } = await db
    .from("sensor_readings")
    .select("value, created_at")
    .eq("device_id", DEVICE_ID)
    .order("created_at", { ascending: false })
    .limit(MAX_POINTS)

  if (error) {
    opts.onStatus("error")
    return
  }

  const rows = (data ?? [])
    .map((row) => parseReading(row as Record<string, unknown>))
    .filter((row): row is Reading => row !== null)
    .reverse()
  opts.onInit(rows)

  channel = db
    .channel(`sensor-${DEVICE_ID}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "sensor_readings",
        filter: `device_id=eq.${DEVICE_ID}`,
      },
      (payload) => {
        const reading = parseReading(payload.new as Record<string, unknown>)
        if (reading) opts.onReading(reading)
      },
    )
    .subscribe((subscriptionStatus) => {
      if (subscriptionStatus === "SUBSCRIBED") opts.onStatus("connected")
      if (
        subscriptionStatus === "CHANNEL_ERROR" ||
        subscriptionStatus === "TIMED_OUT"
      ) {
        opts.onStatus("error")
      }
    })
}

export async function disconnectSensor(): Promise<void> {
  if (demoTimer) {
    clearInterval(demoTimer)
    demoTimer = null
  }
  if (channel && db) {
    await db.removeChannel(channel)
    channel = null
  }
}

export async function setLedPower(on: boolean): Promise<boolean> {
  if (IS_DEMO || !db) {
    demoPower = on
    return true
  }

  const { error } = await db
    .from("device_state")
    .update({ led_on: on, updated_at: new Date().toISOString() })
    .eq("device_id", DEVICE_ID)
  return !error
}

export async function loadPower(): Promise<boolean> {
  if (IS_DEMO || !db) return demoPower

  const { data, error } = await db
    .from("device_state")
    .select("led_on")
    .eq("device_id", DEVICE_ID)
    .maybeSingle()
  return error ? false : Boolean(data?.led_on)
}
