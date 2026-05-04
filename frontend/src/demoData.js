// mock data for demo mode
// lets the app run without metamask or deploying a contract

export const DEMO_ACCOUNT = '0x742d35Cc6634C0532925a3b844Bc9e7595f2bD28'
export const DEMO_CONTRACT = '0x1234567890abcdef1234567890abcdef12345678'

// fake issuer addrs mapped to org names
export const DEMO_ISSUERS = {
  '0xA1B2C3D4E5F60718293a4b5c6d7e8f9001234567': 'Mayo Clinic',
  '0xB2C3D4E5F607182930a4b5c6d7e8f90012345678': 'Arizona State University',
  '0xC3D4E5F6071829304a5b6c7d8e9f0a0112345678': 'AZ Dept of Transportation',
  '0xD4E5F60718293040a5b6c7d8e9f0a01223456789': 'Acme Corp HR',
}

// mock creds tied to demo account
export const DEMO_CREDENTIALS = [
  {
    index: 0,
    hash: '0x7a1f3e8b2c4d5a6f9e0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f',
    issuer: '0xA1B2C3D4E5F60718293a4b5c6d7e8f9001234567',
    isValid: true,
    _type: 'Medical License',
  },
  {
    index: 1,
    hash: '0x3b5e7d9f1a2c4e6b8d0f2a4c6e8b0d2f4a6c8e0b2d4f6a8c0e2b4d6f8a0c2e4b',
    issuer: '0xB2C3D4E5F607182930a4b5c6d7e8f90012345678',
    isValid: true,
    _type: 'Diploma / Degree',
  },
  {
    index: 2,
    hash: '0x9c0e2b4d6f8a1c3e5b7d9f0a2c4e6b8d1f3a5c7e9b0d2f4a6c8e1b3d5f7a9c0e',
    issuer: '0xC3D4E5F6071829304a5b6c7d8e9f0a0112345678',
    isValid: true,
    _type: "Driver's License",
  },
  {
    index: 3,
    hash: '0x5f7a9c0e2b4d6f8a1c3e5b7d9f0a2c4e6b8d1f3a5c7e9b0d2f4a6c8e1b3d5f7a',
    issuer: '0xD4E5F60718293040a5b6c7d8e9f0a01223456789',
    isValid: false,
    _type: 'Background Check',
  },
]

// pre-built activity log so the dashboard isnt empty on first load
export const DEMO_ACTIVITY_LOG = [
  { timestamp: '2:34:12 PM', action: 'Credential Issued', details: "Driver's License issued to 0x742d35Cc...bD28" },
  { timestamp: '2:33:45 PM', action: 'Credential Issued', details: 'Diploma / Degree issued to 0x742d35Cc...bD28' },
  { timestamp: '2:31:08 PM', action: 'Credential Revoked', details: 'Index 3 revoked for 0x742d35Cc...bD28 (Background Check expired)' },
  { timestamp: '2:30:22 PM', action: 'Credential Issued', details: 'Medical License issued to 0x742d35Cc...bD28' },
  { timestamp: '2:28:50 PM', action: 'Issuer Authorized', details: '0xA1B2C3D4...4567 (Mayo Clinic) added as trusted issuer' },
  { timestamp: '2:28:15 PM', action: 'Identity Registered', details: '0x742d35Cc...bD28 registered on BlockID' },
]

// helper - checks if an addr is in the demo issuer list
export function isDemoIssuer(address) {
  return Object.keys(DEMO_ISSUERS).some(
    addr => addr.toLowerCase() === address.toLowerCase()
  )
}
