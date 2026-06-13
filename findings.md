# Findings

## Research & Discoveries

### .env Analysis (2026-06-14)
- **GROQ_KEY** found — using GROQ API (not Anthropic/Claude) for LLM generation
  - Model selected: `llama-3.3-70b-versatile` (latest, most capable on GROQ)
- **JIRA_URL** is the browse URL, not the API base URL
  - Parse base: `https://ankitkhandelwal.atlassian.net`
  - Parse key: `SCRUM-6`
- **JIRA_EMAIL**: ankitkhandelwal0@gmail.com (Atlassian account)
- Jira auth method: HTTP Basic Auth with email + API token

### Jira REST API v3 (2026-06-14)
- Verify endpoint: `GET /rest/api/3/myself`
- Issue endpoint: `GET /rest/api/3/issue/{issueId}`
- Description returned in **Atlassian Document Format (ADF)** — requires recursive JSON → text conversion
- Acceptance Criteria: varies by Jira config
  - May be in `customfield_10014` or `customfield_10089`
  - Fallback: parse from description text using regex
- Story Points: try `story_points`, `customfield_10016`, `customfield_10028`
- Linked Issues: nested in `fields.issuelinks[]` with `inwardIssue` / `outwardIssue`

### GROQ API (2026-06-14)
- JSON mode supported: `response_format={"type": "json_object"}`
- Temperature 0.3 chosen for deterministic test plan structure
- Max tokens: 4096 (sufficient for 4-6 test cases)

### React/Vite (2026-06-14)
- Vite proxy configured: `/api/*` → `http://localhost:8000`
- No CORS issues for frontend since all API calls go through proxy
- FastAPI CORS enabled for localhost:3000 and localhost:5173

### Phase 2 Link Verification (2026-06-14)
- ✅ Python deps installed: fastapi, uvicorn, groq, requests, python-dotenv
- ✅ Node deps installed: react, react-dom, vite, @vitejs/plugin-react
- ✅ .env credentials parse correctly (dotenv handles spaces around `=` and quoted values)
- ✅ Jira verify_connection() → OK (Ankit Khandelwal / ankitkhandelwal046@gmail.com)
- ✅ fetch_issue('SCRUM-6') → full VWO PRD content retrieved successfully
- ✅ GROQ key updated (`gsk_...`) — generate_test_plan() works
- ✅ Full pipeline verified: fetch → generate → write outputs
- ✅ SCRUM-6 test plan: 4 test cases (happy path, edge, negative, boundary)
- ✅ Outputs written to .tmp/SCRUM-6_test_plan.json + .tmp/SCRUM-6_test_plan.md
- ✅ FastAPI running on :8000, React/Vite on :3000

## Constraints
- No hardcoded credentials — all from .env
- .tmp/ is the only write directory for scripts
- API tokens must never reach the browser

## Resources
- GROQ Python SDK: `groq` pip package (OpenAI-compatible interface)
- Jira REST API v3 docs: https://developer.atlassian.com/cloud/jira/platform/rest/v3/
- ADF format: recursive content nodes with type/text/content structure
