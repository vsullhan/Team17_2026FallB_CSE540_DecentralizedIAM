# BlockID — Decentralized Credential Verification

## Overview
BlockID is a decentralized credential verification platform built for CSE 540 by Team 17. It provides a system where users can register an identity, trusted organizations can issue credentials, and third parties can verify whether a credential is valid without exposing sensitive personal information.

Instead of storing raw identity data directly on the blockchain, BlockID stores only credential hashes on chain. This helps improve privacy and reduces the risks associated with centralized identity storage.

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
- User identity registration
- Owner-managed trusted issuer list
- Credential issuance by approved organizations
- Credential verification
- Credential revocation by the original issuer
- On-chain storage of credential hashes only

### Frontend Application
- **Credential type selection** — issuers choose from real-world credential types (medical license, diploma, driver's license, etc.) with context-specific input fields
- **Credential search** — look up all credentials for any wallet address on the registry
- **Export proof** — generate a shareable JSON proof object for any credential, enabling off-chain verification
- **Dark/light mode** — theme toggle with localStorage persistence
- **Activity log** — audit trail showing all on-chain actions during a session
- **Registration status** — automatic check showing whether the connected wallet is registered
- **Issuer status check** — admin can verify whether any address is an authorized issuer

## System Architecture

### Off-Chain Layer
The off-chain layer is responsible for:
- identity verification
- user data processing
- generating credential proofs
- handling frontend interactions

### On-Chain Layer
The on-chain layer is responsible for:
- storing credential hashes
- managing credential issuance
- verifying credential validity
- revoking credentials when needed

## Main Roles
- **Platform Admin:** The contract owner who authorizes organizations (hospitals, universities, agencies) as trusted issuers
- **Issuer:** A trusted organization that verifies identity off chain and issues credentials
- **User:** An individual who registers their identity and receives credentials in their wallet
- **Verifier:** A third party that checks whether a credential is valid without seeing private data

## Workflow
1. A user submits identity information to a trusted issuer
2. The issuer verifies the identity off chain
3. The issuer generates a credential proof
4. The credential proof is hashed and recorded on chain
5. The user stores the credential in their wallet
6. A verifier requests proof from the user
7. The smart contract checks whether the credential is valid

## Technologies Used
- Solidity
- Ethereum
- Remix IDE
- MetaMask
- Polygon Amoy Testnet
- React (Vite)
- Ethers.js v6

## Dependencies
To run or test this project, you will need:
- Solidity compiler version `^0.8.0`
- A Solidity development environment such as Remix IDE
- MetaMask or another Ethereum wallet
- Node.js (v18 or higher) and npm
- Access to a blockchain environment such as:
  - Remix JavaScript VM, or
  - Polygon Amoy Testnet

## Smart Contract
The main contract for this project is:

- `IdentityRegistry.sol`

## Contract Summary
The `IdentityRegistry` contract supports:
- registering users in the identity registry
- managing trusted issuers
- issuing credentials to registered users
- verifying whether a credential is valid
- revoking issued credentials

The contract stores credentials as hashes instead of raw personal data.

## Main Functions

### `registerIdentity()`
Registers the caller as a user in the identity registry.

### `setTrustedIssuer(address issuer, bool authorized)`
Allows the contract owner to add or remove a trusted issuer.

### `issueCredential(address user, bytes32 credentialHash)`
Allows a trusted issuer to issue a credential hash to a registered user.

### `verifyCredential(address user, uint index)`
Checks whether a specific credential is currently valid.

### `revokeCredential(address user, uint index)`
Allows the original trusted issuer to revoke a credential they issued.

### `getCredentialCount(address user)`
Returns the total number of credentials associated with a user.

### `getCredential(address user, uint index)`
Returns the credential hash, issuer address, and validity status for a specific credential.

## Deployment Instructions

### Option 1: Deploy with Remix IDE
1. Open Remix IDE in your browser
2. Create a new file called `IdentityRegistry.sol`
3. Paste the smart contract code into the file
4. Open the **Solidity Compiler** tab
5. Select compiler version `0.8.x`
6. Compile the contract
7. Open the **Deploy & Run Transactions** tab
8. Choose an environment:
   - **Remix VM** for simple local browser testing
   - **Injected Provider - MetaMask** for deploying with MetaMask
9. Click **Deploy**
10. After deployment, the address that deployed the contract becomes the contract owner

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
registerIdentity()
```

### 3. Issue a credential
A trusted issuer calls:

```solidity
issueCredential(userAddress, credentialHash)
```

### 4. Verify a credential
Anyone can call:

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

## Running the Frontend

### Prerequisites
- Node.js v18 or higher
- npm
- MetaMask browser extension

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

### Connecting to a Deployed Contract

1. Deploy `IdentityRegistry.sol` using Remix IDE (see Deployment Instructions above)
2. Copy the deployed contract address from Remix
3. Open the BlockID frontend in your browser
4. Click **Connect Wallet** to connect MetaMask
5. Paste the contract address into the **Contract Address** field
6. Use the role tabs (Admin, Wallet, Issuer, Verifier, Search) to interact with the contract

### Frontend Structure

- `frontend/src/App.jsx` — main layout with role tabs, activity log, and theme toggle
- `frontend/src/hooks/useContract.js` — hook that connects ethers.js to the deployed contract
- `frontend/src/components/ConnectWallet.jsx` — wallet connect button
- `frontend/src/components/OwnerPanel.jsx` — authorize/revoke trusted issuers and check issuer status
- `frontend/src/components/UserPanel.jsx` — register identity, view credentials, export proofs
- `frontend/src/components/IssuerPanel.jsx` — issue and revoke credentials with type selection
- `frontend/src/components/VerifierPanel.jsx` — verify credentials with full detail view
- `frontend/src/components/CredentialSearch.jsx` — search all credentials for any address
- `frontend/src/components/ExportProof.jsx` — generate shareable JSON credential proofs
- `frontend/src/abi.json` — contract ABI

## Privacy Approach
A key goal of BlockID is privacy preservation. Sensitive personal information is not stored on chain. Only hashed credential data is recorded on the blockchain, which allows verification without directly exposing raw identity data. The Export Proof feature demonstrates how a credential holder can share verifiable proof with a third party without revealing the underlying data.

## Current Scope
This project is designed as a minimum viable product for the course. The current implementation focuses on:
- credential issuance with real-world credential types
- credential hash storage on chain
- credential verification with full detail view
- credential revocation
- credential search across the registry
- exportable credential proofs

More advanced features such as zero-knowledge proofs, large-scale identity systems, and full production-ready wallet integration are outside the current scope unless time permits.

## Future Improvements
Possible future enhancements include:
- credential expiration dates
- stronger access control
- integration with off-chain identity systems
- support for zero-knowledge proofs
- event history from on-chain logs
- batch credential operations
- more advanced credential management

## License
This project is licensed under the MIT License.
