import React, { useState, useEffect } from 'react'
import useContract from './hooks/useContract'
import ConnectWallet from './components/ConnectWallet'
import Dashboard from './components/Dashboard'
import VerifierView from './components/VerifierView'
import AdminView from './components/AdminView'
import { DEMO_ACCOUNT, DEMO_CONTRACT, DEMO_ACTIVITY_LOG } from './demoData'

// main app component - blockID decentralized sso
// shows connect gate if no wallet, otherwise loads the dashboard
function App() {
  const [contractAddr, setContractAddr] = useState('')
  const [activeView, setActiveView] = useState('dashboard')
  const [activityLog, setActivityLog] = useState([])
  const [showConfig, setShowConfig] = useState(false)
  const [demoMode, setDemoMode] = useState(false)
  const [demoAccount, setDemoAccount] = useState(null)
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('blockid-theme') || 'dark'
  })
  const { contract, account, error, connect } = useContract(contractAddr)

  // use real wallet or demo acct depending on mode
  const activeAccount = demoMode ? demoAccount : account

  // sync theme to html element + localstorage
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('blockid-theme', theme)
  }, [theme])

  function toggleTheme() {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark')
  }

  // callback for child components to add entries to teh activity log
  function addLog(action, details) {
    const entry = {
      timestamp: new Date().toLocaleTimeString(),
      action,
      details,
    }
    setActivityLog(prev => [entry, ...prev])
  }

  // sets up demo mode - skips wallet + contract entirely
  function handleDemoMode() {
    setDemoMode(true)
    setDemoAccount(DEMO_ACCOUNT)
    setContractAddr(DEMO_CONTRACT)
    setActivityLog([...DEMO_ACTIVITY_LOG])
  }

  // no wallet and no demo? show the connect gate
  if (!activeAccount) {
    return (
      <ConnectWallet
        onConnect={connect}
        onDemoMode={handleDemoMode}
        error={error}
        theme={theme}
        onToggleTheme={toggleTheme}
      />
    )
  }

  const navItems = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'verify', label: 'Verify' },
    { id: 'admin', label: 'Admin' },
  ]

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-top">
          <h1 className="logo" onClick={() => setActiveView('dashboard')}>BlockID</h1>
          <nav className="main-nav">
            {navItems.map((item) => (
              <button
                key={item.id}
                className={`nav-item ${activeView === item.id ? 'active' : ''}`}
                onClick={() => setActiveView(item.id)}
              >
                {item.label}
              </button>
            ))}
          </nav>
          <div className="header-actions">
            {demoMode && <span className="demo-badge">Demo Mode</span>}
            <button className="btn btn-theme" onClick={toggleTheme} title="Toggle theme">
              {theme === 'dark' ? '☀' : '☽'}
            </button>
            <div className="wallet-info">
              <span className="dot green"></span>
              <span className="address">
                {activeAccount.slice(0, 6)}...{activeAccount.slice(-4)}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* contract config - hidden when demo */}
      {!demoMode && (
        <div className="config-bar">
          <button className="config-toggle" onClick={() => setShowConfig(!showConfig)}>
            {contractAddr && contract
              ? `Contract: ${contractAddr.slice(0, 8)}...${contractAddr.slice(-4)}`
              : 'Set Contract Address'}
            <span className={`arrow ${showConfig ? 'open' : ''}`}>&#9662;</span>
          </button>
          {showConfig && (
            <div className="config-panel">
              <input
                type="text"
                placeholder="Paste deployed contract address here..."
                value={contractAddr}
                onChange={(e) => setContractAddr(e.target.value)}
              />
              {contractAddr && contract && (
                <span className="connected-badge">Connected</span>
              )}
            </div>
          )}
        </div>
      )}

      <main className="app-main">
        {!demoMode && !contract ? (
          <div className="no-contract-msg">
            <h2>Connect to a Contract</h2>
            <p>Click "Set Contract Address" above and paste the deployed IdentityRegistry address to get started.</p>
          </div>
        ) : (
          <>
            {activeView === 'dashboard' && (
              <Dashboard
                contract={contract}
                account={activeAccount}
                onLog={addLog}
                contractAddress={contractAddr}
                activityLog={activityLog}
                demoMode={demoMode}
              />
            )}
            {activeView === 'verify' && (
              <VerifierView
                contract={contract}
                onLog={addLog}
                contractAddress={contractAddr}
                demoMode={demoMode}
              />
            )}
            {activeView === 'admin' && (
              <AdminView
                contract={contract}
                onLog={addLog}
                demoMode={demoMode}
              />
            )}
          </>
        )}
      </main>

      <footer className="app-footer">
        <p>BlockID — Decentralized Identity & Access Management</p>
      </footer>
    </div>
  )
}

export default App
