# 🎓 ConfCert - Blockchain Certificate Management Platform

A comprehensive blockchain-based certificate issuance and verification platform built with Next.js, Ethereum, and IPFS. ConfCert enables organizations to issue tamper-proof, instantly verifiable digital certificates stored on the blockchain.

![Next.js](https://img.shields.io/badge/Next.js-16.1.1-black)
![React](https://img.shields.io/badge/React-19.2.3-blue)
![Ethereum](https://img.shields.io/badge/Ethereum-Blockchain-purple)
![Solidity](https://img.shields.io/badge/Solidity-^0.8.0-grey)
![IPFS](https://img.shields.io/badge/IPFS-Pinata-teal)

## ✨ Features

### 🔐 Blockchain-Powered Security
- **Immutable Storage**: Certificates stored on Ethereum blockchain (Sepolia testnet)
- **Tamper-Proof**: Cryptographic signatures prevent unauthorized modifications
- **Decentralized**: No single point of failure with distributed storage
- **Smart Contract**: Solidity-based CertificateRegistry contract for secure operations

### 📝 Certificate Management
- **Single Certificate Issuance**: Create and issue individual certificates
- **Bulk Issuance**: Issue up to 100 certificates in one blockchain transaction
- **Template Editor**: Visual drag-and-drop certificate template designer
- **Custom Branding**: Add logos, backgrounds, and custom styling
- **PDF Export**: Download certificates as high-quality PDF files

### ✅ Instant Verification
- **QR Code Integration**: Quick verification via QR code scanning
- **Public Verification**: Anyone can verify certificates without login
- **Detailed Information**: View issuer, timestamp, and recipient details
- **IPFS Integration**: Certificate images stored on decentralized IPFS network

### 📧 Email Integration
- **Automated Delivery**: Send certificates directly to recipients' email
- **Bulk Email Sending**: Email multiple certificates simultaneously
- **Custom Templates**: Professional email templates with certificate links

### 🎨 Advanced Template System
- **Visual Editor**: Intuitive drag-and-drop interface
- **Text Elements**: Fully customizable fonts, colors, and positioning
- **Image Support**: Add logos and background images
- **Reusable Templates**: Save and reuse templates across projects
- **Real-time Preview**: See changes instantly while editing

### 📊 Certificate History
- **Issued Certificates**: Track all certificates issued by your wallet
- **Search & Filter**: Find certificates by ID or recipient name
- **Blockchain Explorer**: Direct links to view transactions on Etherscan
- **IPFS Access**: View certificates stored on IPFS

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 16.1.1 (App Router)
- **UI Library**: React 19.2.3
- **Styling**: Tailwind CSS 4
- **Components**: Radix UI, shadcn/ui
- **Animations**: Framer Motion, Lottie React
- **Forms**: React Draggable for template editor

### Blockchain
- **Smart Contracts**: Solidity ^0.8.0
- **Network**: Ethereum Sepolia Testnet
- **Web3 Library**: ethers.js 6.16.0
- **Wallet**: MetaMask integration

### Storage
- **Decentralized Storage**: IPFS (via Pinata)
- **Local Storage**: localforage for templates
- **Database**: On-chain storage via smart contracts

### Additional Libraries
- **Excel Processing**: xlsx (for bulk uploads)
- **PDF Generation**: jspdf + html2canvas
- **Email**: Nodemailer
- **Icons**: Lucide React

## 📋 Prerequisites

Before running this project, ensure you have:

- **Node.js** 18.x or higher
- **npm** or **yarn** package manager
- **MetaMask** browser extension installed
- **Ethereum Sepolia** testnet ETH (get from faucets)
- **Pinata Account** for IPFS (API key required)

## 🚀 Installation

### 1. Clone the Repository
```bash
git clone https://github.com/Shubhamk0174/confcert-blockchain.git
cd confcert-blockchain
```

### 2. Install Dependencies
```bash
npm install
# or
yarn install
```

### 3. Environment Setup

Create a `.env.local` file in the root directory:

```env
# Pinata IPFS Configuration
NEXT_PUBLIC_PINATA_API_KEY=your_pinata_api_key
NEXT_PUBLIC_PINATA_SECRET_KEY=your_pinata_secret_key
NEXT_PUBLIC_PINATA_JWT=your_pinata_jwt_token

# Smart Contract Configuration
NEXT_PUBLIC_CONTRACT_ADDRESS=your_deployed_contract_address
NEXT_PUBLIC_NETWORK=sepolia

# Email Configuration (Optional)
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_specific_password
```

### 4. Deploy Smart Contract

1. Install Hardhat or Truffle for contract deployment
2. Deploy `contracts/CertificateRegistry.sol` to Sepolia testnet
3. Copy the deployed contract address to `.env.local`

```bash
# Example using Hardhat
npx hardhat run scripts/deploy.js --network sepolia
```

### 5. Run Development Server
```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📖 Usage Guide

### Connect Wallet
1. Click "Connect Wallet" in the navigation bar
2. Approve MetaMask connection
3. Ensure you're on Sepolia testnet

### Create Certificate Template
1. Navigate to **Templates** page
2. Click "Create New Template"
3. Use the visual editor to design your certificate:
   - Add background images
   - Insert logos
   - Add text elements (name, title, date, etc.)
   - Customize fonts, colors, and positions
4. Save your template

### Issue Single Certificate
1. Go to **Create** page
2. Select "Single Issue" mode
3. Choose a saved template
4. Enter recipient details (name, email)
5. Preview the certificate
6. Click "Issue Certificate"
7. Confirm MetaMask transaction
8. Certificate will be uploaded to IPFS and registered on blockchain

### Bulk Issue Certificates
1. Go to **Create** page
2. Click "Bulk Issue" button
3. Download the Excel template
4. Fill in recipient details (name, email)
5. Upload the completed Excel file
6. Select a certificate template
7. Review the preview
8. Click "Issue All Certificates"
9. Confirm single transaction in MetaMask
10. All certificates will be processed in one transaction

**Excel Format:**
| name | email |
|------|-------|
| John Doe | john@example.com |
| Jane Smith | jane@example.com |

### Verify Certificate
1. Navigate to **Verify** page
2. Enter the certificate ID (e.g., 1001)
3. Click "Verify"
4. View certificate details:
   - Recipient name
   - Issue date
   - Issuer address
   - Certificate image from IPFS
   - Blockchain transaction proof

### View Certificate History
1. Go to **Issued History** page
2. Browse all certificates issued by your wallet
3. Search by ID or name
4. Click on any certificate to view details
5. Access blockchain explorer links

## 🏗️ Smart Contract

### CertificateRegistry.sol

Key functions:

```solidity
// Issue a single certificate
function issueCertificate(string memory _studentName, string memory _ipfsHash) 
    public onlyAuthorized returns (uint256)

// Issue multiple certificates in bulk
function bulkIssueCertificates(string[] memory _studentNames, string[] memory _ipfsHashes) 
    public onlyAuthorized returns (uint256[] memory)

// Retrieve certificate details
function getCertificate(uint256 _certificateId) 
    public view returns (Certificate memory)

// Authorize new issuers
function authorizeIssuer(address _issuer) 
    public onlyOwner

// Get current certificate counter
function getCurrentCounter() 
    public view returns (uint256)
```

### Contract Features
- **Role-Based Access**: Owner can authorize multiple issuers
- **Batch Processing**: Issue up to 100 certificates per transaction
- **Event Emission**: All issuances emit blockchain events
- **Gas Optimization**: Efficient bulk operations reduce costs
- **Immutable Records**: Certificates cannot be modified once issued

## 📁 Project Structure

```
confcert/
├── app/                          # Next.js App Router pages
│   ├── api/                      # API routes
│   │   ├── send-certificate-email/
│   │   └── upload-to-ipfs/
│   ├── about/                    # About page
│   ├── create/                   # Certificate creation
│   ├── edit-template/            # Template editor
│   ├── my-certificates/          # Certificate history
│   ├── verify/                   # Certificate verification
│   ├── layout.js                 # Root layout
│   ├── page.js                   # Home page
│   └── globals.css               # Global styles
├── components/                   # React components
│   ├── ui/                       # shadcn/ui components
│   ├── CertificateEditor.jsx     # Visual template editor
│   ├── navbar.js                 # Navigation bar
│   └── background-paths.jsx      # Background effects
├── contracts/                    # Smart contracts
│   └── CertificateRegistry.sol   # Main contract
├── contexts/                     # React contexts
│   └── AuthContext.js            # Wallet authentication
├── lib/                          # Utility functions
│   ├── ipfs.js                   # IPFS/Pinata integration
│   ├── web3.js                   # Blockchain interactions
│   └── utils.js                  # Helper functions
├── public/                       # Static assets
│   ├── animations/               # Lottie animations
│   ├── certificate_bg/           # Background images
│   └── icons/                    # Icon assets
├── .env.local                    # Environment variables
├── package.json                  # Dependencies
├── next.config.mjs               # Next.js configuration
├── tailwind.config.js            # Tailwind CSS config
└── README.md                     # This file
```

## 🔧 Configuration

### Network Configuration

Update `lib/web3.js` for different networks:

```javascript
const NETWORK_CONFIG = {
  sepolia: {
    chainId: '0xaa36a7',
    chainName: 'Sepolia Test Network',
    rpcUrls: ['https://sepolia.infura.io/v3/YOUR_INFURA_KEY'],
    blockExplorer: 'https://sepolia.etherscan.io'
  }
};
```

### IPFS Configuration

Configure Pinata in `.env.local`:
- Get API keys from [Pinata Cloud](https://www.pinata.cloud/)
- JWT token provides enhanced security
- Free tier: 1GB storage, 100GB bandwidth/month

## 🧪 Testing

### Smart Contract Testing
```bash
# Using Hardhat
npx hardhat test

# Run specific test
npx hardhat test test/CertificateRegistry.test.js
```

### Frontend Testing
```bash
# Run development build
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## 🚢 Deployment

### Deploy to Vercel

1. Push code to GitHub
2. Import project to Vercel
3. Add environment variables
4. Deploy

```bash
npm run build
```

### Deploy Smart Contract

```bash
# Using Hardhat
npx hardhat run scripts/deploy.js --network sepolia

# Verify on Etherscan
npx hardhat verify --network sepolia DEPLOYED_CONTRACT_ADDRESS
```

## 🔒 Security Considerations

- **Private Keys**: Never commit private keys or mnemonics
- **Environment Variables**: Use `.env.local` for sensitive data
- **Smart Contract Auditing**: Consider professional audit before mainnet
- **IPFS Security**: Use Pinata's pinning service for persistence
- **Wallet Security**: Users should secure their MetaMask wallets
- **API Keys**: Rotate Pinata API keys regularly

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request



## 📊 Stats

- **Certificate ID Range**: Starting from 1001
- **Max Bulk Issue**: 100 certificates per transaction
- **Supported Networks**: Ethereum Sepolia (testnet)
- **Storage**: IPFS (decentralized)
- **Smart Contract Language**: Solidity ^0.8.0

---

**Made with ❤️ by Shubham**

[![GitHub](https://img.shields.io/badge/GitHub-Shubham-black?logo=github)](https://github.com/Shubhamk0174)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-Connect-blue?logo=linkedin)](https://linkedin.com/in/yourprofile)
