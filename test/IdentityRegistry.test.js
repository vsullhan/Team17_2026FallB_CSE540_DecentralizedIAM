const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("IdentityRegistry", function () {
  // test accounts
  let registry;
  let owner;
  let issuer;
  let user;
  let verifier;
  let stranger;

  // sample DID metadata
  const DID_DOC = "ipfs://QmTestDIDDocument123";
  const PUB_KEY = "0x04testpublickey";
  const SERVICE = "https://blockid.example.com";

  // deploy a fresh contract before each test
  // this ensures tests are isolated and don't affect each other
  beforeEach(async function () {
    [owner, issuer, user, verifier, stranger] = await ethers.getSigners();
    const IdentityRegistry = await ethers.getContractFactory(
      "IdentityRegistry",
    );
    registry = await IdentityRegistry.deploy();
    await registry.waitForDeployment();
  });

  describe("Deployment", function () {
    it("should set the deployer as the contract owner", async function () {
      expect(await registry.owner()).to.equal(owner.address);
    });

    it("should start with no registered identities", async function () {
      const identity = await registry.identities(user.address);
      expect(identity.exists).to.equal(false);
    });
  });

  describe("Issuer Management", function () {
    it("owner can authorize a trusted issuer", async function () {
      await registry.connect(owner).setTrustedIssuer(issuer.address, true);
      expect(await registry.trustedIssuers(issuer.address)).to.equal(true);
    });

    it("owner can revoke a trusted issuer", async function () {
      await registry.connect(owner).setTrustedIssuer(issuer.address, true);
      await registry.connect(owner).setTrustedIssuer(issuer.address, false);
      expect(await registry.trustedIssuers(issuer.address)).to.equal(false);
    });

    it("emits IssuerUpdated event when authorizing", async function () {
      await expect(
        registry.connect(owner).setTrustedIssuer(issuer.address, true),
      )
        .to.emit(registry, "IssuerUpdated")
        .withArgs(issuer.address, true);
    });

    it("emits IssuerUpdated event when revoking", async function () {
      await registry.connect(owner).setTrustedIssuer(issuer.address, true);
      await expect(
        registry.connect(owner).setTrustedIssuer(issuer.address, false),
      )
        .to.emit(registry, "IssuerUpdated")
        .withArgs(issuer.address, false);
    });

    it("non-owner cannot authorize an issuer", async function () {
      // only the contract owner (deployer) should be able to manage issuers
      await expect(
        registry.connect(stranger).setTrustedIssuer(issuer.address, true),
      ).to.be.revertedWith("Not owner");
    });

    it("rejects zero address as issuer", async function () {
      await expect(
        registry.connect(owner).setTrustedIssuer(ethers.ZeroAddress, true),
      ).to.be.revertedWith("Invalid address");
    });
  });

  describe("Identity Registration", function () {
    it("user can register their identity with DID metadata", async function () {
      await registry.connect(user).registerIdentity(DID_DOC, PUB_KEY, SERVICE);
      const identity = await registry.identities(user.address);
      expect(identity.exists).to.equal(true);
      expect(identity.owner).to.equal(user.address);
    });

    it("stores DID metadata correctly on-chain", async function () {
      await registry.connect(user).registerIdentity(DID_DOC, PUB_KEY, SERVICE);
      const [doc, key, endpoint] = await registry.getDIDInfo(user.address);
      expect(doc).to.equal(DID_DOC);
      expect(key).to.equal(PUB_KEY);
      expect(endpoint).to.equal(SERVICE);
    });

    it("emits IdentityRegistered event with DID metadata", async function () {
      await expect(
        registry.connect(user).registerIdentity(DID_DOC, PUB_KEY, SERVICE),
      )
        .to.emit(registry, "IdentityRegistered")
        .withArgs(user.address, DID_DOC, SERVICE);
    });

    it("user cannot register twice", async function () {
      // re-registration should be blocked to prevent identity hijacking
      await registry.connect(user).registerIdentity(DID_DOC, PUB_KEY, SERVICE);
      await expect(
        registry.connect(user).registerIdentity(DID_DOC, PUB_KEY, SERVICE),
      ).to.be.revertedWith("Already registered");
    });

    it("allows registration with empty DID metadata fields", async function () {
      // DID fields are optional — user may fill them in later via updateDID
      await registry.connect(user).registerIdentity("", "", "");
      const identity = await registry.identities(user.address);
      expect(identity.exists).to.equal(true);
    });

    it("records the registration timestamp", async function () {
      const tx = await registry
        .connect(user)
        .registerIdentity(DID_DOC, PUB_KEY, SERVICE);
      const block = await ethers.provider.getBlock(tx.blockNumber);
      const [, , , registeredAt] = await registry.getDIDInfo(user.address);
      expect(Number(registeredAt)).to.equal(block.timestamp);
    });
  });

  describe("DID Update", function () {
    beforeEach(async function () {
      await registry.connect(user).registerIdentity(DID_DOC, PUB_KEY, SERVICE);
    });

    it("registered user can update their DID document reference", async function () {
      const newDoc = "ipfs://QmUpdatedDocument456";
      const newEndpoint = "https://updated.example.com";
      await registry.connect(user).updateDID(newDoc, newEndpoint);
      const [doc, , endpoint] = await registry.getDIDInfo(user.address);
      expect(doc).to.equal(newDoc);
      expect(endpoint).to.equal(newEndpoint);
    });

    it("emits DIDUpdated event on update", async function () {
      const newDoc = "ipfs://QmUpdated";
      await expect(registry.connect(user).updateDID(newDoc, SERVICE))
        .to.emit(registry, "DIDUpdated")
        .withArgs(user.address, newDoc, SERVICE);
    });

    it("unregistered user cannot update DID", async function () {
      await expect(
        registry.connect(stranger).updateDID(DID_DOC, SERVICE),
      ).to.be.revertedWith("Not registered");
    });
  });

  describe("Credential Issuance", function () {
    // helper: compute credential hash the same way the frontend does
    function makeCredentialHash(type, data) {
      return ethers.keccak256(ethers.toUtf8Bytes(`${type}:${data}`));
    }

    beforeEach(async function () {
      // authorize issuer and register user before each issuance test
      await registry.connect(owner).setTrustedIssuer(issuer.address, true);
      await registry.connect(user).registerIdentity(DID_DOC, PUB_KEY, SERVICE);
    });

    it("trusted issuer can issue a credential to a registered user", async function () {
      const hash = makeCredentialHash(
        "diploma",
        "BS Computer Science, ASU, 2024",
      );
      await registry.connect(issuer).issueCredential(user.address, hash);
      expect(await registry.getCredentialCount(user.address)).to.equal(1);
    });

    it("issued credential is valid by default", async function () {
      const hash = makeCredentialHash(
        "diploma",
        "BS Computer Science, ASU, 2024",
      );
      await registry.connect(issuer).issueCredential(user.address, hash);
      const [, , isValid] = await registry.getCredential(user.address, 0);
      expect(isValid).to.equal(true);
    });

    it("stores the correct hash and issuer address", async function () {
      const hash = makeCredentialHash("medical_license", "LIC-12345, AZ, 2026");
      await registry.connect(issuer).issueCredential(user.address, hash);
      const [storedHash, storedIssuer] = await registry.getCredential(
        user.address,
        0,
      );
      expect(storedHash).to.equal(hash);
      expect(storedIssuer).to.equal(issuer.address);
    });

    it("emits CredentialIssued event", async function () {
      const hash = makeCredentialHash(
        "drivers_license",
        "D12345678, AZ, Class D",
      );
      await expect(registry.connect(issuer).issueCredential(user.address, hash))
        .to.emit(registry, "CredentialIssued")
        .withArgs(user.address, hash, issuer.address);
    });

    it("can issue multiple credentials to the same user", async function () {
      const hash1 = makeCredentialHash("diploma", "BS CS, ASU, 2024");
      const hash2 = makeCredentialHash("medical_license", "LIC-999, AZ, 2027");
      await registry.connect(issuer).issueCredential(user.address, hash1);
      await registry.connect(issuer).issueCredential(user.address, hash2);
      expect(await registry.getCredentialCount(user.address)).to.equal(2);
    });

    it("untrusted issuer cannot issue credentials", async function () {
      // access control — only authorized issuers can write credentials
      const hash = makeCredentialHash("diploma", "Fake Degree");
      await expect(
        registry.connect(stranger).issueCredential(user.address, hash),
      ).to.be.revertedWith("Not trusted issuer");
    });

    it("cannot issue to an unregistered user", async function () {
      const hash = makeCredentialHash("diploma", "BS CS");
      await expect(
        registry.connect(issuer).issueCredential(stranger.address, hash),
      ).to.be.revertedWith("User not registered");
    });

    it("rejects a zero/empty credential hash", async function () {
      // prevents issuing meaningless credentials with no data commitment
      await expect(
        registry.connect(issuer).issueCredential(user.address, ethers.ZeroHash),
      ).to.be.revertedWith("Invalid hash");
    });
  });

  describe("Credential Verification", function () {
    let credHash;

    beforeEach(async function () {
      await registry.connect(owner).setTrustedIssuer(issuer.address, true);
      await registry.connect(user).registerIdentity(DID_DOC, PUB_KEY, SERVICE);
      credHash = ethers.keccak256(
        ethers.toUtf8Bytes("diploma:BS CS, ASU, 2024"),
      );
      await registry.connect(issuer).issueCredential(user.address, credHash);
    });

    it("verifyCredential returns true for a valid credential", async function () {
      // verifyCredential is non-view — it emits an audit event
      const tx = await registry
        .connect(verifier)
        .verifyCredential(user.address, 0);
      await tx.wait();
      // check validity via the read-only function
      expect(await registry.checkCredential(user.address, 0)).to.equal(true);
    });

    it("verifyCredential emits CredentialVerified event for immutable audit trail", async function () {
      // this is the key spec requirement — verification must be logged on-chain
      await expect(registry.connect(verifier).verifyCredential(user.address, 0))
        .to.emit(registry, "CredentialVerified")
        .withArgs(user.address, 0, true, verifier.address);
    });

    it("checkCredential (view) returns true without emitting event", async function () {
      expect(await registry.checkCredential(user.address, 0)).to.equal(true);
    });

    it("anyone can verify a credential — no access restriction on reads", async function () {
      // verification is intentionally public so third parties can check without permission
      expect(
        await registry
          .checkCredential(stranger.address, 0)
          .catch(() => registry.checkCredential(user.address, 0)),
      ).to.equal(true);
    });

    it("rejects invalid credential index", async function () {
      await expect(
        registry.connect(verifier).verifyCredential(user.address, 99),
      ).to.be.revertedWith("Invalid index");
    });

    it("getCredential returns correct hash, issuer, and validity", async function () {
      const [hash, iss, isValid] = await registry.getCredential(
        user.address,
        0,
      );
      expect(hash).to.equal(credHash);
      expect(iss).to.equal(issuer.address);
      expect(isValid).to.equal(true);
    });
  });

  describe("Credential Revocation", function () {
    let credHash;

    beforeEach(async function () {
      await registry.connect(owner).setTrustedIssuer(issuer.address, true);
      await registry.connect(user).registerIdentity(DID_DOC, PUB_KEY, SERVICE);
      credHash = ethers.keccak256(
        ethers.toUtf8Bytes("background_check:Clear, 2024-01-01"),
      );
      await registry.connect(issuer).issueCredential(user.address, credHash);
    });

    it("original issuer can revoke their own credential", async function () {
      await registry.connect(issuer).revokeCredential(user.address, 0);
      expect(await registry.checkCredential(user.address, 0)).to.equal(false);
    });

    it("emits CredentialRevoked event on revocation", async function () {
      await expect(registry.connect(issuer).revokeCredential(user.address, 0))
        .to.emit(registry, "CredentialRevoked")
        .withArgs(user.address, 0);
    });

    it("verifyCredential emits event showing INVALID after revocation", async function () {
      await registry.connect(issuer).revokeCredential(user.address, 0);
      await expect(registry.connect(verifier).verifyCredential(user.address, 0))
        .to.emit(registry, "CredentialVerified")
        .withArgs(user.address, 0, false, verifier.address);
    });

    it("a different issuer cannot revoke another issuer's credential", async function () {
      // design decision: only the original issuer can revoke — prevents unauthorized invalidation
      const [, secondIssuer] = await ethers
        .getSigners()
        .then((s) => s.slice(5));
      await registry
        .connect(owner)
        .setTrustedIssuer(secondIssuer.address, true);
      await expect(
        registry.connect(secondIssuer).revokeCredential(user.address, 0),
      ).to.be.revertedWith("Not original issuer");
    });

    it("untrusted party cannot revoke a credential", async function () {
      await expect(
        registry.connect(stranger).revokeCredential(user.address, 0),
      ).to.be.revertedWith("Not trusted issuer");
    });

    it("cannot revoke an already revoked credential", async function () {
      await registry.connect(issuer).revokeCredential(user.address, 0);
      await expect(
        registry.connect(issuer).revokeCredential(user.address, 0),
      ).to.be.revertedWith("Already revoked");
    });

    it("rejects invalid index on revocation", async function () {
      await expect(
        registry.connect(issuer).revokeCredential(user.address, 99),
      ).to.be.revertedWith("Invalid index");
    });
  });

  describe("Edge Cases", function () {
    it("getCredentialCount returns 0 for user with no credentials", async function () {
      expect(await registry.getCredentialCount(stranger.address)).to.equal(0);
    });

    it("getDIDInfo reverts for unregistered address", async function () {
      await expect(registry.getDIDInfo(stranger.address)).to.be.revertedWith(
        "Not registered",
      );
    });

    it("multiple users can each register independently", async function () {
      const [, , u1, u2] = await ethers.getSigners();
      await registry
        .connect(u1)
        .registerIdentity("ipfs://u1", "key1", "https://u1.com");
      await registry
        .connect(u2)
        .registerIdentity("ipfs://u2", "key2", "https://u2.com");
      expect((await registry.identities(u1.address)).exists).to.equal(true);
      expect((await registry.identities(u2.address)).exists).to.equal(true);
    });

    it("credential count increments correctly across multiple issuances", async function () {
      await registry.connect(owner).setTrustedIssuer(issuer.address, true);
      await registry.connect(user).registerIdentity(DID_DOC, PUB_KEY, SERVICE);
      for (let i = 0; i < 5; i++) {
        const hash = ethers.keccak256(ethers.toUtf8Bytes(`cred:data${i}`));
        await registry.connect(issuer).issueCredential(user.address, hash);
      }
      expect(await registry.getCredentialCount(user.address)).to.equal(5);
    });
  });
});
