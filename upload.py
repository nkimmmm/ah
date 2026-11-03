import argparse
import os
import sys
import time
from pathlib import Path

import serial
from serial.tools import list_ports
from dotenv import load_dotenv
from supabase import Client, create_client


PROJECT_ROOT = Path(__file__).resolve().parent


def choose_port() -> str:
    available_ports = list(list_ports.comports())
    if not available_ports:
        raise RuntimeError("No serial ports found. Connect the Arduino and try again.")

    print("Available serial ports:")
    for index, port in enumerate(available_ports, start=1):
        print(f"  {index}. {port.device} - {port.description}")

    while True:
        selection = input("Select a port number: ").strip()
        try:
            selected_index = int(selection) - 1
        except ValueError:
            print("Enter the number shown beside your Arduino port.")
            continue

        if 0 <= selected_index < len(available_ports):
            return available_ports[selected_index].device
        print("That port number is not in the list.")


def create_supabase_client() -> Client:
    load_dotenv(PROJECT_ROOT / ".env")
    url = os.getenv("VITE_SUPABASE_URL")
    key = os.getenv("VITE_SUPABASE_ANON_KEY")
    if not url or not key:
        raise RuntimeError(
            "Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in the project-root .env file."
        )
    if key.startswith("sb_secret_"):
        raise RuntimeError(
            "VITE_SUPABASE_ANON_KEY must be a publishable/anon key, not an sb_secret key."
        )
    if not (key.startswith("sb_publishable_") or (key.startswith("eyJ") and len(key.split(".")) == 3)):
        raise RuntimeError(
            "VITE_SUPABASE_ANON_KEY is not a recognized Supabase key. Copy the publishable key "
            "or legacy anon key from the same project's Supabase API Keys settings."
        )
    return create_client(url, key)


def parse_value(line: str) -> int | float:
    value = float(line.strip())
    if not value.is_integer():
        return value
    return int(value)


def upload_lines(port_name: str, supabase: Client) -> None:
    print(f"Connecting to {port_name} at 9600 baud. Press Ctrl+C to stop.", flush=True)
    uploads_enabled = True
    last_upload_at = 0.0
    with serial.Serial(port_name, 9600, timeout=1) as arduino:
        while True:
            raw_line = arduino.readline()
            if not raw_line:
                continue

            line = raw_line.decode("utf-8", errors="replace").strip()
            if not line:
                continue

            try:
                value = parse_value(line)
            except ValueError:
                print(f"Skipping non-numeric line: {line!r}", file=sys.stderr)
                continue

            print(f"Sensor value: {value}", flush=True)
            if not uploads_enabled:
                continue
            now = time.monotonic()
            if now - last_upload_at < 1:
                continue
            try:
                supabase.table("readings").insert({"value": value}).execute()
                last_upload_at = time.monotonic()
                print(f"Uploaded value: {value}", flush=True)
            except Exception as error:
                print(f"Supabase upload failed: {error}", file=sys.stderr, flush=True)
                print("Pausing uploads; serial readings will continue. Fix the Supabase key and restart.", file=sys.stderr, flush=True)
                uploads_enabled = False


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Read numeric lines from an Arduino and insert them into Supabase."
    )
    parser.add_argument(
        "--port",
        default="/dev/cu.usbmodem1101",
        help="Serial port device (for example, /dev/cu.usbmodem1101 on macOS).",
    )
    args = parser.parse_args()

    try:
        supabase = create_supabase_client()
        port_name = args.port or choose_port()
        upload_lines(port_name, supabase)
    except KeyboardInterrupt:
        print("\nStopped.")
    except (RuntimeError, serial.SerialException) as error:
        parser.error(str(error))


if __name__ == "__main__":
    main()
