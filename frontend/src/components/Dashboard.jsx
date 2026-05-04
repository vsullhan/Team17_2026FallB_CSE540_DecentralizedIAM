import React, { useState, useEffect } from "react";
import ExportProof from "./ExportProof";
import { DEMO_CREDENTIALS } from "../demoData";

// off-chain credential store — simulates IPFS/encrypted DB
// maps credentialHash -> full credential blob
// in production this would be an IPFS node or encrypted backend
const offChainStore = {};

function storeOffChain(hash, blob) {
  offChainStore[hash] = blob;
}

function fetchOffChain(hash) {
  return offChainStore[hash] || null;
}

// recompute hash from stored blob and compare to on-chain hash
// this is the verification step the spec requires
async function verifyOffChainIntegrity(hash, blob) {
  const { keccak256, toUtf8Bytes } = await import("ethers");
  const recomputed = keccak256(toUtf8Bytes(`${blob.type}:${blob.data}`));
  return recomputed === hash;
}

function Dashboard({
  contract,
  account,
  onLog,
  contractAddress,
  activityLog,
  demoMode,
}) {
  const [isRegistered, setIsRegistered] = useState(null);
  const [credentials, setCredentials] = useState([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [exportCred, setExportCred] = useState(null);
  const [didInfo, setDidInfo] = useState(null);
  const [showDIDForm, setShowDIDForm] = useState(false);

  // DID registration fields
  const [didDocument, setDidDocument] = useState("");
  const [publicKey, setPublicKey] = useState("");
  const [serviceEndpoint, setServiceEndpoint] = useState("");

  // off-chain integrity check results per cred index
  const [integrityResults, setIntegrityResults] = useState({});

  useEffect(() => {
    if (demoMode) {
      setIsRegistered(true);
      setCredentials(DEMO_CREDENTIALS);
      setDidInfo({
        didDocument: "ipfs://QmExampleDIDDocumentCID123456789",
        publicKey: "0x04a1b2c3d4e5f6...",
        serviceEndpoint: "https://blockid.example.com/identity/0x742d35Cc",
        registeredAt: Math.floor(Date.now() / 1000) - 86400,
      });
      return;
    }
    checkRegistration();
  }, [contract, account, demoMode]);

  useEffect(() => {
    if (isRegistered && !demoMode) {
      loadCredentials();
      loadDIDInfo();
    }
  }, [isRegistered]);

  async function checkRegistration() {
    if (!contract || !account) return;
    try {
      const identity = await contract.identities(account);
      setIsRegistered(identity.exists);
    } catch (err) {
      setIsRegistered(false);
    }
  }

  async function loadDIDInfo() {
    if (!contract || !account) return;
    try {
      const [doc, key, endpoint, registeredAt] =
        await contract.getDIDInfo(account);
      setDidInfo({
        didDocument: doc,
        publicKey: key,
        serviceEndpoint: endpoint,
        registeredAt: Number(registeredAt),
      });
    } catch {
      // not registered yet
    }
  }

  async function handleRegister() {
    if (demoMode) {
      setIsRegistered(true);
      setCredentials(DEMO_CREDENTIALS);
      setDidInfo({
        didDocument: didDocument || "ipfs://QmExampleDIDDocumentCID123456789",
        publicKey: publicKey || "0x04demo...",
        serviceEndpoint: serviceEndpoint || "https://blockid.example.com",
        registeredAt: Math.floor(Date.now() / 1000),
      });
      onLog(
        "Identity Registered",
        `${account.slice(0, 8)}...${account.slice(-4)} registered on BlockID`,
      );
      return;
    }
    setLoading(true);
    setStatus("");
    try {
      const tx = await contract.registerIdentity(
        didDocument || "",
        publicKey || "",
        serviceEndpoint || "",
      );
      await tx.wait();
      setIsRegistered(true);
      setStatus("Identity registered!");
      onLog(
        "Identity Registered",
        `${account.slice(0, 8)}...${account.slice(-4)} registered on BlockID`,
      );
      loadDIDInfo();
    } catch (err) {
      setStatus(`Error: ${err.reason || err.message}`);
    }
    setLoading(false);
  }

  async function handleUpdateDID() {
    if (demoMode) {
      setDidInfo((prev) => ({ ...prev, didDocument, serviceEndpoint }));
      setShowDIDForm(false);
      onLog(
        "DID Updated",
        `DID document updated for ${account.slice(0, 8)}...${account.slice(-4)}`,
      );
      return;
    }
    setLoading(true);
    try {
      const tx = await contract.updateDID(didDocument, serviceEndpoint);
      await tx.wait();
      setStatus("DID updated!");
      setShowDIDForm(false);
      onLog(
        "DID Updated",
        `DID document updated for ${account.slice(0, 8)}...${account.slice(-4)}`,
      );
      loadDIDInfo();
    } catch (err) {
      setStatus(`Error: ${err.reason || err.message}`);
    }
    setLoading(false);
  }

  async function loadCredentials() {
    if (demoMode) {
      setCredentials(DEMO_CREDENTIALS);
      return;
    }
    try {
      const count = await contract.getCredentialCount(account);
      const creds = [];
      for (let i = 0; i < Number(count); i++) {
        const [hash, issuer, isValid] = await contract.getCredential(
          account,
          i,
        );
        creds.push({ index: i, hash, issuer, isValid });
      }
      setCredentials(creds);
    } catch (err) {
      // might not be registered yet
    }
  }

  // check off-chain blob integrity for a credential
  async function handleIntegrityCheck(cred) {
    const blob = fetchOffChain(cred.hash);
    if (!blob) {
      setIntegrityResults((prev) => ({ ...prev, [cred.index]: "no-blob" }));
      return;
    }
    const ok = await verifyOffChainIntegrity(cred.hash, blob);
    setIntegrityResults((prev) => ({
      ...prev,
      [cred.index]: ok ? "ok" : "mismatch",
    }));
  }

  const hasValidCred = credentials.some((c) => c.isValid);
  const validCount = credentials.filter((c) => c.isValid).length;

  return (
    <div className="dashboard">
      {/* identity card */}
      <div className="identity-card">
        <div className="identity-left">
          <div className="identity-avatar">
            {account.slice(2, 4).toUpperCase()}
          </div>
          <div className="identity-info">
            <h2 className="identity-address">
              {account.slice(0, 8)}...{account.slice(-6)}
            </h2>
            {isRegistered === null ? (
              <span className="status-badge loading">Checking...</span>
            ) : isRegistered ? (
              <span className="status-badge registered">Registered</span>
            ) : (
              <span className="status-badge not-registered">
                Not Registered
              </span>
            )}
          </div>
        </div>

        <div className="verify-badge-area">
          {isRegistered && hasValidCred ? (
            <div className="verify-badge verified">
              <span className="badge-check">&#10003;</span>
              <div>
                <strong>Verified Identity</strong>
                <span>
                  {validCount} active credential{validCount !== 1 ? "s" : ""}
                </span>
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
          ) : null}
        </div>
      </div>

      {/* registration form — shown if not registered */}
      {isRegistered === false && (
        <div className="panel">
          <h3>Register Identity</h3>
          <p className="panel-desc">
            Anchor your DID on-chain. The DID document (stored off-chain on
            IPFS) contains your full identity metadata. Only a reference hash is
            stored on the blockchain.
          </p>
          <div className="form-group">
            <label>
              DID Document Reference{" "}
              <span className="field-hint">(IPFS CID or URL — optional)</span>
            </label>
            <input
              type="text"
              placeholder="ipfs://Qm... or https://..."
              value={didDocument}
              onChange={(e) => setDidDocument(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>
              Public Key{" "}
              <span className="field-hint">
                (verification key for this DID — optional)
              </span>
            </label>
            <input
              type="text"
              placeholder="0x04... or base58 encoded key"
              value={publicKey}
              onChange={(e) => setPublicKey(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>
              Service Endpoint{" "}
              <span className="field-hint">
                (messaging or storage URL — optional)
              </span>
            </label>
            <input
              type="text"
              placeholder="https://..."
              value={serviceEndpoint}
              onChange={(e) => setServiceEndpoint(e.target.value)}
            />
          </div>
          <button
            className="btn btn-primary"
            onClick={handleRegister}
            disabled={loading}
          >
            {loading ? "Registering..." : "Register Identity"}
          </button>
        </div>
      )}

      {status && <p className="status-msg">{status}</p>}

      {/* DID info panel */}
      {isRegistered && didInfo && (
        <div className="dashboard-section">
          <div className="section-header">
            <h3>DID Metadata</h3>
            <button
              className="btn btn-small btn-secondary"
              onClick={() => setShowDIDForm(!showDIDForm)}
            >
              {showDIDForm ? "Cancel" : "Update DID"}
            </button>
          </div>

          {showDIDForm ? (
            <div>
              <div className="form-group">
                <label>DID Document Reference</label>
                <input
                  type="text"
                  placeholder="ipfs://Qm... or https://..."
                  value={didDocument}
                  onChange={(e) => setDidDocument(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Service Endpoint</label>
                <input
                  type="text"
                  placeholder="https://..."
                  value={serviceEndpoint}
                  onChange={(e) => setServiceEndpoint(e.target.value)}
                />
              </div>
              <button
                className="btn btn-primary"
                onClick={handleUpdateDID}
                disabled={loading}
              >
                {loading ? "Updating..." : "Save Update"}
              </button>
            </div>
          ) : (
            <div className="did-info-grid">
              <div className="did-field">
                <label>DID Document</label>
                <span className="mono">
                  {didInfo.didDocument || (
                    <em className="text-faint">Not set</em>
                  )}
                </span>
              </div>
              <div className="did-field">
                <label>Public Key</label>
                <span className="mono">
                  {didInfo.publicKey || <em className="text-faint">Not set</em>}
                </span>
              </div>
              <div className="did-field">
                <label>Service Endpoint</label>
                <span className="mono">
                  {didInfo.serviceEndpoint || (
                    <em className="text-faint">Not set</em>
                  )}
                </span>
              </div>
              <div className="did-field">
                <label>Registered At</label>
                <span>
                  {didInfo.registeredAt
                    ? new Date(didInfo.registeredAt * 1000).toLocaleString()
                    : "—"}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* credentials list */}
      {isRegistered && (
        <div className="dashboard-section">
          <div className="section-header">
            <h3>Credentials</h3>
            <button
              className="btn btn-small btn-secondary"
              onClick={loadCredentials}
            >
              Refresh
            </button>
          </div>

          {credentials.length === 0 ? (
            <p className="empty-state">
              No credentials yet. Once a trusted issuer issues a credential to
              this wallet it will show up here.
            </p>
          ) : (
            <div className="cred-grid">
              {credentials.map((c) => {
                const integrity = integrityResults[c.index];
                return (
                  <div
                    key={c.index}
                    className={`cred-card ${c.isValid ? "valid" : "revoked"}`}
                  >
                    <div className="cred-card-top">
                      <span
                        className={`cred-status-dot ${c.isValid ? "green" : "red"}`}
                      ></span>
                      <span className="cred-status-text">
                        {c.isValid ? "Valid" : "Revoked"}
                      </span>
                      {c._type && (
                        <span className="cred-type-label">{c._type}</span>
                      )}
                    </div>
                    <div className="cred-card-body">
                      <div className="cred-field">
                        <label>Credential Hash</label>
                        <span className="mono">{c.hash.slice(0, 18)}...</span>
                      </div>
                      <div className="cred-field">
                        <label>Issued By</label>
                        <span className="mono">
                          {c.issuer.slice(0, 10)}...{c.issuer.slice(-4)}
                        </span>
                      </div>
                      {/* off-chain integrity status */}
                      {integrity && (
                        <div className="cred-field">
                          <label>Off-Chain Integrity</label>
                          <span
                            className={
                              integrity === "ok"
                                ? "integrity-ok"
                                : integrity === "mismatch"
                                  ? "integrity-fail"
                                  : "integrity-missing"
                            }
                          >
                            {integrity === "ok"
                              ? "✓ Hash match"
                              : integrity === "mismatch"
                                ? "✗ Hash mismatch"
                                : "— No off-chain data"}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="btn-row">
                      <button
                        className="btn btn-small btn-secondary cred-export-btn"
                        onClick={() =>
                          setExportCred({
                            holder: account,
                            index: c.index,
                            credentialHash: c.hash,
                            issuer: c.issuer,
                            isValid: c.isValid,
                          })
                        }
                      >
                        Export Proof
                      </button>
                      <button
                        className="btn btn-small btn-secondary"
                        onClick={() => handleIntegrityCheck(c)}
                        title="Recompute hash from off-chain blob and compare to on-chain record"
                      >
                        Verify Integrity
                      </button>
                    </div>
                  </div>
                );
              })}
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
  );
}

export default Dashboard;

// export the off-chain store helpers so AdminView can write to it on issuance
export { storeOffChain, fetchOffChain };
