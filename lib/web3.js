/**
 * Web3 Utility Functions
 * Handles blockchain interactions with the CertificateRegistry smart contract on Sepolia
 */

import { ethers } from 'ethers';

// Contract ABI - This will be generated after deploying the smart contract
// You'll need to update this after deployment
const CONTRACT_ABI = [
  {
    "inputs": [],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "certificateId",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "studentName",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "ipfsHash",
        "type": "string"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "issuer",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "timestamp",
        "type": "uint256"
      }
    ],
    "name": "CertificateIssued",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "issuer",
        "type": "address"
      }
    ],
    "name": "IssuerAuthorized",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "issuer",
        "type": "address"
      }
    ],
    "name": "IssuerRevoked",
    "type": "event"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_issuer",
        "type": "address"
      }
    ],
    "name": "authorizeIssuer",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "name": "authorizedIssuers",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "certificates",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "id",
        "type": "uint256"
      },
      {
        "internalType": "string",
        "name": "studentName",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "ipfsHash",
        "type": "string"
      },
      {
        "internalType": "address",
        "name": "issuer",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "timestamp",
        "type": "uint256"
      },
      {
        "internalType": "bool",
        "name": "exists",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_certificateId",
        "type": "uint256"
      }
    ],
    "name": "getCertificate",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "id",
        "type": "uint256"
      },
      {
        "internalType": "string",
        "name": "studentName",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "ipfsHash",
        "type": "string"
      },
      {
        "internalType": "address",
        "name": "issuer",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "timestamp",
        "type": "uint256"
      },
      {
        "internalType": "bool",
        "name": "exists",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_issuer",
        "type": "address"
      }
    ],
    "name": "getCertificatesByIssuer",
    "outputs": [
      {
        "internalType": "uint256[]",
        "name": "",
        "type": "uint256[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getCurrentCounter",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_issuer",
        "type": "address"
      }
    ],
    "name": "isAuthorized",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "_studentName",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "_ipfsHash",
        "type": "string"
      }
    ],
    "name": "issueCertificate",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "owner",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_issuer",
        "type": "address"
      }
    ],
    "name": "revokeIssuer",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_certificateId",
        "type": "uint256"
      }
    ],
    "name": "verifyCertificate",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

// Contract address on Sepolia - Update this after deployment
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '';

// Sepolia network configuration
const SEPOLIA_CHAIN_ID = '0xaa36a7'; // 11155111 in decimal
const SEPOLIA_RPC_URL = 'https://sepolia.infura.io/v3/YOUR_INFURA_KEY'; // Or use Alchemy

/**
 * Check if MetaMask is installed
 */
export function isMetaMaskInstalled() {
  return typeof window !== 'undefined' && typeof window.ethereum !== 'undefined';
}

/**
 * Request account access from MetaMask
 */
export async function connectWallet() {
  try {
    if (!isMetaMaskInstalled()) {
      throw new Error('MetaMask is not installed. Please install MetaMask to continue.');
    }

    // Request account access
    const accounts = await window.ethereum.request({
      method: 'eth_requestAccounts'
    });

    // Check if connected to Sepolia
    const chainId = await window.ethereum.request({ method: 'eth_chainId' });
    
    if (chainId !== SEPOLIA_CHAIN_ID) {
      await switchToSepolia();
    }

    return {
      success: true,
      address: accounts[0]
    };

  } catch (error) {
    console.error('Connect Wallet Error:', error);
    return {
      success: false,
      error: error.message || 'Failed to connect wallet'
    };
  }
}

/**
 * Switch to Sepolia network
 */
export async function switchToSepolia() {
  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: SEPOLIA_CHAIN_ID }],
    });
  } catch (switchError) {
    // This error code indicates that the chain has not been added to MetaMask
    if (switchError.code === 4902) {
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [
          {
            chainId: SEPOLIA_CHAIN_ID,
            chainName: 'Sepolia Test Network',
            nativeCurrency: {
              name: 'Sepolia ETH',
              symbol: 'ETH',
              decimals: 18
            },
            rpcUrls: ['https://sepolia.infura.io/v3/'],
            blockExplorerUrls: ['https://sepolia.etherscan.io/']
          },
        ],
      });
    } else {
      throw switchError;
    }
  }
}

/**
 * Get contract instance
 */
function getContract(signer) {
  if (!CONTRACT_ADDRESS) {
    throw new Error('Contract address not configured. Please deploy the contract and set NEXT_PUBLIC_CONTRACT_ADDRESS');
  }
  return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
}

/**
 * Get provider and signer
 */
async function getProviderAndSigner() {
  if (!isMetaMaskInstalled()) {
    throw new Error('MetaMask is not installed');
  }

  // Ensure we're on Sepolia network before any transaction
  const chainId = await window.ethereum.request({ method: 'eth_chainId' });
  if (chainId !== SEPOLIA_CHAIN_ID) {
    await switchToSepolia();
  }

  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  
  return { provider, signer };
}

/**
 * Issue a new certificate on the blockchain
 * @param {string} studentName - Name of the student
 * @param {string} ipfsHash - IPFS hash of the certificate image
 * @returns {Promise<{success: boolean, certificateId?: number, transactionHash?: string, error?: string}>}
 */
export async function issueCertificate(studentName, ipfsHash) {
  try {
    const { signer } = await getProviderAndSigner();
    const contract = getContract(signer);

    // Call the smart contract function
    const tx = await contract.issueCertificate(studentName, ipfsHash);
    
    console.log('Transaction sent:', tx.hash);
    
    // Wait for transaction to be mined
    const receipt = await tx.wait();
    
    console.log('Transaction mined:', receipt);

    // Extract certificate ID from event logs
    const event = receipt.logs.find(log => {
      try {
        const parsed = contract.interface.parseLog(log);
        return parsed.name === 'CertificateIssued';
      } catch {
        return false;
      }
    });

    let certificateId;
    if (event) {
      const parsed = contract.interface.parseLog(event);
      certificateId = Number(parsed.args.certificateId);
    }

    return {
      success: true,
      certificateId,
      transactionHash: receipt.hash,
      blockNumber: receipt.blockNumber
    };

  } catch (error) {
    console.error('Issue Certificate Error:', error);
    return {
      success: false,
      error: error.message || 'Failed to issue certificate on blockchain'
    };
  }
}

/**
 * Get certificate details from blockchain
 * @param {number} certificateId - The certificate ID to look up
 * @returns {Promise<{success: boolean, certificate?: object, error?: string}>}
 */
export async function getCertificate(certificateId) {
  try {
    const { provider } = await getProviderAndSigner();
    const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);

    const result = await contract.getCertificate(certificateId);

    if (!result.exists) {
      return {
        success: false,
        error: 'Certificate not found'
      };
    }

    return {
      success: true,
      certificate: {
        id: Number(result.id),
        studentName: result.studentName,
        ipfsHash: result.ipfsHash,
        issuer: result.issuer,
        timestamp: Number(result.timestamp),
        exists: result.exists
      }
    };

  } catch (error) {
    console.error('Get Certificate Error:', error);
    return {
      success: false,
      error: error.message || 'Failed to retrieve certificate from blockchain'
    };
  }
}

/**
 * Verify if a certificate exists
 * @param {number} certificateId - The certificate ID to verify
 * @returns {Promise<{success: boolean, exists?: boolean, error?: string}>}
 */
export async function verifyCertificate(certificateId) {
  try {
    const { provider } = await getProviderAndSigner();
    const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);

    const exists = await contract.verifyCertificate(certificateId);

    return {
      success: true,
      exists
    };

  } catch (error) {
    console.error('Verify Certificate Error:', error);
    return {
      success: false,
      error: error.message || 'Failed to verify certificate'
    };
  }
}

/**
 * Get all certificates issued by current user
 * @returns {Promise<{success: boolean, certificateIds?: number[], error?: string}>}
 */
export async function getMyCertificates() {
  try {
    const { signer, provider } = await getProviderAndSigner();
    const address = await signer.getAddress();
    const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);

    const certificateIds = await contract.getCertificatesByIssuer(address);

    return {
      success: true,
      certificateIds: certificateIds.map(id => Number(id))
    };

  } catch (error) {
    console.error('Get My Certificates Error:', error);
    return {
      success: false,
      error: error.message || 'Failed to retrieve certificates'
    };
  }
}

/**
 * Get current connected wallet address
 */
export async function getCurrentAccount() {
  try {
    if (!isMetaMaskInstalled()) {
      return null;
    }

    const accounts = await window.ethereum.request({
      method: 'eth_accounts'
    });

    return accounts[0] || null;

  } catch (error) {
    console.error('Get Current Account Error:', error);
    return null;
  }
}

/**
 * Format blockchain timestamp to readable date
 */
export function formatTimestamp(timestamp) {
  return new Date(timestamp * 1000).toLocaleString();
}

/**
 * Shorten Ethereum address for display
 */
export function shortenAddress(address) {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/**
 * Get Sepolia Etherscan link for transaction
 */
export function getEtherscanLink(txHash) {
  return `https://sepolia.etherscan.io/tx/${txHash}`;
}

/**
 * Get Sepolia Etherscan link for address
 */
export function getAddressLink(address) {
  return `https://sepolia.etherscan.io/address/${address}`;
}
