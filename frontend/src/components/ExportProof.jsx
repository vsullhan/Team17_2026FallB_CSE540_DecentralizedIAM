import React, { useState } from 'react'

// modal that builds a shareable JSON proof for a cred
// in prod this would get sent to a 3rd party for off-chain verification
function ExportProof({ credential, contractAddress, onClose }) {
  const [copied, setCopied] = useState(false)

  // build proof obj w/ all the relavant info
  const proof = {
    platform: 'BlockID',
    network: 'Polygon Amoy Testnet',
    contractAddress: contractAddress,
    holder: credential.holder,
    credentialIndex: credential.index,
    credentialHash: credential.credentialHash,
    issuer: credential.issuer,
    isValid: credential.isValid,
    verifiedAt: new Date().toISOString(),
  }

  const proofJson = JSON.stringify(proof, null, 2)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(proofJson)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      // fallback if clipboard api doesnt work
      const textarea = document.createElement('textarea')
      textarea.value = proofJson
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="proof-overlay" onClick={onClose}>
      <div className="proof-modal" onClick={(e) => e.stopPropagation()}>
        <div className="proof-header">
          <h3>Credential Proof</h3>
          <button className="btn btn-close" onClick={onClose}>x</button>
        </div>
        <p className="proof-desc">
          Share this JSON with a third party to prove a credential exists on-chain without exposing raw data.
        </p>
        <pre className="proof-json">{proofJson}</pre>
        <button className="btn btn-primary" onClick={handleCopy}>
          {copied ? 'Copied!' : 'Copy to Clipboard'}
        </button>
      </div>
    </div>
  )
}

export default ExportProof
