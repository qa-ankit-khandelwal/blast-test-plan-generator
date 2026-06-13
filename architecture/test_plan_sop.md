# SOP: Jira Test Plan Generator

## Goal
Fetch a Jira issue by ID and produce a structured QA test plan (4 sections) as both `.md` and `.json`.

## Inputs
| Field | Source | Notes |
|---|---|---|
| jira_id | User (React UI or CLI) | e.g. SCRUM-6 |
| JIRA_EMAIL | .env | Atlassian account email |
| JIRA_API_TOKEN | .env | HTTP Basic auth token |
| GROQ_KEY | .env | LLM API key |

## Tool Execution Order
1. `jira_connector.verify_connection()` — confirm Jira auth is live
2. `jira_connector.fetch_issue(jira_id)` — pull and normalize issue fields
3. `test_plan_generator.generate_test_plan(issue_data)` — GROQ LLM call → JSON
4. `write_output.write_outputs(test_plan_data)` — persist .json + .md to .tmp/

## Jira Fields Extracted
| Field | Jira Source |
|---|---|
| summary | fields.summary |
| description | fields.description (ADF → text) |
| acceptance_criteria | customfield_10014 or customfield_10089 or parsed from description |
| story_points | customfield_10016 or customfield_10028 |
| labels | fields.labels |
| linked_issues | fields.issuelinks[].inwardIssue / outwardIssue |

## ADF → Text Conversion
Jira REST API v3 returns description in Atlassian Document Format (JSON tree).
`jira_connector._adf_to_text()` recursively walks the tree, handling:
- text, paragraph, heading, bulletList, orderedList, listItem, codeBlock, hardBreak, rule

## Output Format
Files saved to: `.tmp/{jira_id}_test_plan.json` and `.tmp/{jira_id}_test_plan.md`

## Test Plan Sections (always exactly 4)
1. **Test Objective** — what is being verified
2. **Scope** — in_scope list + out_of_scope list
3. **Test Cases** — minimum 4 (happy path, edge case, negative, boundary)
4. **Overall Pass/Fail Criteria**

## LLM Config
| Setting | Value |
|---|---|
| Provider | GROQ |
| Model | llama-3.3-70b-versatile |
| Temperature | 0.3 |
| Response format | json_object (enforced) |
| Max tokens | 4096 |

## Edge Cases
| Scenario | Handling |
|---|---|
| Jira 401 | HTTPException 502 — "Jira fetch failed: 401" |
| Jira 404 | HTTPException 502 — "Jira fetch failed: 404" |
| No acceptance_criteria field | Regex parse from description text |
| No story_points field | Returns null, included in prompt as "Not set" |
| GROQ malformed JSON | json.loads raises → HTTPException 502 |
| Empty jira_id | HTTPException 400 — "jira_id is required" |

## Golden Rule
If logic changes, update this SOP first. Then update the code.
