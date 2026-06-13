# ⚡ BLAST Test Plan Generator

> AI-powered QA test plan generator — paste a Jira ticket ID, get a structured test plan in seconds.

[![License: MIT](https://img.shields.io/badge/License-MIT-cyan.svg)](LICENSE)
[![Deployed on Vercel](https://img.shields.io/badge/Deployed-Vercel-black?logo=vercel)](https://testplangenerator-iota.vercel.app)
[![Built with FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?logo=fastapi)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/Frontend-React-61DAFB?logo=react)](https://react.dev)

## 🔗 Live Demo

**[https://testplangenerator-iota.vercel.app](https://testplangenerator-iota.vercel.app)**

---

## What it does

1. You enter your **Jira credentials** in the UI (domain, email, API token) — stored only in your browser
2. You enter a Jira issue ID (e.g. `SCRUM-6`)
3. It fetches the issue fields — summary, description, acceptance criteria, story points, labels, linked issues
4. It sends the data to GROQ's LLM (`llama-3.3-70b-versatile`)
5. You get a structured 4-section test plan:
   - **Test Objective** — what is being verified
   - **Scope** — in scope vs out of scope
   - **Test Cases** — min 4 cases (happy path, edge case, negative, boundary)
   - **Pass/Fail Criteria** — overall completion criteria
5. Download as `.md` or `.json`

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite (no UI library) |
| Backend | FastAPI + Uvicorn (Python) |
| LLM | [GROQ API](https://console.groq.com) — llama-3.3-70b-versatile |
| Jira | Atlassian REST API v3 |
| Deployment | Vercel (serverless) |

---

## Getting Started

### Prerequisites
- Python 3.10+
- Node.js 18+
- A [Jira API token](https://id.atlassian.com/manage-profile/security/api-tokens)
- A [GROQ API key](https://console.groq.com/keys) (free tier available)

### 1. Clone the repo

```bash
git clone https://github.com/qa-ankit-khandelwal/blast-test-plan-generator.git
cd blast-test-plan-generator
```

### 2. Set up environment variables

```bash
cp .env.sample .env
```

Edit `.env` — only one value needed server-side:

```env
GROQ_KEY = "gsk_your_groq_api_key_here"
```

| Variable | Where to get it |
|---|---|
| `GROQ_KEY` | [console.groq.com/keys](https://console.groq.com/keys) — free tier available |

> **Jira credentials are entered by each user in the UI** — domain, email, and API token.  
> They're saved in the browser's localStorage only and never sent to or stored on the server.

### 3. Install dependencies

```bash
# Python
pip install -r requirements.txt

# Node (React frontend)
cd app && npm install && cd ..
```

### 4. Run locally

```bash
bash run.sh
```

Or start separately:

```bash
# Terminal 1 — backend
python3 -m uvicorn server:app --reload --port 8000

# Terminal 2 — frontend
cd app && npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Project Structure

```
blast-test-plan-generator/
├── architecture/
│   └── test_plan_sop.md       # SOP — the "Golden Rule" doc
├── tools/
│   ├── jira_connector.py      # Jira REST API v3 + ADF parser
│   ├── test_plan_generator.py # GROQ LLM prompt + response
│   └── write_output.py        # Writes .md and .json to .tmp/
├── api/
│   └── index.py               # Vercel serverless entry point
├── app/                       # React + Vite frontend
│   └── src/
│       ├── App.jsx
│       └── App.css
├── server.py                  # FastAPI server
├── requirements.txt
├── vercel.json
├── run.sh                     # Start both servers locally
└── .env.sample                # Copy to .env and fill in values
```

---

## API Reference

### `POST /api/generate`

Generate a test plan from a Jira issue.

**Request:**
```json
{ "jira_id": "SCRUM-6" }
```

**Response:**
```json
{
  "success": true,
  "jira_id": "SCRUM-6",
  "test_plan_data": {
    "jira_id": "SCRUM-6",
    "generated_at": "2026-06-14T...",
    "test_plan": {
      "test_objective": "...",
      "scope": { "in_scope": [...], "out_of_scope": [...] },
      "test_cases": [
        {
          "id": "TC-001",
          "title": "...",
          "preconditions": "...",
          "steps": ["..."],
          "expected_result": "...",
          "pass_fail_criteria": "..."
        }
      ],
      "pass_fail_criteria": "..."
    }
  },
  "markdown": "# Test Plan: SCRUM-6\n..."
}
```

### `GET /api/verify`

Test that your Jira credentials are working.

### `GET /api/health`

Health check.

---

## Deploy to Vercel

```bash
npm install -g vercel
vercel deploy --prod
```

Set the single environment variable in Vercel:
```bash
vercel env add GROQ_KEY production
```

Jira credentials are provided by each user at runtime — no server-side config needed for Jira.

---

## Contributing

Contributions are welcome! This project follows the **B.L.A.S.T framework**:

- **B**lueprint → Plan before coding
- **L**ink → Verify all connections
- **A**rchitect → 3-layer separation (SOP / Navigation / Tools)
- **S**tylize → Polish the output
- **T**rigger → Deploy and automate

### How to contribute

1. Fork the repo
2. Create a feature branch: `git checkout -b feat/your-feature`
3. Make your changes
4. Open a pull request

### Ideas for contributions
- Support for additional Jira fields (priority, components, sprints)
- Export to PDF
- Multiple Jira IDs in one batch
- Support for other LLM providers (OpenAI, Anthropic)
- Add test coverage
- i18n / localization

---

## License

MIT — see [LICENSE](LICENSE) for details.

Free to use, fork, and build on. If you find this useful, consider giving it a ⭐
