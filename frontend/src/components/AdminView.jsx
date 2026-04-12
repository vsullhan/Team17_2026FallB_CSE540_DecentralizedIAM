import React, { useState } from 'react'
import { keccak256, toUtf8Bytes } from 'ethers'
import { isDemoIssuer, DEMO_ISSUERS } from '../demoData'

// supported cred types w/ placeholder text for the form
const CREDENTIAL_TYPES = [
  { value: 'medical_license', label: 'Medical License', placeholder: 'License #, State, Expiration' },
  { value: 'diploma', label: 'Diploma / Degree', placeholder: 'Degree, University, Graduation Year' },
  { value: 'professional_cert', label: 'Professional Certification', placeholder: 'Cert Name, Issuing Body, ID #' },
  { value: 'drivers_license', label: "Driver's License", placeholder: 'License #, State, Class' },
  { value: 'vaccination', label: 'Vaccination Record', placeholder: 'Vaccine, Date, Provider' },
  { value: 'background_check', label: 'Background Check', placeholder: 'Check Type, Date, Result' },
  { value: 'work_auth', label: 'Work Authorization', placeholder: 'Auth Type, Country, Expiration' },
]

// admin panel - issuer mgmt + cred issuance
// two sub-sections toggled by the tabs
function AdminView({ contract, onLog, demoMode }) {
  const [activeSection, setActiveSection] = useState('issuers')

  // issuer mgmt state
  const [issuerAddr, setIssuerAddr] = useState('')
  const [checkAddr, setCheckAddr] = useState('')
  const [checkResult, setCheckResult] = useState(null)
  const [issuerStatus, setIssuerStatus] = useState('')
  const [issuerLoading, setIssuerLoading] = useState(false)

  // cred issuance state
  const [recipientAddr, setRecipientAddr] = useState('')
  const [credType, setCredType] = useState(CREDENTIAL_TYPES[0].value)
  const [credData, setCredData] = useState('')
  const [revokeAddr, setRevokeAddr] = useState('')
  const [revokeIndex, setRevokeIndex] = useState('')
  const [credStatus, setCredStatus] = useState('')
  const [credLoading, setCredLoading] = useState(false)

  const currentType = CREDENTIAL_TYPES.find(t => t.value === credType)

  // -- issuer mgmt funcs --

  async function handleAddIssuer() {
    if (!issuerAddr) return
    setIssuerLoading(true)
    setIssuerStatus('')

    if (demoMode) {
      await new Promise(r => setTimeout(r, 600))
      setIssuerStatus(`Authorized ${issuerAddr} as trusted issuer`)
      onLog('Issuer Authorized', `${issuerAddr.slice(0, 8)}...${issuerAddr.slice(-4)} added`)
      setIssuerAddr('')
      setIssuerLoading(false)
      return
    }

    try {
      const tx = await contract.setTrustedIssuer(issuerAddr, true)
      await tx.wait()
      setIssuerStatus(`Authorized ${issuerAddr} as trusted issuer`)
      onLog('Issuer Authorized', `${issuerAddr.slice(0, 8)}...${issuerAddr.slice(-4)} added`)
      setIssuerAddr('')
    } catch (err) {
      setIssuerStatus(`Error: ${err.reason || err.message}`)
    }
    setIssuerLoading(false)
  }

  async function handleRemoveIssuer() {
    if (!issuerAddr) return
    setIssuerLoading(true)
    setIssuerStatus('')

    if (demoMode) {
      await new Promise(r => setTimeout(r, 600))
      setIssuerStatus(`Revoked authorization for ${issuerAddr}`)
      onLog('Issuer Removed', `${issuerAddr.slice(0, 8)}...${issuerAddr.slice(-4)} removed`)
      setIssuerAddr('')
      setIssuerLoading(false)
      return
    }

    try {
      const tx = await contract.setTrustedIssuer(issuerAddr, false)
      await tx.wait()
      setIssuerStatus(`Revoked authorization for ${issuerAddr}`)
      onLog('Issuer Removed', `${issuerAddr.slice(0, 8)}...${issuerAddr.slice(-4)} removed`)
      setIssuerAddr('')
    } catch (err) {
      setIssuerStatus(`Error: ${err.reason || err.message}`)
    }
    setIssuerLoading(false)
  }

  // check if addr is a trusted issuer on-chain (or in demo list)
  async function handleCheckIssuer() {
    if (!checkAddr) return
    setCheckResult(null)

    if (demoMode) {
      const isTrusted = isDemoIssuer(checkAddr)
      setCheckResult(isTrusted)
      return
    }

    try {
      const isTrusted = await contract.trustedIssuers(checkAddr)
      setCheckResult(isTrusted)
    } catch (err) {
      setIssuerStatus(`Error: ${err.reason || err.message}`)
    }
  }

  // -- cred issuance funcs --

  // hash type + data together then send to contract
  async function handleIssue() {
    if (!recipientAddr || !credData) return
    setCredLoading(true)
    setCredStatus('')

    if (demoMode) {
      await new Promise(r => setTimeout(r, 800))
      const rawData = `${credType}:${credData}`
      const hash = keccak256(toUtf8Bytes(rawData))
      setCredStatus(`Credential issued! Hash: ${hash.slice(0, 16)}...`)
      onLog('Credential Issued', `${currentType.label} to ${recipientAddr.slice(0, 8)}...${recipientAddr.slice(-4)}`)
      setRecipientAddr('')
      setCredData('')
      setCredLoading(false)
      return
    }

    try {
      const rawData = `${credType}:${credData}`
      const hash = keccak256(toUtf8Bytes(rawData))
      const tx = await contract.issueCredential(recipientAddr, hash)
      await tx.wait()
      setCredStatus(`Credential issued! Hash: ${hash.slice(0, 16)}...`)
      onLog('Credential Issued', `${currentType.label} to ${recipientAddr.slice(0, 8)}...${recipientAddr.slice(-4)}`)
      setRecipientAddr('')
      setCredData('')
    } catch (err) {
      setCredStatus(`Error: ${err.reason || err.message}`)
    }
    setCredLoading(false)
  }

  // revoke cred by holder addr + index
  async function handleRevoke() {
    if (!revokeAddr || revokeIndex === '') return
    setCredLoading(true)
    setCredStatus('')

    if (demoMode) {
      await new Promise(r => setTimeout(r, 600))
      setCredStatus(`Credential at index ${revokeIndex} revoked`)
      onLog('Credential Revoked', `Index ${revokeIndex} for ${revokeAddr.slice(0, 8)}...${revokeAddr.slice(-4)}`)
      setRevokeAddr('')
      setRevokeIndex('')
      setCredLoading(false)
      return
    }

    try {
      const tx = await contract.revokeCredential(revokeAddr, parseInt(revokeIndex))
      await tx.wait()
      setCredStatus(`Credential at index ${revokeIndex} revoked`)
      onLog('Credential Revoked', `Index ${revokeIndex} for ${revokeAddr.slice(0, 8)}...${revokeAddr.slice(-4)}`)
      setRevokeAddr('')
      setRevokeIndex('')
    } catch (err) {
      setCredStatus(`Error: ${err.reason || err.message}`)
    }
    setCredLoading(false)
  }

  return (
    <div className="admin-view">
      <div className="view-header">
        <h2>Admin Panel</h2>
        <p className="view-desc">
          Manage trusted issuers and issue credentials. Only authorized wallets can perform these actions.
        </p>
      </div>

      {/* sub-tabs */}
      <div className="admin-tabs">
        <button
          className={`admin-tab ${activeSection === 'issuers' ? 'active' : ''}`}
          onClick={() => setActiveSection('issuers')}
        >
          Issuer Management
        </button>
        <button
          className={`admin-tab ${activeSection === 'credentials' ? 'active' : ''}`}
          onClick={() => setActiveSection('credentials')}
        >
          Issue Credentials
        </button>
      </div>

      {/* issuer mgmt */}
      {activeSection === 'issuers' && (
        <div className="panel">
          <h3>Manage Trusted Issuers</h3>
          <p className="panel-desc">
            Authorize or revoke organizations — hospitals, universities, government agencies, employers.
          </p>

          <div className="form-group">
            <label>Organization Wallet Address</label>
            <input
              type="text"
              placeholder="0x... (hospital, university, agency, etc.)"
              value={issuerAddr}
              onChange={(e) => setIssuerAddr(e.target.value)}
            />
          </div>
          <div className="btn-row">
            <button className="btn btn-primary" onClick={handleAddIssuer} disabled={issuerLoading}>
              {issuerLoading ? 'Processing...' : 'Authorize'}
            </button>
            <button className="btn btn-danger" onClick={handleRemoveIssuer} disabled={issuerLoading}>
              {issuerLoading ? 'Processing...' : 'Revoke'}
            </button>
          </div>

          {issuerStatus && <p className="status-msg">{issuerStatus}</p>}

          <div className="divider"></div>

          <h3>Check Issuer Status</h3>
          <p className="panel-desc">
            {demoMode ? `Try one of the demo issuers: ${Object.keys(DEMO_ISSUERS)[0]}` : 'Enter an address to check if it is an authorized issuer.'}
          </p>
          <div className="form-group">
            <label>Address to Check</label>
            <input
              type="text"
              placeholder="0x..."
              value={checkAddr}
              onChange={(e) => setCheckAddr(e.target.value)}
            />
          </div>
          <button className="btn btn-secondary" onClick={handleCheckIssuer}>
            Check Status
          </button>

          {checkResult !== null && (
            <div className={`issuer-check-result ${checkResult ? 'authorized' : 'not-authorized'}`}>
              {checkResult ? 'Authorized Issuer' : 'Not an authorized issuer'}
            </div>
          )}
        </div>
      )}

      {/* cred issuance */}
      {activeSection === 'credentials' && (
        <div className="panel">
          <h3>Issue New Credential</h3>
          <p className="panel-desc">
            Issue a credential to a registered user. Raw data gets hashed before going on-chain.
          </p>

          <div className="form-group">
            <label>Recipient Address</label>
            <input
              type="text"
              placeholder="0x... (credential holder's wallet)"
              value={recipientAddr}
              onChange={(e) => setRecipientAddr(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>Credential Type</label>
            <select value={credType} onChange={(e) => setCredType(e.target.value)}>
              {CREDENTIAL_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Credential Details (will be hashed)</label>
            <input
              type="text"
              placeholder={currentType ? currentType.placeholder : ''}
              value={credData}
              onChange={(e) => setCredData(e.target.value)}
            />
          </div>
          <button className="btn btn-primary" onClick={handleIssue} disabled={credLoading}>
            {credLoading ? 'Issuing...' : 'Issue Credential'}
          </button>

          <div className="divider"></div>

          <h3>Revoke Credential</h3>
          <div className="form-group">
            <label>Holder Address</label>
            <input
              type="text"
              placeholder="0x..."
              value={revokeAddr}
              onChange={(e) => setRevokeAddr(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>Credential Index</label>
            <input
              type="number"
              placeholder="0"
              value={revokeIndex}
              onChange={(e) => setRevokeIndex(e.target.value)}
            />
          </div>
          <button className="btn btn-danger" onClick={handleRevoke} disabled={credLoading}>
            {credLoading ? 'Revoking...' : 'Revoke Credential'}
          </button>

          {credStatus && <p className="status-msg">{credStatus}</p>}
        </div>
      )}
    </div>
  )
}

export default AdminView
