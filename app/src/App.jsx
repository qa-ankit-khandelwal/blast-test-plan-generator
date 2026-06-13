import { useState, useEffect } from 'react'

const LS_KEY = 'blast_jira_creds'

function Spinner({ dark }) {
  return <div className={`spinner ${dark ? 'spinner--dark' : ''}`} aria-label="Loading" />
}

function ScopeList({ title, items, variant }) {
  return (
    <div className={`scope-list scope-list--${variant}`}>
      <h4>{title}</h4>
      <ul>
        {items.length
          ? items.map((item, i) => <li key={i}>{item}</li>)
          : <li className="empty">None specified</li>}
      </ul>
    </div>
  )
}

function TestCase({ tc, index }) {
  const [open, setOpen] = useState(false)
  return (
    <div className={`test-case ${open ? 'test-case--open' : ''}`} style={{ '--index': index }}>
      <button className="tc-header" onClick={() => setOpen(o => !o)}>
        <span className="tc-id">{tc.id}</span>
        <span className="tc-title">{tc.title}</span>
        <span className="tc-chevron">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="tc-body">
          <div className="tc-field">
            <span className="tc-field-label">Preconditions</span>
            <p>{tc.preconditions || 'None'}</p>
          </div>
          <div className="tc-field">
            <span className="tc-field-label">Steps</span>
            <ol>{(tc.steps || []).map((s, i) => <li key={i}>{s}</li>)}</ol>
          </div>
          <div className="tc-field">
            <span className="tc-field-label">Expected Result</span>
            <p>{tc.expected_result}</p>
          </div>
          <div className="tc-field tc-field--criteria">
            <span className="tc-field-label">Pass / Fail Criteria</span>
            <p>{tc.pass_fail_criteria}</p>
          </div>
        </div>
      )}
    </div>
  )
}

function TestPlanView({ data, markdown }) {
  const plan = data.test_plan
  const date = new Date(data.generated_at).toLocaleString()

  const download = (content, filename, type) => {
    const blob = new Blob([content], { type })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="plan-card">
      <div className="plan-top-bar">
        <div className="plan-meta">
          <span className="plan-badge">{data.jira_id}</span>
          <span className="plan-date">Generated {date}</span>
        </div>
        <div className="plan-actions">
          <button className="btn-dl" onClick={() => download(markdown, `${data.jira_id}_test_plan.md`, 'text/markdown')}>
            ↓ Markdown
          </button>
          <button className="btn-dl" onClick={() => download(JSON.stringify(data, null, 2), `${data.jira_id}_test_plan.json`, 'application/json')}>
            ↓ JSON
          </button>
        </div>
      </div>

      <div className="plan-body">
        <section className="plan-section">
          <div className="section-header">
            <span className="section-num">01</span>
            <h3>Test Objective</h3>
          </div>
          <p className="section-content">{plan.test_objective}</p>
        </section>

        <section className="plan-section">
          <div className="section-header">
            <span className="section-num">02</span>
            <h3>Scope</h3>
          </div>
          <div className="scope-grid">
            <ScopeList title="In Scope" items={plan.scope?.in_scope || []} variant="in" />
            <ScopeList title="Out of Scope" items={plan.scope?.out_of_scope || []} variant="out" />
          </div>
        </section>

        <section className="plan-section">
          <div className="section-header">
            <span className="section-num">03</span>
            <h3>Test Cases <span className="tc-count">{plan.test_cases?.length || 0}</span></h3>
          </div>
          <div className="test-cases">
            {(plan.test_cases || []).map((tc, i) => <TestCase key={tc.id} tc={tc} index={i} />)}
          </div>
        </section>

        <section className="plan-section plan-section--last">
          <div className="section-header">
            <span className="section-num">04</span>
            <h3>Overall Pass / Fail Criteria</h3>
          </div>
          <div className="criteria-box">
            <p>{plan.pass_fail_criteria}</p>
          </div>
        </section>
      </div>
    </div>
  )
}

export default function App() {
  const [creds, setCreds] = useState({ baseUrl: '', email: '', token: '' })
  const [credsOpen, setCredsOpen] = useState(true)
  const [connStatus, setConnStatus] = useState(null) // null | 'testing' | 'ok' | 'error'
  const [connMsg, setConnMsg] = useState('')

  const [jiraId, setJiraId] = useState('')
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState('')
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  // Load saved creds from localStorage
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(LS_KEY) || '{}')
      if (saved.baseUrl || saved.email) {
        setCreds(saved)
        setCredsOpen(false) // collapse if already filled
      }
    } catch {}
  }, [])

  // Save creds to localStorage whenever they change
  useEffect(() => {
    if (creds.baseUrl || creds.email) {
      localStorage.setItem(LS_KEY, JSON.stringify(creds))
    }
  }, [creds])

  const updateCred = (key, value) => {
    setCreds(c => ({ ...c, [key]: value }))
    setConnStatus(null)
  }

  const credsComplete = creds.baseUrl.trim() && creds.email.trim() && creds.token.trim()

  const testConnection = async () => {
    if (!credsComplete) return
    setConnStatus('testing')
    setConnMsg('')
    try {
      const res = await fetch('/api/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jira_base_url: creds.baseUrl.trim(),
          jira_email: creds.email.trim(),
          jira_token: creds.token.trim(),
        }),
      })
      const data = await res.json()
      if (res.ok) {
        setConnStatus('ok')
        setConnMsg(`Connected as ${data.user}`)
        setCredsOpen(false)
      } else {
        setConnStatus('error')
        setConnMsg(data.detail || 'Connection failed')
      }
    } catch (err) {
      setConnStatus('error')
      setConnMsg(err.message)
    }
  }

  const generate = async () => {
    if (!jiraId.trim() || !credsComplete || loading) return
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      setStep('Connecting to Jira...')
      await new Promise(r => setTimeout(r, 400))
      setStep('Fetching issue fields...')
      await new Promise(r => setTimeout(r, 500))
      setStep('Generating test plan with AI...')

      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jira_id: jiraId.trim(),
          jira_base_url: creds.baseUrl.trim(),
          jira_email: creds.email.trim(),
          jira_token: creds.token.trim(),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Generation failed')
      setResult(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
      setStep('')
    }
  }

  const clearCreds = () => {
    setCreds({ baseUrl: '', email: '', token: '' })
    setConnStatus(null)
    setConnMsg('')
    setCredsOpen(true)
    localStorage.removeItem(LS_KEY)
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-inner">
          <div className="header-top">
            <div className="brand">
              <span className="brand-title">B.L.A.S.T</span>
              <span className="brand-pill">Open Source</span>
            </div>
            <a className="github-link" href="https://github.com/qa-ankit-khandelwal/blast-test-plan-generator" target="_blank" rel="noopener noreferrer">
              <GitHubIcon /> Star on GitHub
            </a>
          </div>
          <h1 className="header-headline">AI-Powered Test Plan Generator</h1>
          <p className="header-sub">
            Connect your Jira account → enter a ticket ID → get a structured QA test plan instantly.<br />
            <span className="chip">GROQ llama-3.3</span> + <span className="chip">Jira REST API</span> · Your credentials stay in your browser only.
          </p>
        </div>
      </header>

      <main className="app-main">

        {/* ── Step 1: Jira Credentials ── */}
        <div className="creds-card">
          <button className="creds-toggle" onClick={() => setCredsOpen(o => !o)}>
            <div className="creds-toggle-left">
              <span className="step-badge">1</span>
              <span className="creds-toggle-title">Jira Credentials</span>
              {connStatus === 'ok' && (
                <span className="conn-pill conn-pill--ok">✓ {connMsg}</span>
              )}
              {connStatus === 'error' && (
                <span className="conn-pill conn-pill--err">✕ Failed</span>
              )}
            </div>
            <span className="creds-chevron">{credsOpen ? '▲' : '▼'}</span>
          </button>

          {credsOpen && (
            <div className="creds-body">
              <p className="creds-hint">
                Your credentials are only used to call Jira and are <strong>never stored on the server</strong>. They're saved in your browser's localStorage for convenience.
              </p>
              <div className="creds-grid">
                <div className="cred-field">
                  <label>Atlassian Domain</label>
                  <input
                    type="text"
                    placeholder="yourcompany.atlassian.net"
                    value={creds.baseUrl}
                    onChange={e => updateCred('baseUrl', e.target.value)}
                    spellCheck={false}
                  />
                </div>
                <div className="cred-field">
                  <label>Atlassian Email</label>
                  <input
                    type="email"
                    placeholder="you@company.com"
                    value={creds.email}
                    onChange={e => updateCred('email', e.target.value)}
                  />
                </div>
                <div className="cred-field cred-field--full">
                  <label>
                    API Token
                    <a href="https://id.atlassian.com/manage-profile/security/api-tokens" target="_blank" rel="noopener noreferrer" className="help-link">
                      Get token ↗
                    </a>
                  </label>
                  <input
                    type="password"
                    placeholder="ATATT3x..."
                    value={creds.token}
                    onChange={e => updateCred('token', e.target.value)}
                  />
                </div>
              </div>
              <div className="creds-actions">
                <button
                  className="btn-test"
                  onClick={testConnection}
                  disabled={!credsComplete || connStatus === 'testing'}
                >
                  {connStatus === 'testing' ? <><Spinner dark /> Testing…</> : 'Test Connection'}
                </button>
                {connStatus === 'error' && (
                  <span className="conn-error-msg">⚠ {connMsg}</span>
                )}
                {(creds.baseUrl || creds.email) && (
                  <button className="btn-clear" onClick={clearCreds}>Clear saved credentials</button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ── Step 2: Generate ── */}
        <div className="input-card">
          <div className="input-card-header">
            <span className="step-badge">2</span>
            <label className="input-label" htmlFor="jira-input">Jira Issue ID</label>
          </div>
          <div className="input-row">
            <input
              id="jira-input"
              className="jira-input"
              value={jiraId}
              onChange={e => setJiraId(e.target.value.toUpperCase())}
              placeholder="e.g. SCRUM-6, PROJ-42"
              onKeyDown={e => e.key === 'Enter' && generate()}
              disabled={loading}
              spellCheck={false}
            />
            <button
              className="btn-generate"
              onClick={generate}
              disabled={loading || !jiraId.trim() || !credsComplete}
              title={!credsComplete ? 'Fill in your Jira credentials first' : ''}
            >
              {loading ? <><Spinner dark /> Generating…</> : <><span>⚡</span> Generate Test Plan</>}
            </button>
          </div>
          {loading && (
            <div className="loading-bar-wrap">
              <div className="loading-bar" />
              <p className="loading-step">{step}</p>
            </div>
          )}
          {error && <div className="error-box">⚠ {error}</div>}
          {!credsComplete && !loading && (
            <p className="creds-warning">↑ Enter your Jira credentials in Step 1 first.</p>
          )}
        </div>

        {!result && !loading && (
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <p>Your test plan will appear here once generated.</p>
          </div>
        )}

        {result && <TestPlanView data={result.test_plan_data} markdown={result.markdown} />}
      </main>

      <footer className="app-footer">
        <span>Open Source · MIT License</span>
        <span className="footer-dot">·</span>
        <span>Built with the B.L.A.S.T Framework</span>
        <span className="footer-dot">·</span>
        <a href="https://github.com/qa-ankit-khandelwal/blast-test-plan-generator" target="_blank" rel="noopener noreferrer">
          Contribute on GitHub
        </a>
      </footer>
    </div>
  )
}

function GitHubIcon() {
  return (
    <svg height="18" width="18" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
    </svg>
  )
}
