import re
import requests
from requests.auth import HTTPBasicAuth


def _normalise_base_url(raw: str) -> str:
    """Accept domain or full URL, return clean https://... base."""
    raw = raw.strip().rstrip("/")
    if not raw.startswith("http"):
        raw = "https://" + raw
    # Strip any path (e.g. /browse/PROJ-1)
    match = re.match(r"(https://[^/]+)", raw)
    return match.group(1) if match else raw


def _adf_to_text(node) -> str:
    """Recursively convert Atlassian Document Format node to plain text."""
    if node is None:
        return ""
    if isinstance(node, str):
        return node
    if isinstance(node, list):
        return "\n".join(filter(None, (_adf_to_text(n) for n in node)))
    if not isinstance(node, dict):
        return ""

    node_type = node.get("type", "")
    content = node.get("content", [])

    if node_type == "text":
        return node.get("text", "")
    if node_type in ("paragraph", "listItem", "taskItem"):
        return _adf_to_text(content) + "\n"
    if node_type == "heading":
        level = node.get("attrs", {}).get("level", 1)
        return "#" * level + " " + _adf_to_text(content) + "\n"
    if node_type in ("bulletList", "orderedList", "taskList"):
        return _adf_to_text(content)
    if node_type == "codeBlock":
        return "```\n" + _adf_to_text(content) + "\n```\n"
    if node_type == "hardBreak":
        return "\n"
    if node_type == "rule":
        return "---\n"
    return _adf_to_text(content)


def verify_connection(*, email: str, token: str, base_url: str) -> dict:
    """Confirm Jira credentials are valid."""
    base = _normalise_base_url(base_url)
    try:
        resp = requests.get(
            f"{base}/rest/api/3/myself",
            headers={"Accept": "application/json"},
            auth=HTTPBasicAuth(email, token),
            timeout=10,
        )
        if resp.status_code == 200:
            data = resp.json()
            return {
                "status": "ok",
                "user": data.get("displayName", ""),
                "email": data.get("emailAddress", ""),
            }
        return {"status": "error", "code": resp.status_code, "message": resp.text[:300]}
    except Exception as exc:
        return {"status": "error", "message": str(exc)}


def fetch_issue(jira_id: str, *, email: str, token: str, base_url: str) -> dict:
    """Fetch a Jira issue and return normalised fields."""
    base = _normalise_base_url(base_url)
    resp = requests.get(
        f"{base}/rest/api/3/issue/{jira_id}",
        headers={"Accept": "application/json"},
        auth=HTTPBasicAuth(email, token),
        timeout=15,
    )
    resp.raise_for_status()

    raw = resp.json()
    fields = raw.get("fields", {})

    description = _adf_to_text(fields.get("description")).strip()

    story_points = (
        fields.get("story_points")
        or fields.get("customfield_10016")
        or fields.get("customfield_10028")
    )

    ac_raw = fields.get("customfield_10014") or fields.get("customfield_10089")
    if isinstance(ac_raw, dict):
        acceptance_criteria = _adf_to_text(ac_raw).strip()
    elif isinstance(ac_raw, str):
        acceptance_criteria = ac_raw.strip()
    else:
        match = re.search(
            r"(?:acceptance criteria|AC)[:\s]+(.+?)(?:\n#|\Z)",
            description, re.IGNORECASE | re.DOTALL,
        )
        acceptance_criteria = match.group(1).strip() if match else ""

    linked_issues = []
    for link in fields.get("issuelinks", []):
        for direction in ("inwardIssue", "outwardIssue"):
            if direction in link:
                issue = link[direction]
                link_type = link.get("type", {})
                linked_issues.append({
                    "id": issue.get("key", ""),
                    "type": link_type.get(
                        "inward" if direction == "inwardIssue" else "outward", ""
                    ),
                    "summary": issue.get("fields", {}).get("summary", ""),
                })

    return {
        "jira_id": jira_id,
        "jira_base_url": base,
        "fields": {
            "summary": fields.get("summary", ""),
            "description": description,
            "acceptance_criteria": acceptance_criteria,
            "story_points": story_points,
            "labels": fields.get("labels", []),
            "linked_issues": linked_issues,
        },
    }
