# BlockID — Decentralized Credential Verification

## Overview
BlockID is a decentralized credential verification platform built for CSE 540 by Team 17. It provides a system where users can register a decentralized identity (DID), trusted organizations can issue credentials, and third parties can verify whether a credential is valid without exposing sensitive personal information.

Instead of storing raw identity data directly on the blockchain, BlockID stores only credential hashes on chain and anchors DID metadata references pointing to off-chain storage. This helps improve privacy and reduces the risks associated with centralized identity storage.

## Team Members
- Camron Vonner
- Alazar Alemu
- Vickram Sullhan

## Problem Motivation
Traditional identity systems often rely on centralized databases that store sensitive personal information such as IDs, biometric data, and other credentials. This creates several issues:
- Higher risk of data breaches
- Repeated sharing of the same sensitive information across platforms
- Dependence on organizations to properly store and protect user data
- Reduced user privacy and control

BlockID explores a decentralized alternative where blockchain is used for secure, tamper-resistant verification, while sensitive identity data remains off chain.

## Use Cases

BlockID supports credential verification across multiple real-world domains:

- **Healthcare:** Verify medical licenses, vaccination records, and provider certifications
- **Education:** Verify diplomas, transcripts, and course completions
- **Employment:** Verify professional certifications, background checks, and work history
- **Government:** Verify driver's licenses, work authorization, and residency status

## Features

### Smart Contract
- User identity registration with DID metadata (document reference, public key, service endpoint)
- Owner-managed trusted issuer list
- Credential issuance by approved organizations
- Immutable verification event logging via `CredentialVerified` event
- Credential revocation by the original issuer only
- DID document updates by the identity owner
- On-chain storage of credential hashes only

### Frontend Application
- **Credential type selection** — issuers choose from real-world credential types (medical license, diploma, driver's license, etc.) with context-specific input fields
- **DID registration form** — users provide a DID document reference, public key, and service endpoint when registering
- **DID metadata panel** — registered users can view and update their on-chain DID metadata
- **Off-chain integrity verification** — credential data is stored in a simulated off-chain store; the hash is recomputed and compared to the on-chain commitment to confirm data integrity
- **Credential search** — look up all credentials for any wallet address on the registry
- **Export proof** — generate a shareable JSON proof object for any credential, enabling off-chain verification
- **Dark/light mode** — theme toggle with localStorage persistence
- **Activity log** — audit trail showing all on-chain actions during a session
- **Registration status** — automatic check showing whether the connected wallet is registered
- **Issuer status check** — admin can verify whether any address is an authorized issuer
- **Demo mode** — fully functional demo with pre-loaded sample data, no wallet required

## System Architecture

### Off-Chain Layer
The off-chain layer is responsible for:
- identity verification
- user data processing
- full credential blob storage (simulated; production would use IPFS or encrypted DB)
- hash recomputation for integrity verification
- generating credential proofs
- handling frontend interactions

### On-Chain Layer
The on-chain layer is responsible for:
- DID metadata anchoring (document reference, public key, service endpoint, registration timestamp)
- storing credential hashes
- managing credential issuance
- verifying credential validity and logging verification events immutably
- revoking credentials when needed

## Main Roles
- **Platform Admin:** The contract owner who authorizes organizations (hospitals, universities, agencies) as trusted issuers
- **Issuer:** A trusted organization that verifies identity off chain and issues credentials
- **User:** An individual who registers their DID and receives credentials in their wallet
- **Verifier:** A third party that checks whether a credential is valid without seeing private data

## Workflow
1. A user registers their identity with optional DID metadata (document reference, public key, service endpoint)
2. The admin authorizes a trusted organization as an issuer
3. The issuer verifies the identity off chain
4. The issuer generates a credential proof and hashes it
5. The credential hash is recorded on chain; the full blob is stored off chain
6. The user stores the credential in their wallet
7. A verifier requests proof from the user
8. The smart contract verifies the credential and emits a `CredentialVerified` event as an immutable audit log entry
9. The verifier can recompute the hash from the off-chain blob to confirm data integrity

## Technologies Used
- Solidity
- Ethereum
- Hardhat
- Remix IDE
- MetaMask
- Polygon Amoy Testnet
- React (Vite)
- Ethers.js v6

## Dependencies
To run or test this project, you will need:
- Solidity compiler version `^0.8.0`
- A Solidity development environment such as Remix IDE
- MetaMask or another Ethereum wallet (optional — Demo Mode and tests work without it)
- Node.js (v18 or higher) and npm
- Access to a blockchain environment such as:
  - Remix JavaScript VM, or
  - Polygon Amoy Testnet

## Smart Contract
The main contract for this project is:

- `contracts/IdentityRegistry.sol`

## Contract Summary
The `IdentityRegistry` contract supports:
- registering users with DID metadata in the identity registry
- managing trusted issuers
- issuing credentials to registered users
- verifying whether a credential is valid and logging the verification event immutably
- revoking issued credentials
- updating DID document references and service endpoints

The contract stores credentials as hashes instead of raw personal data.

## Main Functions

### `registerIdentity(string didDocument, string publicKey, string serviceEndpoint)`
Registers the caller as a user in the identity registry with optional DID metadata. The DID document field should reference an off-chain document (IPFS CID or URL). Public key and service endpoint are optional.

### `updateDID(string didDocument, string serviceEndpoint)`
Allows a registered user to update their DID document reference and service endpoint on-chain.

### `setTrustedIssuer(address issuer, bool authorized)`
Allows the contract owner to add or remove a trusted issuer.

### `issueCredential(address user, bytes32 credentialHash)`
Allows a trusted issuer to issue a credential hash to a registered user. The full credential blob should be stored off-chain before calling this function.

### `verifyCredential(address user, uint index)`
Verifies whether a specific credential is currently valid and emits a `CredentialVerified` event for immutable audit logging.

### `checkCredential(address user, uint index)`
Read-only view function that checks credential validity without emitting an event.

### `revokeCredential(address user, uint index)`
Allows the original trusted issuer to revoke a credential they issued.

### `getCredentialCount(address user)`
Returns the total number of credentials associated with a user.

### `getCredential(address user, uint index)`
Returns the credential hash, issuer address, and validity status for a specific credential.

### `getDIDInfo(address user)`
Returns the DID document reference, public key, service endpoint, and registration timestamp for a registered user.

## Deployment Instructions

### Option 1: Deploy with Remix IDE
1. Open Remix IDE in your browser at `remix.ethereum.org`
2. Create a new file called `IdentityRegistry.sol`
3. Paste the smart contract code into the file
4. Open the **Solidity Compiler** tab
5. Select compiler version `0.8.x`
6. Compile the contract
7. Open the **Deploy & Run Transactions** tab
8. Choose an environment:
   - **Remix VM (Cancun)** for simple local browser testing
   - **Injected Provider - MetaMask** for deploying with MetaMask
9. Click **Deploy**
10. After deployment, the address that deployed the contract becomes the contract owner
11. Copy the contract address from the bottom of the Deploy tab

## Basic Usage

After deployment, the contract can be used in this order:

### 1. Add a trusted issuer
The contract owner calls:

```solidity
setTrustedIssuer(issuerAddress, true)
```

### 2. Register a user
The user calls:

```solidity
registerIdentity(didDocument, publicKey, serviceEndpoint)
```

### 3. Issue a credential
A trusted issuer calls:

```solidity
issueCredential(userAddress, credentialHash)
```

### 4. Verify a credential
Anyone can call (emits `CredentialVerified` audit event):

```solidity
verifyCredential(userAddress, index)
```

### 5. Revoke a credential
The original issuer calls:

```solidity
revokeCredential(userAddress, index)
```

### 6. View credential information
To get the total number of credentials for a user:

```solidity
getCredentialCount(userAddress)
```

To get the details of a specific credential:

```solidity
getCredential(userAddress, index)
```

## Running the Tests

Tests use Hardhat and run entirely locally — no wallet or testnet required.

### Setup

1. From the project root, install dependencies:
```bash
npm install
```

2. Run the test suite:
```bash
npx hardhat test
```

Expected output: **42 tests passing**

Test coverage includes deployment, issuer management, identity registration with DID metadata, credential issuance, verification event emission, revocation, and edge cases such as invalid indexes, zero hashes, and unregistered users.

## Running the Frontend

### Prerequisites
- Node.js v18 or higher
- npm
- MetaMask browser extension (optional — Demo Mode works without it)

### Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open the app in your browser (default is `http://localhost:5173`)

### Demo Mode (No Wallet Required)

Click **Try Demo** on the connect screen. The app loads with pre-populated sample data including registered identities, issued credentials, and an activity log. All features are accessible without a wallet or deployed contract.

### Connecting to a Deployed Contract

1. Deploy `IdentityRegistry.sol` using Remix IDE (see Deployment Instructions above)
2. Copy the deployed contract address from Remix
3. Open the BlockID frontend in your browser
4. Click **Connect Wallet** to connect MetaMask
5. Paste the contract address into the **Contract Address** field
6. Use the Dashboard, Verify, and Admin tabs to interact with the contract

### Frontend Structure

- `frontend/src/App.jsx` — main layout with navigation, activity log, and theme toggle
- `frontend/src/hooks/useContract.js` — hook that connects ethers.js to the deployed contract
- `frontend/src/components/ConnectWallet.jsx` — full-page connect and demo mode screen
- `frontend/src/components/Dashboard.jsx` — identity card, DID metadata panel, credentials, activity log
- `frontend/src/components/AdminView.jsx` — issuer management and credential issuance
- `frontend/src/components/VerifierView.jsx` — credential lookup and quick verify with integrity check
- `frontend/src/components/ExportProof.jsx` — generate shareable JSON credential proofs
- `frontend/src/abi.json` — contract ABI

## Privacy Approach
A key goal of BlockID is privacy preservation. Sensitive personal information is not stored on chain. The workflow is:

1. Credential data is entered in the frontend
2. A keccak256 hash is computed locally
3. The full credential blob is stored in the off-chain store (simulated; production would use IPFS or an encrypted database)
4. Only the hash is written to the blockchain as a tamper-proof commitment
5. Verifiers can recompute the hash from the off-chain blob and compare it to the on-chain record to confirm integrity

The Export Proof feature demonstrates how a credential holder can share verifiable proof with a third party without revealing the underlying data.

## Current Scope
This project is designed as a minimum viable product for the course. The current implementation focuses on:
- DID registration with on-chain metadata anchoring
- credential issuance with real-world credential types
- credential hash storage on chain with off-chain blob integrity verification
- immutable verification event logging via `CredentialVerified`
- credential revocation with original-issuer-only enforcement
- credential search across the registry
- exportable credential proofs
- full Hardhat test suite with 42 passing tests

More advanced features such as zero-knowledge proofs, large-scale identity systems, real IPFS integration, and full production-ready wallet integration are outside the current scope unless time permits.

## Future Improvements
Possible future enhancements include:
- credential expiration dates
- real IPFS integration for decentralized off-chain storage
- support for zero-knowledge proofs for selective disclosure
- event history from on-chain logs
- batch credential operations
- stronger metadata privacy to reduce issuer-user relationship leakage
- more advanced credential management

## License
This project is licensed under the MIT License.
