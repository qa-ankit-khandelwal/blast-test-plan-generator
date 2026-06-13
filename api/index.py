import sys
from pathlib import Path

# Make project root importable so tools/ and server.py are accessible
sys.path.insert(0, str(Path(__file__).parent.parent))

from server import app  # noqa: F401 — Vercel detects the ASGI `app` export
