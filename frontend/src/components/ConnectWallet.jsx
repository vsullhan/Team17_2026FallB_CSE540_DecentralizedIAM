import React from 'react'

// full-page connect screen, kinda like an SSO login page
function ConnectWallet({ onConnect, onDemoMode, error, theme, onToggleTheme }) {
  return (
    <div className="connect-gate">
      <button className="btn btn-theme gate-theme-btn" onClick={onToggleTheme} title="Toggle theme">
        {theme === 'dark' ? '☀' : '☽'}
      </button>

      <div className="connect-card">
        <div className="connect-logo">
          <h1>BlockID</h1>
          <p className="connect-tagline">Decentralized Credential Verification</p>
        </div>

        <div className="connect-body">
          <p className="connect-desc">
            Connect a wallet to verify identity, view credentials, or check someone elses credentials on-chain.
          </p>

          <button className="btn btn-connect-large" onClick={onConnect}>
            Connect Wallet
          </button>

          <div className="connect-divider">
            <span>or</span>
          </div>

          <button className="btn btn-demo" onClick={onDemoMode}>
            Try Demo
          </button>

          <p className="connect-hint">
            Demo mode uses sample data — no wallet required
          </p>
        </div>

        {error && <p className="error-msg">{error}</p>}

        <div className="connect-features">
          <div className="feature">
            <strong>SSO for Blockchain</strong>
            <span>One wallet, all credentials</span>
          </div>
          <div className="feature">
            <strong>Privacy First</strong>
            <span>Only hashes stored on-chain</span>
          </div>
          <div className="feature">
            <strong>Instant Verification</strong>
            <span>Anyone can verify, no middleman</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ConnectWallet
