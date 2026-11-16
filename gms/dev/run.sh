#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/../.."
[ -f devdata/bambuddy.db ] || .venv/bin/python gms/dev/refresh-devdata.py
export DATA_DIR="$PWD/devdata" LOG_DIR="$PWD/devdata/logs" DEBUG=true
.venv/bin/uvicorn backend.app.main:app --reload --reload-dir backend --host 127.0.0.1 --port 8020 --loop asyncio &
backend=$!
trap 'kill $backend 2>/dev/null' EXIT
cd frontend
BACKEND_PORT=8020 npm run dev -- --host 0.0.0.0 --port 5173 --strictPort
