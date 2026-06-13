import sys
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

sys.path.insert(0, str(Path(__file__).parent))

from tools.jira_connector import fetch_issue, verify_connection
from tools.test_plan_generator import generate_test_plan
from tools.write_output import write_outputs

app = FastAPI(title="BLAST Test Plan Generator", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class JiraCreds(BaseModel):
    jira_email: str
    jira_token: str
    jira_base_url: str


class VerifyRequest(JiraCreds):
    pass


class GenerateRequest(JiraCreds):
    jira_id: str


@app.get("/api/health")
def health():
    return {"status": "ok", "service": "BLAST Test Plan Generator"}


@app.post("/api/verify")
def verify(req: VerifyRequest):
    result = verify_connection(
        email=req.jira_email,
        token=req.jira_token,
        base_url=req.jira_base_url,
    )
    if result["status"] != "ok":
        raise HTTPException(status_code=401, detail=result.get("message", "Jira connection failed"))
    return result


@app.post("/api/generate")
def generate(req: GenerateRequest):
    jira_id = req.jira_id.strip().upper()
    if not jira_id:
        raise HTTPException(status_code=400, detail="jira_id is required")

    try:
        issue_data = fetch_issue(
            jira_id,
            email=req.jira_email,
            token=req.jira_token,
            base_url=req.jira_base_url,
        )
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Jira fetch failed: {exc}")

    try:
        test_plan_data = generate_test_plan(issue_data)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Test plan generation failed: {exc}")

    try:
        output = write_outputs(test_plan_data)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Output write failed: {exc}")

    return {
        "success": True,
        "jira_id": jira_id,
        "test_plan_data": test_plan_data,
        "markdown": output["markdown"],
        "files": {"json": output["json_path"], "md": output["md_path"]},
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("server:app", host="0.0.0.0", port=8000, reload=True)
