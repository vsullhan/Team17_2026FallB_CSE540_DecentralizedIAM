import React, { useState } from "react";
import ExportProof from "./ExportProof";
import { DEMO_ACCOUNT, DEMO_CREDENTIALS } from "../demoData";
import { fetchOffChain } from "./Dashboard";
import { keccak256, toUtf8Bytes } from "ethers";

// recompute hash from off-chain blob and compare to on-chain hash
function checkIntegrity(onChainHash, blob) {
  if (!blob) return null;
  const recomputed = keccak256(toUtf8Bytes(`${blob.type}:${blob.data}`));
  return recomputed === onChainHash;
}

// verifier view - services use this to check creds before granting access
// uses verifyCredential (state-changing, emits CredentialVerified event for auditability)
// also checks off-chain blob integrity by recomputing the hash
function VerifierView({ contract, onLog, contractAddress, demoMode }) {
  const [searchAddr, setSearchAddr] = useState("");
  const [credentials, setCredentials] = useState([]);
  const [singleAddr, setSingleAddr] = useState("");
  const [singleIndex, setSingleIndex] = useState("");
  const [singleResult, setSingleResult] = useState(null);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [exportCred, setExportCred] = useState(null);
  const [integrityMap, setIntegrityMap] = useState({});

  // fetch all creds for a given addr (read-only lookup, no event)
  async function handleSearch() {
    if (!searchAddr) return;
    setLoading(true);
    setStatus("");
    setCredentials([]);
    setIntegrityMap({});

    if (demoMode) {
      await new Promise((r) => setTimeout(r, 400));
      if (searchAddr.toLowerCase() === DEMO_ACCOUNT.toLowerCase()) {
        setCredentials(DEMO_CREDENTIALS);
        onLog(
          "Credential Lookup",
          `Found ${DEMO_CREDENTIALS.length} credential(s) for ${searchAddr.slice(0, 8)}...${searchAddr.slice(-4)}`,
        );
      } else {
        setStatus("No credentials found for this address");
      }
      setLoading(false);
      return;
    }

    try {
      const count = await contract.getCredentialCount(searchAddr);
      const numCount = Number(count);

      if (numCount === 0) {
        setStatus("No credentials found for this address");
        setLoading(false);
        return;
      }

      const creds = [];
      const integrity = {};
      for (let i = 0; i < numCount; i++) {
        const [hash, issuer, isValid] = await contract.getCredential(
          searchAddr,
          i,
        );
        creds.push({ index: i, hash, issuer, isValid });
        // check off-chain blob integrity for each credential
        const blob = fetchOffChain(hash);
        integrity[i] = checkIntegrity(hash, blob);
      }
      setCredentials(creds);
      setIntegrityMap(integrity);
      onLog(
        "Credential Lookup",
        `Found ${creds.length} credential(s) for ${searchAddr.slice(0, 8)}...${searchAddr.slice(-4)}`,
      );
    } catch (err) {
      setStatus(`Error: ${err.reason || err.message}`);
    }
    setLoading(false);
  }

  // verify single cred — calls verifyCredential (non-view) which emits CredentialVerified event on-chain
  // this satisfies the spec requirement to "log access and verification events immutably"
  async function handleSingleVerify() {
    if (!singleAddr || singleIndex === "") return;
    setSingleResult(null);
    setStatus("");

    if (demoMode) {
      await new Promise((r) => setTimeout(r, 300));
      const idx = parseInt(singleIndex);
      if (
        singleAddr.toLowerCase() === DEMO_ACCOUNT.toLowerCase() &&
        idx >= 0 &&
        idx < DEMO_CREDENTIALS.length
      ) {
        const c = DEMO_CREDENTIALS[idx];
        const blob = fetchOffChain(c.hash);
        const integrity = checkIntegrity(c.hash, blob);
        setSingleResult({
          hash: c.hash,
          issuer: c.issuer,
          isValid: c.isValid,
          integrity,
        });
        onLog(
          "Credential Verified",
          `Index ${singleIndex} for ${singleAddr.slice(0, 8)}...${singleAddr.slice(-4)}: ${c.isValid ? "VALID" : "REVOKED"} (event logged on-chain)`,
        );
      } else {
        setStatus("Error: Invalid index or address not found");
      }
      return;
    }

    try {
      // verifyCredential is now non-view — it emits CredentialVerified event for immutable audit trail
      const tx = await contract.verifyCredential(
        singleAddr,
        parseInt(singleIndex),
      );
      await tx.wait();

      // read the full credential details after verification
      const [hash, issuer, isValid] = await contract.getCredential(
        singleAddr,
        parseInt(singleIndex),
      );

      // check off-chain blob integrity — recompute hash and compare to on-chain commitment
      const blob = fetchOffChain(hash);
      const integrity = checkIntegrity(hash, blob);

      setSingleResult({ hash, issuer, isValid, integrity });
      onLog(
        "Credential Verified",
        `Index ${singleIndex} for ${singleAddr.slice(0, 8)}...${singleAddr.slice(-4)}: ${isValid ? "VALID" : "REVOKED"} (CredentialVerified event emitted)`,
      );
    } catch (err) {
      setStatus(`Error: ${err.reason || err.message}`);
    }
  }

  function renderIntegrity(integrity) {
    if (integrity === null)
      return <span className="integrity-missing">— No off-chain blob</span>;
    if (integrity === true)
      return (
        <span className="integrity-ok">✓ Hash matches off-chain data</span>
      );
    return (
      <span className="integrity-fail">
        ✗ Hash mismatch — data may be tampered
      </span>
    );
  }

  return (
    <div className="verifier-view">
      <div className="view-header">
        <h2>Verify Credentials</h2>
        <p className="view-desc">
          Check credentials before granting access. Verification is logged
          immutably on-chain via the
          <code> CredentialVerified</code> event. Off-chain data integrity is
          confirmed by recomputing the hash and comparing it to the on-chain
          commitment.
        </p>
      </div>

      {/* cred lookup by addr */}
      <div className="panel">
        <h3>Credential Lookup</h3>
        <p className="panel-desc">
          Enter a wallet address to see all credentials issued to it.
        </p>

        <div className="form-row">
          <input
            type="text"
            placeholder={
              demoMode
                ? `Try: ${DEMO_ACCOUNT}`
                : "0x... (wallet address to check)"
            }
            value={searchAddr}
            onChange={(e) => setSearchAddr(e.target.value)}
            className="form-input-wide"
          />
          <button
            className="btn btn-primary"
            onClick={handleSearch}
            disabled={loading}
          >
            {loading ? "Searching..." : "Look Up"}
          </button>
        </div>

        {credentials.length > 0 && (
          <div className="cred-results">
            <h4>
              Results for {searchAddr.slice(0, 8)}...{searchAddr.slice(-4)}
            </h4>
            {credentials.map((c) => (
              <div
                key={c.index}
                className={`cred-result-row ${c.isValid ? "valid" : "revoked"}`}
              >
                <div className="cred-result-status">
                  <span
                    className={`cred-status-dot ${c.isValid ? "green" : "red"}`}
                  ></span>
                  {c.isValid ? "Valid" : "Revoked"}
                </div>
                <div className="cred-result-hash mono">
                  {c.hash.slice(0, 18)}...
                </div>
                <div className="cred-result-issuer mono">
                  {c.issuer.slice(0, 8)}...{c.issuer.slice(-4)}
                </div>
                <div className="cred-result-integrity">
                  {renderIntegrity(
                    integrityMap[c.index] !== undefined
                      ? integrityMap[c.index]
                      : null,
                  )}
                </div>
                <button
                  className="btn btn-small btn-secondary"
                  onClick={() =>
                    setExportCred({
                      holder: searchAddr,
                      index: c.index,
                      credentialHash: c.hash,
                      issuer: c.issuer,
                      isValid: c.isValid,
                    })
                  }
                >
                  Export
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* quick single cred verify — emits on-chain event */}
      <div className="panel">
        <h3>Quick Verify</h3>
        <p className="panel-desc">
          Verify a specific credential by address and index. This calls{" "}
          <code>verifyCredential</code> on-chain, emitting a{" "}
          <code>CredentialVerified</code> event as an immutable audit log entry.
          The off-chain blob is also fetched and its hash recomputed to confirm
          data integrity.
        </p>

        <div className="form-group">
          <label>Holder Address</label>
          <input
            type="text"
            placeholder="0x..."
            value={singleAddr}
            onChange={(e) => setSingleAddr(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label>Credential Index</label>
          <input
            type="number"
            placeholder="0"
            value={singleIndex}
            onChange={(e) => setSingleIndex(e.target.value)}
          />
        </div>
        <button className="btn btn-primary" onClick={handleSingleVerify}>
          Verify (logs on-chain event)
        </button>

        {singleResult && (
          <div
            className={`verify-result-card ${singleResult.isValid ? "valid" : "revoked"}`}
          >
            <h4>
              {singleResult.isValid
                ? "Credential is VALID"
                : "Credential is REVOKED"}
            </h4>
            <div className="verify-details">
              <div>
                <strong>Hash:</strong>{" "}
                <span className="mono">
                  {singleResult.hash.slice(0, 20)}...
                </span>
              </div>
              <div>
                <strong>Issued By:</strong>{" "}
                <span className="mono">{singleResult.issuer}</span>
              </div>
              <div>
                <strong>Status:</strong>{" "}
                {singleResult.isValid ? "Active" : "Revoked / Invalid"}
              </div>
              <div>
                <strong>Off-Chain Integrity:</strong>{" "}
                {renderIntegrity(singleResult.integrity)}
              </div>
              <div>
                <strong>Audit:</strong>{" "}
                <span className="integrity-ok">
                  CredentialVerified event emitted on-chain
                </span>
              </div>
            </div>
            <button
              className="btn btn-small btn-secondary"
              onClick={() =>
                setExportCred({
                  holder: singleAddr,
                  index: parseInt(singleIndex),
                  credentialHash: singleResult.hash,
                  issuer: singleResult.issuer,
                  isValid: singleResult.isValid,
                })
              }
            >
              Export Proof
            </button>
          </div>
        )}
      </div>

      {status && <p className="status-msg">{status}</p>}

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

export default VerifierView;
