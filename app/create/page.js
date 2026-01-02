'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { FileText, Upload, User, Award, Loader2, CheckCircle, AlertCircle, ExternalLink } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { uploadToIPFS, getIPFSUrl } from '../../lib/ipfs';
import { issueCertificate, connectWallet, getCurrentAccount, getEtherscanLink } from '../../lib/web3';

export default function CreateCertificate() {
  const { user } = useAuth();
  const fileInputRef = useRef(null);
  
  const [walletAddress, setWalletAddress] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploadingToIPFS, setUploadingToIPFS] = useState(false);
  const [issuingOnChain, setIssuingOnChain] = useState(false);
  const [transactionStatus, setTransactionStatus] = useState(''); // 'pending', 'mining', 'success'
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [ipfsHash, setIpfsHash] = useState('');
  const [certificateId, setCertificateId] = useState(null);
  const [transactionHash, setTransactionHash] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    studentName: '',
  });

  // Check wallet connection on mount
  useEffect(() => {
    checkWalletConnection();
  }, []);

  const checkWalletConnection = async () => {
    const address = await getCurrentAccount();
    setWalletAddress(address);
  };

  const handleConnectWallet = async () => {
    setError('');
    const result = await connectWallet();
    if (result.success) {
      setWalletAddress(result.address);
    } else {
      setError(result.error);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      setError('Please select a valid image (JPEG, PNG) or PDF file');
      return;
    }

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      setError('File size must be less than 10MB');
      return;
    }

    setSelectedFile(file);
    setError('');
    
    // Create preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      setPreviewUrl(null);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleUploadToIPFS = async () => {
    if (!selectedFile) {
      setError('Please select a certificate file first');
      return;
    }

    setError('');
    setUploadingToIPFS(true);

    try {
      const result = await uploadToIPFS(selectedFile);
      
      if (result.success) {
        setIpfsHash(result.ipfsHash);
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Failed to upload to IPFS: ' + err.message);
    } finally {
      setUploadingToIPFS(false);
    }
  };

  const handleIssueOnBlockchain = async () => {
    if (!formData.studentName.trim()) {
      setError('Please enter student name');
      return;
    }

    if (!ipfsHash) {
      setError('Please upload certificate to IPFS first');
      return;
    }

    if (!walletAddress) {
      setError('Please connect your wallet first');
      return;
    }

    setError('');
    setIssuingOnChain(true);
    setTransactionStatus('pending');

    try {
      setTransactionStatus('mining');
      const result = await issueCertificate(formData.studentName, ipfsHash);
      
      if (result.success) {
        setTransactionStatus('success');
        setCertificateId(result.certificateId);
        setTransactionHash(result.transactionHash);
        setSuccess(true);
        
        // Don't auto-reset so user can see success message
        // User can manually reset by clicking "Issue Another Certificate" button
      } else {
        setTransactionStatus('');
        setError(result.error);
      }
    } catch (err) {
      setTransactionStatus('');
      setError('Failed to issue certificate on blockchain: ' + err.message);
    } finally {
      setIssuingOnChain(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // If IPFS hash not set, upload first
    if (!ipfsHash && selectedFile) {
      await handleUploadToIPFS();
      return;
    }

    // Then issue on blockchain
    await handleIssueOnBlockchain();
  };

  const resetForm = () => {
    setFormData({ studentName: '' });
    setSelectedFile(null);
    setPreviewUrl(null);
    setIpfsHash('');
    setCertificateId(null);
    setTransactionHash('');
    setTransactionStatus('');
    setSuccess(false);
    setError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold mb-2">
              Issue Certificate
            </h1>
            <p className="text-muted-foreground">
              Upload certificate to IPFS and register on blockchain
            </p>
          </div>

          {/* Wallet Connection */}
          {!walletAddress && (
            <Card className="mb-6 border-orange-200 bg-orange-50">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-orange-900">Connect Your Wallet</h3>
                    <p className="text-sm text-orange-700">Connect MetaMask to issue certificates</p>
                  </div>
                  <Button onClick={handleConnectWallet} variant="outline">
                    Connect Wallet
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {walletAddress && (
            <Card className="mb-6 border-green-200 bg-green-50">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-green-900">Wallet Connected</h3>
                    <p className="text-sm text-green-700 font-mono">
                      {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                    </p>
                  </div>
                  <Badge variant="secondary" className="bg-green-100">
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Connected
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Error Alert */}
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Transaction Status */}
          {issuingOnChain && (
            <Card className="mb-6 border-blue-200 bg-blue-50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-blue-900 mb-1">
                      {transactionStatus === 'pending' && 'Waiting for confirmation...'}
                      {transactionStatus === 'mining' && 'Transaction submitted! Mining in progress...'}
                    </h3>
                    <p className="text-sm text-blue-700">
                      {transactionStatus === 'pending' && 'Please confirm the transaction in MetaMask'}
                      {transactionStatus === 'mining' && 'This usually takes 15-30 seconds on Sepolia. Please wait...'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Success Message */}
          {certificateId && transactionHash && transactionStatus === 'success' && (
            <Card className="mb-6 border-green-500 bg-linear-to-r from-green-50 to-emerald-50 shadow-lg">
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-green-500 rounded-full">
                      <CheckCircle className="h-8 w-8 text-white" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-green-900">Certificate Issued Successfully! 🎉</h3>
                      <p className="text-green-700">Your certificate has been registered on the blockchain</p>
                    </div>
                  </div>
                  
                  <div className="bg-white rounded-lg p-4 space-y-3 border border-green-200">
                    <div className="flex items-center justify-between py-2 border-b">
                      <span className="text-sm font-medium text-gray-600">Certificate ID:</span>
                      <span className="text-xl font-bold text-green-600">{certificateId}</span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b">
                      <span className="text-sm font-medium text-gray-600">Student Name:</span>
                      <span className="font-semibold text-gray-900">{formData.studentName}</span>
                    </div>
                    <div className="flex items-center justify-between py-2">
                      <span className="text-sm font-medium text-gray-600">Transaction:</span>
                      <a 
                        href={getEtherscanLink(transactionHash)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline flex items-center gap-1 font-medium"
                      >
                        View on Etherscan <ExternalLink className="h-4 w-4" />
                      </a>
                    </div>
                    <div className="flex items-center justify-between py-2">
                      <span className="text-sm font-medium text-gray-600">Certificate File:</span>
                      <a 
                        href={getIPFSUrl(ipfsHash)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline flex items-center gap-1 font-medium"
                      >
                        View on IPFS <ExternalLink className="h-4 w-4" />
                      </a>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <Button onClick={resetForm} variant="outline" className="flex-1">
                      Issue Another Certificate
                    </Button>
                    <Button asChild className="flex-1">
                      <Link href="/my-certificates">View My Certificates</Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Form */}
          <Card>
            <CardHeader>
              <CardTitle>Certificate Information</CardTitle>
              <CardDescription>
                Enter student details and upload the certificate file
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Student Name */}
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    Student Name *
                  </label>
                  <Input
                    type="text"
                    name="studentName"
                    value={formData.studentName}
                    onChange={handleChange}
                    required
                    placeholder="Enter student's full name"
                    disabled={issuingOnChain}
                  />
                </div>

                {/* File Upload */}
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Upload className="h-4 w-4 text-muted-foreground" />
                    Certificate File *
                  </label>
                  <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary transition-colors">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={handleFileSelect}
                      className="hidden"
                      id="certificate-file"
                      disabled={uploadingToIPFS || issuingOnChain}
                    />
                    <label 
                      htmlFor="certificate-file" 
                      className="cursor-pointer flex flex-col items-center"
                    >
                      <Upload className="h-12 w-12 text-muted-foreground mb-2" />
                      <p className="text-sm font-medium">
                        Click to upload certificate
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        PNG, JPEG, or PDF (Max 10MB)
                      </p>
                    </label>
                  </div>

                  {selectedFile && (
                    <div className="mt-3 p-3 bg-secondary rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          <span className="text-sm font-medium">{selectedFile.name}</span>
                          <span className="text-xs text-muted-foreground">
                            ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                          </span>
                        </div>
                        {ipfsHash && (
                          <Badge variant="secondary" className="bg-green-100">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Uploaded to IPFS
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Preview */}
                  {previewUrl && (
                    <div className="mt-3">
                      <p className="text-sm font-medium mb-2">Preview:</p>
                      <img 
                        src={previewUrl} 
                        alt="Certificate preview" 
                        className="max-w-full h-auto rounded-lg border"
                      />
                    </div>
                  )}
                </div>

                {/* IPFS Hash Display */}
                {ipfsHash && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">IPFS Hash (CID)</label>
                    <div className="p-3 bg-secondary rounded-lg font-mono text-sm break-all">
                      {ipfsHash}
                    </div>
                    <a 
                      href={getIPFSUrl(ipfsHash)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                    >
                      View on IPFS <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3">
                  {!ipfsHash && selectedFile && (
                    <Button
                      type="button"
                      onClick={handleUploadToIPFS}
                      disabled={uploadingToIPFS || !walletAddress}
                      className="flex-1"
                    >
                      {uploadingToIPFS ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Uploading to IPFS...
                        </>
                      ) : (
                        <>
                          <Upload className="mr-2 h-4 w-4" />
                          Upload to IPFS
                        </>
                      )}
                    </Button>
                  )}

                  {ipfsHash && (
                    <Button
                      type="button"
                      onClick={handleIssueOnBlockchain}
                      disabled={issuingOnChain || !walletAddress || !formData.studentName}
                      className="flex-1"
                    >
                      {issuingOnChain ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Issuing on Blockchain...
                        </>
                      ) : (
                        <>
                          <Award className="mr-2 h-4 w-4" />
                          Issue on Blockchain
                        </>
                      )}
                    </Button>
                  )}
                </div>

                {/* Info */}
                <div className="text-sm text-muted-foreground space-y-1 pt-4 border-t">
                  <p className="font-semibold">How it works:</p>
                  <ol className="list-decimal list-inside space-y-1 ml-2">
                    <li>Enter the student&apos;s name</li>
                    <li>Upload the certificate image/PDF</li>
                    <li>Upload to IPFS (decentralized storage)</li>
                    <li>Issue certificate on Sepolia blockchain</li>
                    <li>Receive unique Certificate ID</li>
                  </ol>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Statistics */}
          {walletAddress && (
            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <Award className="h-8 w-8 mx-auto mb-2 text-primary" />
                    <p className="text-2xl font-bold">{certificateId || '-'}</p>
                    <p className="text-xs text-muted-foreground">Last Certificate ID</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <FileText className="h-8 w-8 mx-auto mb-2 text-primary" />
                    <p className="text-2xl font-bold">IPFS</p>
                    <p className="text-xs text-muted-foreground">Decentralized Storage</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <CheckCircle className="h-8 w-8 mx-auto mb-2 text-primary" />
                    <p className="text-2xl font-bold">Sepolia</p>
                    <p className="text-xs text-muted-foreground">Ethereum Testnet</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

