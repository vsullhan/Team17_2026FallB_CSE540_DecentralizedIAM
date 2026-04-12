// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/*
    IdentityRegistry (Draft)
    Team 17 – CSE 540
    This contract is for a simple decentralized identity system.
    Users can register themselves, issuers can give credentials,
    and anyone can check if a credential is valid.
    We only store hashes on-chain to avoid putting sensitive data on blockchain.
*/
contract IdentityRegistry {
    // basic identity info
    struct Identity {
        address owner;
        bool exists;
    }
    // cred stored as a hash
    struct Credential {
        bytes32 credentialHash;
        address issuer;
        bool isValid;
    }
    // identity storage
    mapping(address => Identity) public identities;
    // creds per user
    mapping(address => Credential[]) public credentials;
    // approved issuers
    mapping(address => bool) public trustedIssuers;
    // contract owner addr
    address public owner;
    // events
    event IdentityRegistered(address indexed user);
    event CredentialIssued(address indexed user, bytes32 credentialHash, address indexed issuer);
    event CredentialRevoked(address indexed user, uint index);
    event IssuerUpdated(address indexed issuer, bool authorized);
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
    // add or remove issuer
    function setTrustedIssuer(address issuer, bool authorized) public onlyOwner {
        require(issuer != address(0), "Invalid address");
        trustedIssuers[issuer] = authorized;
        emit IssuerUpdated(issuer, authorized);
    }
    // register identity for calling addr
    function registerIdentity() public {
        require(!identities[msg.sender].exists, "Already registered");
        identities[msg.sender] = Identity({
            owner: msg.sender,
            exists: true
        });
        emit IdentityRegistered(msg.sender);
    }
    // issuer gives a cred to a registered user
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
    // check if cred is still valid
    function verifyCredential(address user, uint index) public view returns (bool) {
        require(index < credentials[user].length, "Invalid index");
        return credentials[user][index].isValid;
    }
    // issuer can revoke own cred only
    function revokeCredential(address user, uint index) public onlyTrustedIssuer {
        require(index < credentials[user].length, "Invalid index");
        require(credentials[user][index].issuer == msg.sender, "Not original issuer");
        require(credentials[user][index].isValid, "Already revoked");
        credentials[user][index].isValid = false;
        emit CredentialRevoked(user, index);
    }
    // how many creds a user has
    function getCredentialCount(address user) public view returns (uint) {
        return credentials[user].length;
    }
    // get cred details by index
    function getCredential(address user, uint index)
        public
        view
        returns (bytes32, address, bool)
    {
        require(index < credentials[user].length, "Invalid index");
        Credential storage cred = credentials[user][index];
        return (cred.credentialHash, cred.issuer, cred.isValid);
    }
}
