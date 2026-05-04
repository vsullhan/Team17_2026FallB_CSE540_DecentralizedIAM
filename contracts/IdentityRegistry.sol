// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/*
    IdentityRegistry
    Team 17 – CSE 540
    Decentralized identity system with DID metadata support.
    Users can register a DID with metadata, issuers can issue credentials,
    and anyone can verify credentials. Verification events are emitted
    immutably for auditability. Only hashes stored on-chain.
*/
contract IdentityRegistry {

    // DID identity with metadata anchored on-chain
    struct Identity {
        address owner;
        bool exists;
        string didDocument;   // off-chain DID document reference (IPFS CID or URL)
        string publicKey;     // DID verification key (base58 or hex encoded)
        string serviceEndpoint; // service endpoint for the DID subject
        uint256 registeredAt; // block timestamp of registration
    }

    // credential stored as a hash with issuer and validity
    struct Credential {
        bytes32 credentialHash;
        address issuer;
        bool isValid;
    }

    // identity storage
    mapping(address => Identity) public identities;
    // credentials per user
    mapping(address => Credential[]) public credentials;
    // approved issuers
    mapping(address => bool) public trustedIssuers;
    // contract owner address
    address public owner;

    // --- Events ---
    event IdentityRegistered(address indexed user, string didDocument, string serviceEndpoint);
    event CredentialIssued(address indexed user, bytes32 credentialHash, address indexed issuer);
    event CredentialRevoked(address indexed user, uint index);
    event CredentialVerified(address indexed user, uint index, bool isValid, address indexed verifier);
    event IssuerUpdated(address indexed issuer, bool authorized);
    event DIDUpdated(address indexed user, string didDocument, string serviceEndpoint);

    // set deployer as owner
    constructor() {
        owner = msg.sender;
    }

    // only owner can call
    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    // only approved issuers
    modifier onlyTrustedIssuer() {
        require(trustedIssuers[msg.sender], "Not trusted issuer");
        _;
    }

    // add or remove a trusted issuer
    function setTrustedIssuer(address issuer, bool authorized) public onlyOwner {
        require(issuer != address(0), "Invalid address");
        trustedIssuers[issuer] = authorized;
        emit IssuerUpdated(issuer, authorized);
    }

    // register identity with optional DID metadata
    // didDocument: IPFS CID or URL pointing to the full DID document stored off-chain
    // publicKey: the DID verification key for this identity
    // serviceEndpoint: a service URL associated with this DID (e.g. messaging, storage)
    function registerIdentity(
        string calldata didDocument,
        string calldata publicKey,
        string calldata serviceEndpoint
    ) public {
        require(!identities[msg.sender].exists, "Already registered");
        identities[msg.sender] = Identity({
            owner: msg.sender,
            exists: true,
            didDocument: didDocument,
            publicKey: publicKey,
            serviceEndpoint: serviceEndpoint,
            registeredAt: block.timestamp
        });
        emit IdentityRegistered(msg.sender, didDocument, serviceEndpoint);
    }

    // update DID document reference and service endpoint (owner only)
    function updateDID(
        string calldata didDocument,
        string calldata serviceEndpoint
    ) public {
        require(identities[msg.sender].exists, "Not registered");
        identities[msg.sender].didDocument = didDocument;
        identities[msg.sender].serviceEndpoint = serviceEndpoint;
        emit DIDUpdated(msg.sender, didDocument, serviceEndpoint);
    }

    // issuer issues a credential hash to a registered user
    function issueCredential(address user, bytes32 credentialHash) public onlyTrustedIssuer {
        require(identities[user].exists, "User not registered");
        require(credentialHash != bytes32(0), "Invalid hash");
        credentials[user].push(Credential({
            credentialHash: credentialHash,
            issuer: msg.sender,
            isValid: true
        }));
        emit CredentialIssued(user, credentialHash, msg.sender);
    }

    // verify a credential — emits an immutable audit event
    function verifyCredential(address user, uint index) public returns (bool) {
        require(index < credentials[user].length, "Invalid index");
        bool valid = credentials[user][index].isValid;
        emit CredentialVerified(user, index, valid, msg.sender);
        return valid;
    }

    // read-only credential check (no event, for internal/view use)
    function checkCredential(address user, uint index) public view returns (bool) {
        require(index < credentials[user].length, "Invalid index");
        return credentials[user][index].isValid;
    }

    // issuer can revoke their own credential only
    function revokeCredential(address user, uint index) public onlyTrustedIssuer {
        require(index < credentials[user].length, "Invalid index");
        require(credentials[user][index].issuer == msg.sender, "Not original issuer");
        require(credentials[user][index].isValid, "Already revoked");
        credentials[user][index].isValid = false;
        emit CredentialRevoked(user, index);
    }

    // how many credentials a user has
    function getCredentialCount(address user) public view returns (uint) {
        return credentials[user].length;
    }

    // get credential details by index
    function getCredential(address user, uint index)
        public
        view
        returns (bytes32, address, bool)
    {
        require(index < credentials[user].length, "Invalid index");
        Credential storage cred = credentials[user][index];
        return (cred.credentialHash, cred.issuer, cred.isValid);
    }

    // get DID metadata for a registered user
    function getDIDInfo(address user)
        public
        view
        returns (string memory, string memory, string memory, uint256)
    {
        require(identities[user].exists, "Not registered");
        Identity storage id = identities[user];
        return (id.didDocument, id.publicKey, id.serviceEndpoint, id.registeredAt);
    }
}

