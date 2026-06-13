# Project Constitution — Jira Test Plan Generator

## Status: ✅ COMPLETE — ALL 5 PHASES DONE, LIVE IN PRODUCTION

---

## Tech Stack
| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite (no UI library, plain CSS) |
| Backend | FastAPI + Uvicorn (Python) |
| LLM | GROQ API — llama-3.3-70b-versatile |
| Jira | REST API v3 |
| Output | .md + .json files in .tmp/ |

## Environment Variables (from .env)
| Key | Status |
|---|---|
| GROQ_KEY | ✅ Ready |
| JIRA_API_TOKEN | ✅ Ready |
| JIRA_EMAIL | ✅ ankitkhandelwal0@gmail.com |
| JIRA_URL | ✅ https://ankitkhandelwal.atlassian.net/browse/SCRUM-6 |

Parsed: base_url = https://ankitkhandelwal.atlassian.net | issue_key = SCRUM-6

---

## Data Schemas

### Input — Jira Fetch Payload
```json
{
  "jira_id": "SCRUM-6",
  "jira_base_url": "https://ankitkhandelwal.atlassian.net",
  "fields": {
    "summary": "string",
    "description": "string (plain text, converted from ADF)",
    "acceptance_criteria": "string",
    "story_points": "number | null",
    "labels": ["string"],
    "linked_issues": [
      { "id": "string", "type": "string", "summary": "string" }
    ]
  }
}
```

### Output — Test Plan Payload
```json
{
  "jira_id": "string",
  "generated_at": "ISO8601 timestamp",
  "test_plan": {
    "test_objective": "string",
    "scope": {
      "in_scope": ["string"],
      "out_of_scope": ["string"]
    },
    "test_cases": [
      {
        "id": "TC-001",
        "title": "string",
        "preconditions": "string",
        "steps": ["string"],
        "expected_result": "string",
        "pass_fail_criteria": "string"
      }
    ],
    "pass_fail_criteria": "string"
  }
}
```

---

## Behavioral Rules
- Fetch ONLY: summary, description, acceptance_criteria, story_points, labels, linked_issues
- Test plan ALWAYS has exactly 4 sections: Test Objective → Scope → Test Cases → Pass/Fail Criteria
- Minimum 4 test cases: happy path, edge case, negative scenario, boundary test
- LLM temperature: 0.3 for consistent structured output
- Output both `{jira_id}_test_plan.md` AND `{jira_id}_test_plan.json` in `.tmp/`
- Never expose API tokens to the frontend — all API calls go through FastAPI backend
- GROQ JSON mode enforced (`response_format: json_object`)

## Architectural Invariants
- 3-layer separation: architecture/ (SOPs) → tools/ (deterministic) → server.py (routing)
- .env is sole source of truth for credentials
- .tmp/ is the only directory for intermediate/output files
- Vite proxy routes /api/* → FastAPI on port 8000
- React runs on port 3000, FastAPI on port 8000

## Directory Structure
```
BlastFramework/
├── .env
├── architecture/
│   └── test_plan_sop.md
├── tools/
│   ├── __init__.py
│   ├── jira_connector.py
│   ├── test_plan_generator.py
│   └── write_output.py
├── .tmp/
├── app/  (React + Vite)
│   ├── src/
│   │   ├── main.jsx
│   │   ├── App.jsx
│   │   └── App.css
│   ├── package.json
│   ├── vite.config.js
│   └── index.html
├── server.py  (FastAPI)
├── requirements.txt
└── run.sh
```

## Maintenance Log
| Date | Change |
|---|---|
| 2026-06-14 | Project initialized, Blueprint approved |
| 2026-06-14 | Schema locked, tech stack confirmed (GROQ + FastAPI + React) |
| 2026-06-14 | Phase 2 Link — Jira + GROQ connections verified |
| 2026-06-14 | Phase 3 Architect — all 3 tools + FastAPI server built |
| 2026-06-14 | Phase 4 Stylize — React UI complete |
| 2026-06-14 | Phase 5 Trigger — both servers live, end-to-end test PASSED |
| 2026-06-14 | Vercel deployment — live at https://testplangenerator-iota.vercel.app |
