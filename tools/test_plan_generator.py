import os
import json
from datetime import datetime, timezone
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

_client = Groq(api_key=os.getenv("GROQ_KEY"))
_MODEL = "llama-3.3-70b-versatile"

_SYSTEM = (
    "You are a senior QA Engineer. You generate structured, professional test plans "
    "from Jira issue data. Always return valid JSON only — no markdown fences, no "
    "explanation, no preamble."
)


def _build_prompt(issue: dict) -> str:
    f = issue["fields"]
    linked = (
        "\n".join(f"  - [{i['id']}] {i['type']}: {i['summary']}" for i in f["linked_issues"])
        or "  None"
    )
    labels = ", ".join(f["labels"]) if f["labels"] else "None"
    now = datetime.now(timezone.utc).isoformat()

    return f"""Generate a comprehensive test plan for the following Jira issue.

JIRA ID: {issue["jira_id"]}
SUMMARY: {f["summary"]}

DESCRIPTION:
{f["description"] or "Not provided"}

ACCEPTANCE CRITERIA:
{f["acceptance_criteria"] or "Not specified — infer from summary and description"}

STORY POINTS: {f["story_points"] or "Not set"}
LABELS: {labels}
LINKED ISSUES:
{linked}

Return ONLY this JSON (no extra text, no markdown):
{{
  "jira_id": "{issue["jira_id"]}",
  "generated_at": "{now}",
  "test_plan": {{
    "test_objective": "Clear statement of what this test plan verifies",
    "scope": {{
      "in_scope": ["specific item 1", "specific item 2"],
      "out_of_scope": ["item explicitly not tested 1"]
    }},
    "test_cases": [
      {{
        "id": "TC-001",
        "title": "Descriptive title",
        "preconditions": "Setup requirements before running this test",
        "steps": ["Step 1: do X", "Step 2: do Y"],
        "expected_result": "What should happen",
        "pass_fail_criteria": "Specific condition that determines pass or fail"
      }}
    ],
    "pass_fail_criteria": "Overall pass/fail criteria for the complete test suite"
  }}
}}

Requirements:
- Minimum 4 test cases covering: happy path, edge case, negative scenario, boundary test
- All test cases must directly relate to the summary, description, and acceptance criteria
- Be specific — not generic boilerplate
- Steps must be actionable and sequential
"""


def generate_test_plan(issue_data: dict) -> dict:
    """Call GROQ LLM and return parsed test plan dict."""
    completion = _client.chat.completions.create(
        model=_MODEL,
        messages=[
            {"role": "system", "content": _SYSTEM},
            {"role": "user", "content": _build_prompt(issue_data)},
        ],
        response_format={"type": "json_object"},
        temperature=0.3,
        max_tokens=4096,
    )
    raw = completion.choices[0].message.content
    return json.loads(raw)
