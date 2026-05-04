import { useState, useEffect } from 'react'
import { BrowserProvider, Contract } from 'ethers'
import abi from '../abi.json'

// hook that sets up the ethers contract instance w/ metamask
// pass in contract adress, get back contract obj + signer + account
function useContract(contractAddress) {
  const [contract, setContract] = useState(null)
  const [signer, setSigner] = useState(null)
  const [account, setAccount] = useState(null)
  const [error, setError] = useState(null)

  // connect to metamask, grab signer
  async function connect() {
    try {
      if (!window.ethereum) {
        setError('MetaMask not found. Please install it.')
        return
      }

      const provider = new BrowserProvider(window.ethereum)
      // prompt wallet connection
      await provider.send('eth_requestAccounts', [])
      const s = await provider.getSigner()
      const addr = await s.getAddress()

      setSigner(s)
      setAccount(addr)
      setError(null)

      // only init contract if we got an adress
      if (contractAddress) {
        const c = new Contract(contractAddress, abi, s)
        setContract(c)
      }
    } catch (err) {
      setError(err.message)
    }
  }

  // re-init contract when addr Changes
  useEffect(() => {
    if (signer && contractAddress) {
      const c = new Contract(contractAddress, abi, signer)
      setContract(c)
    }
  }, [contractAddress, signer])

  // handle account switches in metamask
  useEffect(() => {
    if (window.ethereum) {
      const handleChange = (accounts) => {
        if (accounts.length > 0) {
          setAccount(accounts[0])
          connect()
        }
      }
      window.ethereum.on('accountsChanged', handleChange)
      return () => window.ethereum.removeListener('accountsChanged', handleChange)
    }
  }, [])

  return { contract, account, signer, error, connect }
}

export default useContract
