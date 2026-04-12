import React, { useState, useEffect } from 'react'
import ExportProof from './ExportProof'
import { DEMO_CREDENTIALS } from '../demoData'

// dashboard - shows identity status + creds after connecting
// acts like the SSO profile page
function Dashboard({ contract, account, onLog, contractAddress, activityLog, demoMode }) {
  const [isRegistered, setIsRegistered] = useState(null)
  const [credentials, setCredentials] = useState([])
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState('')
  const [exportCred, setExportCred] = useState(null)

  // check registration on load
  useEffect(() => {
    if (demoMode) {
      // demo mode - everythings pre-loaded
      setIsRegistered(true)
      setCredentials(DEMO_CREDENTIALS)
      return
    }
    checkRegistration()
  }, [contract, account, demoMode])

  // auto-load creds once registered (live mode only)
  useEffect(() => {
    if (isRegistered && !demoMode) {
      loadCredentials()
    }
  }, [isRegistered])

  async function checkRegistration() {
    if (!contract || !account) return
    try {
      const identity = await contract.identities(account)
      setIsRegistered(identity.exists)
    } catch (err) {
      setIsRegistered(false)
    }
  }

  async function handleRegister() {
    if (demoMode) {
      setIsRegistered(true)
      setCredentials(DEMO_CREDENTIALS)
      onLog('Identity Registered', `${account.slice(0, 8)}...${account.slice(-4)} registered on BlockID`)
      return
    }
    setLoading(true)
    setStatus('')
    try {
      const tx = await contract.registerIdentity()
      await tx.wait()
      setIsRegistered(true)
      setStatus('Identity registered!')
      onLog('Identity Registered', `${account.slice(0, 8)}...${account.slice(-4)} registered on BlockID`)
    } catch (err) {
      setStatus(`Error: ${err.reason || err.message}`)
    }
    setLoading(false)
  }

  // pull all creds for connected acct
  async function loadCredentials() {
    if (demoMode) {
      setCredentials(DEMO_CREDENTIALS)
      return
    }
    try {
      const count = await contract.getCredentialCount(account)
      const creds = []
      for (let i = 0; i < Number(count); i++) {
        const [hash, issuer, isValid] = await contract.getCredential(account, i)
        creds.push({ index: i, hash, issuer, isValid })
      }
      setCredentials(creds)
    } catch (err) {
      // might not be registered yet, thats fine
    }
  }

  // calc badge status
  const hasValidCred = credentials.some(c => c.isValid)
  const validCount = credentials.filter(c => c.isValid).length

  return (
    <div className="dashboard">
      {/* identity card */}
      <div className="identity-card">
        <div className="identity-left">
          <div className="identity-avatar">
            {account.slice(2, 4).toUpperCase()}
          </div>
          <div className="identity-info">
            <h2 className="identity-address">{account.slice(0, 8)}...{account.slice(-6)}</h2>
            {isRegistered === null ? (
              <span className="status-badge loading">Checking...</span>
            ) : isRegistered ? (
              <span className="status-badge registered">Registered</span>
            ) : (
              <span className="status-badge not-registered">Not Registered</span>
            )}
          </div>
        </div>

        {/* verify badge */}
        <div className="verify-badge-area">
          {isRegistered && hasValidCred ? (
            <div className="verify-badge verified">
              <span className="badge-check">&#10003;</span>
              <div>
                <strong>Verified Identity</strong>
                <span>{validCount} active credential{validCount !== 1 ? 's' : ''}</span>
              </div>
            </div>
          ) : isRegistered ? (
            <div className="verify-badge pending">
              <span className="badge-icon">&#8212;</span>
              <div>
                <strong>No Active Credentials</strong>
                <span>Awaiting credential issuance</span>
              </div>
            </div>
          ) : (
            <button className="btn btn-primary" onClick={handleRegister} disabled={loading}>
              {loading ? 'Registering...' : 'Register Identity'}
            </button>
          )}
        </div>
      </div>

      {status && <p className="status-msg">{status}</p>}

      {/* creds list */}
      {isRegistered && (
        <div className="dashboard-section">
          <div className="section-header">
            <h3>Credentials</h3>
            <button className="btn btn-small btn-secondary" onClick={loadCredentials}>
              Refresh
            </button>
          </div>

          {credentials.length === 0 ? (
            <p className="empty-state">
              No credentials yet. Once a trusted issuer issues a credential to this wallet it will show up here.
            </p>
          ) : (
            <div className="cred-grid">
              {credentials.map((c) => (
                <div key={c.index} className={`cred-card ${c.isValid ? 'valid' : 'revoked'}`}>
                  <div className="cred-card-top">
                    <span className={`cred-status-dot ${c.isValid ? 'green' : 'red'}`}></span>
                    <span className="cred-status-text">{c.isValid ? 'Valid' : 'Revoked'}</span>
                    {c._type && <span className="cred-type-label">{c._type}</span>}
                  </div>
                  <div className="cred-card-body">
                    <div className="cred-field">
                      <label>Credential Hash</label>
                      <span className="mono">{c.hash.slice(0, 18)}...</span>
                    </div>
                    <div className="cred-field">
                      <label>Issued By</label>
                      <span className="mono">{c.issuer.slice(0, 10)}...{c.issuer.slice(-4)}</span>
                    </div>
                  </div>
                  <button
                    className="btn btn-small btn-secondary cred-export-btn"
                    onClick={() => setExportCred({
                      holder: account,
                      index: c.index,
                      credentialHash: c.hash,
                      issuer: c.issuer,
                      isValid: c.isValid,
                    })}
                  >
                    Export Proof
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* activity log */}
      {activityLog.length > 0 && (
        <div className="dashboard-section">
          <h3>Activity Log</h3>
          <div className="log-entries">
            {activityLog.map((entry, i) => (
              <div key={i} className="log-entry">
                <span className="log-time">{entry.timestamp}</span>
                <span className="log-action">{entry.action}</span>
                <span className="log-details">{entry.details}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {exportCred && (
        <ExportProof
          credential={exportCred}
          contractAddress={contractAddress}
          onClose={() => setExportCred(null)}
        />
      )}
    </div>
  )
}

export default Dashboard
