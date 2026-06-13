# Task Plan

## Objective
Fetch Jira Issue and generate a Test Plan from it — delivered via a lightweight React app.
- Target Jira ID: SCRUM-6
- Jira URL: https://ankitkhandelwal.atlassian.net/browse/SCRUM-6

## Status: ✅ ALL PHASES COMPLETE — LIVE

---

## Phases

### Protocol 0: Initialization ✅
- [x] task_plan.md
- [x] findings.md
- [x] progress.md
- [x] gemini.md (Project Constitution)

### Phase 1: B — Blueprint ✅
- [x] 5 Discovery Questions answered
- [x] Tech stack confirmed (GROQ + FastAPI + React + Vite)
- [x] JSON Data Schema defined and locked in gemini.md
- [x] Blueprint approved by user

### Phase 2: L — Link (Connectivity) ✅
- [x] verify_connection() → OK (Ankit Khandelwal)
- [x] fetch_issue('SCRUM-6') → VWO PRD content retrieved
- [x] GROQ generate_test_plan() → 4 test cases produced
- [x] write_outputs() → .json + .md written to .tmp/

### Phase 3: A — Architect (3-Layer Build) ✅
- [x] architecture/test_plan_sop.md (SOP / Golden Rule doc)
- [x] tools/jira_connector.py — ADF parser, field extraction, link parsing
- [x] tools/test_plan_generator.py — GROQ JSON-mode prompt
- [x] tools/write_output.py — .md + .json writer
- [x] server.py — FastAPI /api/health + /api/verify + /api/generate

### Phase 4: S — Stylize (React UI) ✅
- [x] app/package.json + vite.config.js (proxy /api → :8000)
- [x] app/index.html
- [x] app/src/main.jsx
- [x] app/src/App.jsx (collapsible test cases, .md + .json download)
- [x] app/src/App.css (green-themed, responsive, no UI library)

### Phase 5: T — Trigger (Deployment) ✅
- [x] run.sh — single command starts both servers locally
- [x] FastAPI running at http://localhost:8000
- [x] React app running at http://localhost:3000
- [x] End-to-end test PASSED with SCRUM-6
- [x] api/index.py — Vercel ASGI serverless entry point
- [x] vercel.json — builds + routes configured
- [x] .vercelignore — excludes .env, .tmp/, __pycache__
- [x] All 4 env vars set in Vercel production
- [x] Deployed to https://testplangenerator-iota.vercel.app ✅

---

## How to Run
```bash
bash run.sh
# → http://localhost:3000
```
Or start individually:
```bash
# Backend
python3 -m uvicorn server:app --reload --port 8000

# Frontend (separate terminal)
cd app && npm run dev
```
