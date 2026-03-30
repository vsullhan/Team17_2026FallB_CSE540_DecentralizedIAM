# Decentralized Identity and Access Management (IAM) dApp

## Overview
This project is a simple decentralized identity and access management dApp built for CSE 540 by Team 17. The purpose of the project is to create a basic identity verification system where users can register an identity, trusted issuers can issue credentials, and third parties can verify whether a credential is valid without exposing sensitive personal information.

Instead of storing raw identity data directly on the blockchain, the system stores only credential hashes on chain. This helps improve privacy and reduces the risks associated with centralized identity storage.

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

This project explores a decentralized alternative where blockchain is used for secure, tamper-resistant verification, while sensitive identity data remains off chain.

## Project Features
- User identity registration
- Owner-managed trusted issuer list
- Credential issuance by approved issuers
- Credential verification
- Credential revocation by the original issuer
- On-chain storage of credential hashes only

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
- **Issuer:** A trusted entity that verifies user identity off chain and issues credentials
- **User:** An individual who receives credentials and stores them in a digital wallet
- **Verifier:** A third party that checks whether a credential is valid

## Workflow
1. A user submits identity information to a trusted issuer
2. The issuer verifies the identity off chain
3. The issuer generates a credential proof
4. The credential proof is hashed and recorded on chain
5. The user stores the credential in a wallet
6. A verifier requests proof from the user
7. The smart contract checks whether the credential is valid

## Technologies Used
- Solidity
- Ethereum
- Remix IDE
- MetaMask
- Polygon Amoy Testnet
- React
- Web3.js or Ethers.js

## Dependencies
To run or test this project, you will need:
- Solidity compiler version `^0.8.0`
- A Solidity development environment such as Remix IDE
- MetaMask or another Ethereum wallet
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

## Privacy Approach
A key goal of this project is privacy preservation. Sensitive personal information is not stored on chain. Only hashed credential data is recorded on the blockchain, which allows verification without directly exposing raw identity data.

## Current Scope
This project is designed as a minimum viable product for the course. The current implementation focuses on:
- credential issuance
- credential hash storage on chain
- credential verification
- credential revocation

More advanced features such as zero-knowledge proofs, large-scale identity systems, and full production-ready wallet integration are outside the current scope unless time permits.

## Future Improvements
Possible future enhancements include:
- credential expiration dates
- stronger access control
- integration with off-chain identity systems
- support for zero-knowledge proofs
- improved frontend experience
- more advanced credential management

## License
This project is licensed under the MIT License.
