#!/bin/bash
set -e

ROOT="$(cd "$(dirname "$0")" && pwd)"

echo "🟢 BLAST Test Plan Generator"
echo "─────────────────────────────"

# Install Python deps if needed
if ! python3 -c "import fastapi" 2>/dev/null; then
  echo "Installing Python dependencies..."
  pip3 install -r "$ROOT/requirements.txt" -q
fi

# Install Node deps if needed
if [ ! -d "$ROOT/app/node_modules" ]; then
  echo "Installing Node dependencies..."
  cd "$ROOT/app" && npm install -s
fi

cd "$ROOT"

echo "Starting backend  → http://localhost:8000"
python3 -m uvicorn server:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!

echo "Starting frontend → http://localhost:3000"
cd "$ROOT/app" && npm run dev &
FRONTEND_PID=$!

echo ""
echo "✅  Both servers running."
echo "    Open: http://localhost:3000"
echo ""
echo "    Press Ctrl+C to stop."

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; echo 'Stopped.'" EXIT INT TERM
wait
