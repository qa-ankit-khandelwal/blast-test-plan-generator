import json
import os

_TMP = os.path.join(os.path.dirname(os.path.dirname(__file__)), ".tmp")


def _to_markdown(data: dict) -> str:
    jira_id = data.get("jira_id", "")
    generated_at = data.get("generated_at", "")
    plan = data.get("test_plan", {})

    lines = [
        f"# Test Plan: {jira_id}",
        "",
        f"**Generated:** {generated_at}",
        "",
        "---",
        "",
        "## 1. Test Objective",
        "",
        plan.get("test_objective", ""),
        "",
        "---",
        "",
        "## 2. Scope",
        "",
        "### In Scope",
    ]
    for item in plan.get("scope", {}).get("in_scope", []):
        lines.append(f"- {item}")
    lines += ["", "### Out of Scope"]
    for item in plan.get("scope", {}).get("out_of_scope", []):
        lines.append(f"- {item}")

    lines += ["", "---", "", "## 3. Test Cases", ""]

    for tc in plan.get("test_cases", []):
        lines += [
            f"### {tc.get('id', '')}: {tc.get('title', '')}",
            "",
            f"**Preconditions:** {tc.get('preconditions', 'None')}",
            "",
            "**Steps:**",
        ]
        for i, step in enumerate(tc.get("steps", []), 1):
            lines.append(f"{i}. {step}")
        lines += [
            "",
            f"**Expected Result:** {tc.get('expected_result', '')}",
            "",
            f"**Pass/Fail Criteria:** {tc.get('pass_fail_criteria', '')}",
            "",
            "---",
            "",
        ]

    lines += [
        "## 4. Overall Pass/Fail Criteria",
        "",
        plan.get("pass_fail_criteria", ""),
    ]

    return "\n".join(lines)


def write_outputs(test_plan_data: dict) -> dict:
    """Write test plan to .json and .md in .tmp/. Returns paths + markdown string."""
    os.makedirs(_TMP, exist_ok=True)

    safe_id = test_plan_data.get("jira_id", "output").replace("/", "-")
    json_path = os.path.join(_TMP, f"{safe_id}_test_plan.json")
    md_path = os.path.join(_TMP, f"{safe_id}_test_plan.md")

    with open(json_path, "w", encoding="utf-8") as fh:
        json.dump(test_plan_data, fh, indent=2, ensure_ascii=False)

    markdown = _to_markdown(test_plan_data)
    with open(md_path, "w", encoding="utf-8") as fh:
        fh.write(markdown)

    return {"json_path": json_path, "md_path": md_path, "markdown": markdown}
