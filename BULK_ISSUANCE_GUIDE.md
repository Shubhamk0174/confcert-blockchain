# Bulk Certificate Issuance Guide

## Overview
This feature allows you to issue multiple certificates in a single blockchain transaction, significantly reducing gas costs and time.

## Features Added

### 1. Smart Contract Enhancement
- Added `bulkIssueCertificates()` function to `CertificateRegistry.sol`
- Accepts arrays of student names and IPFS hashes
- Issues up to 100 certificates in one transaction
- Emits individual events for each certificate

### 2. Web3 Integration
- Added `bulkIssueCertificates()` function to `lib/web3.js`
- Handles batch transaction submission
- Extracts all certificate IDs from events
- Returns complete results array

### 3. User Interface
- Toggle between Single and Bulk modes
- Excel file upload with validation
- Template download feature
- Live student data preview
- Progress tracking during processing
- Comprehensive results display

## How to Use

### Step 1: Prepare Excel File
Create an Excel file (.xlsx or .xls) with the following columns:
- `name` (required): Student's full name
- `email` (optional): Student's email address

**Example:**
| name | email |
|------|-------|
| John Doe | john@example.com |
| Jane Smith | jane@example.com |
| Bob Johnson | bob@example.com |

**OR download the template:**
Click "Download Template" button in the Bulk Issue section.

### Step 2: Select Template
1. Go to the Create Certificate page
2. Click "Bulk Issue" button
3. Select a certificate template from your saved templates
4. If you don't have templates, create one first in the Template Editor

### Step 3: Upload Excel File
1. Click "Upload Student List (Excel)"
2. Select your prepared Excel file
3. Verify the student list in the preview table
4. Check/uncheck "Send certificate emails to all students" option

### Step 4: Issue Certificates
1. Ensure your wallet is connected
2. Click "Issue X Certificates in Bulk"
3. Approve the MetaMask transaction
4. Wait for the process to complete:
   - Generating certificates (creates image for each student)
   - Uploading to IPFS (stores all certificates)
   - Issuing on blockchain (one transaction for all)
   - Sending emails (if enabled)

### Step 5: Review Results
- View all issued certificate IDs
- Access individual certificates via IPFS links
- Check transaction on Etherscan
- Download or share certificates

## Technical Process

### Certificate Generation Flow
```
1. User uploads Excel file → Parse student data
2. Select template → Load template configuration
3. For each student:
   - Render template with student name
   - Convert to PNG blob
4. Upload all PNGs to IPFS → Get IPFS hashes array
5. Submit blockchain transaction → Issue all certificates
6. Send emails to all students (if enabled)
7. Display results with certificate IDs
```

### Gas Optimization
Bulk issuance significantly reduces costs:
- **Single Mode**: 1 transaction per certificate
- **Bulk Mode**: 1 transaction for all certificates
- **Example**: Issuing 50 certificates costs similar to 1-2 individual certificates

## Limitations
- Maximum 100 certificates per batch
- Requires a saved template (custom file upload not supported in bulk mode)
- Excel file must contain valid data structure
- All certificates use the same template design

## Error Handling
The system validates:
- Excel file format (.xlsx or .xls only)
- Required columns (name field is mandatory)
- Student count (max 100)
- Template selection
- Wallet connection
- IPFS upload success
- Blockchain transaction confirmation

## Contract Deployment Note
After updating the smart contract, you need to:
1. Redeploy `CertificateRegistry.sol` to Sepolia network
2. Update `NEXT_PUBLIC_CONTRACT_ADDRESS` in your `.env.local` file
3. The new ABI is already updated in `lib/web3.js`

## Excel Template Format
```
name                | email
--------------------|------------------------
John Doe           | john@example.com
Jane Smith         | jane@example.com
Bob Johnson        | bob@example.com
Alice Williams     | alice@example.com
```

**Column names can be:**
- `name`, `Name`, `studentName`, or `StudentName`
- `email` or `Email`

## Benefits
✅ **Cost Effective**: One transaction for multiple certificates
✅ **Time Saving**: Automated batch processing
✅ **Consistent**: Same template for all certificates
✅ **Trackable**: Individual certificate IDs for each student
✅ **Automated Emails**: Send certificates to all students at once
✅ **Verifiable**: All certificates registered on blockchain

## Support
For issues or questions, check:
- Smart Contract: `contracts/CertificateRegistry.sol`
- Web3 Functions: `lib/web3.js`
- UI Component: `app/create/page.js`
