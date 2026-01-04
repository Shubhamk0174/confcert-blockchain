"use client";

import { useState, useRef, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  FileText,
  Upload,
  User,
  Award,
  Loader2,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Palette,
  FileImage,
} from "lucide-react";
import { Button } from "../../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Input } from "../../components/ui/input";
import { Alert, AlertDescription } from "../../components/ui/alert";
import { uploadToIPFS, getIPFSUrl } from "../../lib/ipfs";
import {
  issueCertificate,
  connectWallet,
  getCurrentAccount,
  getEtherscanLink,
} from "../../lib/web3";
import NextImage from "next/image";
import localforage from 'localforage';

export default function CreateCertificate() {
  const { user } = useAuth();
  const fileInputRef = useRef(null);
  const previewCanvasRef = useRef(null);

  const [walletAddress, setWalletAddress] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploadingToIPFS, setUploadingToIPFS] = useState(false);
  const [issuingOnChain, setIssuingOnChain] = useState(false);
  const [transactionStatus, setTransactionStatus] = useState(""); // 'pending', 'mining', 'success'
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [ipfsHash, setIpfsHash] = useState("");
  const [certificateId, setCertificateId] = useState(null);
  const [transactionHash, setTransactionHash] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Template selection
  const [useTemplate, setUseTemplate] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [availableTemplates, setAvailableTemplates] = useState([]);

  const [formData, setFormData] = useState({
    studentName: "",
  });

  // Check wallet connection on mount
  useEffect(() => {
    checkWalletConnection();
    loadSavedTemplates();
  }, []);

  const checkWalletConnection = async () => {
    const address = await getCurrentAccount();
    setWalletAddress(address);
  };

  const loadSavedTemplates = async () => {
    try {
      const templates = await localforage.getItem('certificateTemplates');
      if (templates) {
        setAvailableTemplates(templates);
      } else {
        setAvailableTemplates([]);
      }
    } catch (error) {
      console.error('Error loading saved templates:', error);
      setAvailableTemplates([]);
    }
  };

  const handleTemplateSelect = (template) => {
    setSelectedTemplate(template);
    setUseTemplate(true);
    setSelectedFile(null);
    setPreviewUrl(null);
    setError("");
  };

  const renderTemplatePreview = async () => {
    if (!previewCanvasRef.current || !selectedTemplate) return;

    const canvas = previewCanvasRef.current;
    const ctx = canvas.getContext("2d");

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    try {
      // Draw background
      if (selectedTemplate.backgroundImage) {
        const img = new window.Image();
        img.crossOrigin = "anonymous";
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = () => resolve(); // Continue even if image fails
          img.src = selectedTemplate.backgroundImage;
        });
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      } else {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      // Draw logo
      if (selectedTemplate.logo) {
        const logoImg = new window.Image();
        logoImg.crossOrigin = "anonymous";
        await new Promise((resolve, reject) => {
          logoImg.onload = resolve;
          logoImg.onerror = () => resolve(); // Continue even if logo fails
          logoImg.src = selectedTemplate.logo.url;
        });
        ctx.drawImage(
          logoImg,
          selectedTemplate.logo.x,
          selectedTemplate.logo.y,
          selectedTemplate.logo.width,
          selectedTemplate.logo.height
        );
      }

      // Draw text elements
      if (selectedTemplate.textElements) {
        selectedTemplate.textElements.forEach((element) => {
          ctx.save();
          ctx.fillStyle = element.color;
          ctx.font = `${element.fontWeight} ${element.fontSize}px ${element.fontFamily}`;
          ctx.textAlign = element.align;
          ctx.textBaseline = "top";

          const textX =
            element.align === "center"
              ? element.x + element.width / 2
              : element.align === "right"
              ? element.x + element.width
              : element.x;

          ctx.fillText(element.text, textX, element.y);
          ctx.restore();
        });
      }

      // Draw name placeholder with actual name or placeholder text
      const nameElement = selectedTemplate.namePlaceholder;
      if (nameElement) {
        ctx.save();
        ctx.fillStyle = nameElement.color;
        ctx.font = `${nameElement.fontWeight} ${nameElement.fontSize}px ${nameElement.fontFamily}`;
        ctx.textAlign = nameElement.align;
        ctx.textBaseline = "top";

        const nameX =
          nameElement.align === "center"
            ? nameElement.x + nameElement.width / 2
            : nameElement.align === "right"
            ? nameElement.x + nameElement.width
            : nameElement.x;

        const displayName = formData.studentName || "<Student Name>";
        ctx.fillText(displayName, nameX, nameElement.y);
        ctx.restore();
      }
    } catch (error) {
      console.error("Error rendering template preview:", error);
    }
  };

  // Update template preview when student name or template changes
  useEffect(() => {
    if (useTemplate && selectedTemplate && previewCanvasRef.current) {
      renderTemplatePreview();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.studentName, selectedTemplate, useTemplate]);

  const handleUseCustomFile = () => {
    setUseTemplate(false);
    setSelectedTemplate(null);
    setSelectedFile(null);
    setPreviewUrl(null);
    setError("");
  };

  const generateCertificateFromTemplate = async (template, studentName) => {
    // Create a canvas and draw the template
    const canvas = document.createElement("canvas");
    canvas.width = 1000; // Same as editor
    canvas.height = 707; // Same as editor
    const ctx = canvas.getContext("2d");

    // Draw background
    if (template.backgroundImage) {
      const img = new window.Image();
      img.crossOrigin = "anonymous";
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = template.backgroundImage;
      });
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    } else {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // Draw logo
    if (template.logo) {
      const logoImg = new window.Image();
      logoImg.crossOrigin = "anonymous";
      await new Promise((resolve, reject) => {
        logoImg.onload = resolve;
        logoImg.onerror = reject;
        logoImg.src = template.logo.url;
      });
      ctx.drawImage(
        logoImg,
        template.logo.x,
        template.logo.y,
        template.logo.width,
        template.logo.height
      );
    }

    // Draw text elements
    template.textElements.forEach((element) => {
      ctx.save();
      ctx.fillStyle = element.color;
      ctx.font = `${element.fontWeight} ${element.fontSize}px ${element.fontFamily}`;
      ctx.textAlign = element.align;
      ctx.textBaseline = "top";

      const textX =
        element.align === "center"
          ? element.x + element.width / 2
          : element.align === "right"
          ? element.x + element.width
          : element.x;

      ctx.fillText(element.text, textX, element.y);
      ctx.restore();
    });

    // Draw name placeholder (replace with actual name)
    const nameElement = template.namePlaceholder;
    ctx.save();
    ctx.fillStyle = nameElement.color;
    ctx.font = `${nameElement.fontWeight} ${nameElement.fontSize}px ${nameElement.fontFamily}`;
    ctx.textAlign = nameElement.align;
    ctx.textBaseline = "top";

    const nameX =
      nameElement.align === "center"
        ? nameElement.x + nameElement.width / 2
        : nameElement.align === "right"
        ? nameElement.x + nameElement.width
        : nameElement.x;

    ctx.fillText(studentName, nameX, nameElement.y);
    ctx.restore();

    // Convert canvas to blob
    return new Promise((resolve) => {
      canvas.toBlob(resolve, "image/png");
    });
  };

  const handleConnectWallet = async () => {
    setError("");
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
    const validTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "application/pdf",
    ];
    if (!validTypes.includes(file.type)) {
      setError("Please select a valid image (JPEG, PNG) or PDF file");
      return;
    }

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      setError("File size must be less than 10MB");
      return;
    }

    setSelectedFile(file);
    setError("");

    // Create preview for images
    if (file.type.startsWith("image/")) {
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
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleUploadToIPFS = async () => {
    if (!useTemplate && !selectedFile) {
      setError("Please select a certificate file or choose a template");
      return;
    }

    if (useTemplate && !selectedTemplate) {
      setError("Please select a template");
      return;
    }

    if (useTemplate && !formData.studentName.trim()) {
      setError("Please enter student name before uploading template");
      return;
    }

    setError("");
    setUploadingToIPFS(true);

    try {
      let fileToUpload;

      if (useTemplate) {
        // Generate certificate image from template
        fileToUpload = await generateCertificateFromTemplate(
          selectedTemplate,
          formData.studentName
        );
        if (!fileToUpload) {
          throw new Error("Failed to generate certificate from template");
        }
      } else {
        fileToUpload = selectedFile;
      }

      const result = await uploadToIPFS(fileToUpload);

      if (result.success) {
        setIpfsHash(result.ipfsHash);
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError("Failed to upload to IPFS: " + err.message);
    } finally {
      setUploadingToIPFS(false);
    }
  };

  const handleIssueOnBlockchain = async () => {
    if (!formData.studentName.trim()) {
      setError("Please enter student name");
      return;
    }

    if (!ipfsHash) {
      setError("Please upload certificate to IPFS first");
      return;
    }

    if (!walletAddress) {
      setError("Please connect your wallet first");
      return;
    }

    setError("");
    setIssuingOnChain(true);
    setTransactionStatus("pending");

    try {
      setTransactionStatus("mining");
      const result = await issueCertificate(formData.studentName, ipfsHash);

      if (result.success) {
        setTransactionStatus("success");
        setCertificateId(result.certificateId);
        setTransactionHash(result.transactionHash);
        setSuccess(true);

        // Don't auto-reset so user can see success message
        // User can manually reset by clicking "Issue Another Certificate" button
      } else {
        setTransactionStatus("");
        setError(result.error);
      }
    } catch (err) {
      setTransactionStatus("");
      setError("Failed to issue certificate on blockchain: " + err.message);
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
    setFormData({ studentName: "" });
    setSelectedFile(null);
    setPreviewUrl(null);
    setIpfsHash("");
    setCertificateId(null);
    setTransactionHash("");
    setTransactionStatus("");
    setSuccess(false);
    setError("");
    setUseTemplate(false);
    setSelectedTemplate(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
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
                    <h3 className="font-semibold text-orange-900">
                      Connect Your Wallet
                    </h3>
                    <p className="text-sm text-orange-700">
                      Connect MetaMask to issue certificates
                    </p>
                  </div>
                  <Button onClick={handleConnectWallet} variant="outline">
                    Connect Wallet
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {walletAddress && (
            <Card className="mb-6 border-primary/50 bg-primary/5">
              <CardContent className="">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-primary">
                      Wallet Connected
                    </h3>
                    <p className="text-sm text-primary/80 font-mono">
                      {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                    </p>
                  </div>
                  <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
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
                      {transactionStatus === "pending" &&
                        "Waiting for confirmation..."}
                      {transactionStatus === "mining" &&
                        "Transaction submitted! Mining in progress..."}
                    </h3>
                    <p className="text-sm text-blue-700">
                      {transactionStatus === "pending" &&
                        "Please confirm the transaction in MetaMask"}
                      {transactionStatus === "mining" &&
                        "This usually takes 15-30 seconds on Sepolia. Please wait..."}
                    </p>
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
                Choose to use a template or upload a certificate file, then
                enter student details
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

                {/* Certificate Source Selection */}
                <div className="space-y-4">
                  <label className="text-sm font-medium">
                    Certificate Source
                  </label>

                  <div className="grid md:grid-cols-2 gap-4">
                    {/* Use Template Option */}
                    <div
                      className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                        useTemplate
                          ? "border-primary bg-primary/5"
                          : "border-muted hover:border-primary/50"
                      }`}
                      onClick={() => setUseTemplate(true)}
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <Palette className="h-5 w-5 text-primary" />
                        <span className="font-medium">Use Template</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Generate certificate from saved templates
                      </p>
                    </div>

                    {/* Upload File Option */}
                    <div
                      className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                        !useTemplate
                          ? "border-primary bg-primary/5"
                          : "border-muted hover:border-primary/50"
                      }`}
                      onClick={handleUseCustomFile}
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <FileImage className="h-5 w-5 text-primary" />
                        <span className="font-medium">Upload File</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Upload your own certificate image or PDF
                      </p>
                    </div>
                  </div>
                </div>

                {/* Template Selection */}
                {useTemplate && (
                  <div className="space-y-4">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <Palette className="h-4 w-4 text-muted-foreground" />
                      Select Template
                    </label>

                    {availableTemplates.length === 0 ? (
                      <div className="text-center py-8 border-2 border-dashed rounded-lg">
                        <Palette className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground mb-4">
                          No saved templates found
                        </p>
                        <div className="flex gap-2 justify-center">
                          <Button asChild variant="outline">
                            <Link href="/edit-template">Create Template</Link>
                          </Button>
                          <Button asChild variant="ghost">
                            <Link href="/templates">Browse Templates</Link>
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex flex-wrap gap-2">
                          {availableTemplates.map((template, index) => (
                            <button
                              key={index}
                              onClick={() => handleTemplateSelect(template)}
                              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                                selectedTemplate === template
                                  ? "bg-primary text-primary-foreground shadow-md"
                                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                              }`}
                            >
                              {template.name || `Template ${index + 1}`}
                            </button>
                          ))}
                        </div>
                        {selectedTemplate && (
                          <p className="text-sm text-muted-foreground">
                            Selected: <span className="font-medium">{selectedTemplate.name || `Template ${availableTemplates.findIndex(t => t === selectedTemplate) + 1}`}</span>
                          </p>
                        )}
                      </div>
                    )}

                    {/* Template Preview */}
                    {selectedTemplate && (
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Preview</label>
                        <div className="border rounded-lg p-4 bg-neutral-50">
                          <canvas
                            ref={previewCanvasRef}
                            width={1000}
                            height={707}
                            className="w-full h-auto border border-neutral-200 bg-white rounded"
                          />
                          {!formData.studentName && (
                            <p className="text-sm text-muted-foreground mt-2 text-center">
                              Enter student name above to see it in the
                              certificate
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* File Upload */}
                {!useTemplate && (
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
                            <span className="text-sm font-medium">
                              {selectedFile.name}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              ({(selectedFile.size / 1024 / 1024).toFixed(2)}{" "}
                              MB)
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
                        <NextImage
                          src={previewUrl}
                          alt="Certificate preview"
                          className="max-w-full h-auto rounded-lg border"
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* IPFS Hash Display */}
                {ipfsHash && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      IPFS Hash (CID)
                    </label>
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
                  {!ipfsHash &&
                    (selectedFile || (useTemplate && selectedTemplate)) && (
                      <Button
                        type="button"
                        onClick={handleUploadToIPFS}
                        disabled={
                          uploadingToIPFS ||
                          !walletAddress ||
                          (useTemplate && !formData.studentName)
                        }
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
                      disabled={
                        issuingOnChain ||
                        !walletAddress ||
                        !formData.studentName
                      }
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

                {/* Success Message */}
                {certificateId &&
                  transactionHash &&
                  transactionStatus === "success" && (
                    <Card className="mb-6 border-primary/50 bg-primary/5 shadow-lg">
                      <CardContent className="pt-6">
                        <div className="space-y-4">
                          <div className="flex items-center gap-3">
                            <div className="p-3 bg-primary rounded-full">
                              <CheckCircle className="h-8 w-8 text-primary-foreground" />
                            </div>
                            <div>
                              <h3 className="text-2xl font-bold text-primary">
                                Certificate Issued Successfully! 🎉
                              </h3>
                              <p className="text-primary/80">
                                Your certificate has been registered on the
                                blockchain
                              </p>
                            </div>
                          </div>

                          <div className="bg-card rounded-lg p-4 space-y-3 border border-primary/20">
                            <div className="flex items-center justify-between py-2 border-b border-border">
                              <span className="text-sm font-medium text-muted-foreground">
                                Certificate ID:
                              </span>
                              <span className="text-xl font-bold text-primary">
                                {certificateId}
                              </span>
                            </div>
                            <div className="flex items-center justify-between py-2 border-b border-border">
                              <span className="text-sm font-medium text-muted-foreground">
                                Student Name:
                              </span>
                              <span className="font-semibold text-foreground">
                                {formData.studentName}
                              </span>
                            </div>
                            <div className="flex items-center justify-between py-2">
                              <span className="text-sm font-medium text-muted-foreground">
                                Transaction:
                              </span>
                              <a
                                href={getEtherscanLink(transactionHash)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline flex items-center gap-1 font-medium"
                              >
                                View on Etherscan{" "}
                                <ExternalLink className="h-4 w-4" />
                              </a>
                            </div>
                            <div className="flex items-center justify-between py-2">
                              <span className="text-sm font-medium text-muted-foreground">
                                Certificate File:
                              </span>
                              <a
                                href={getIPFSUrl(ipfsHash)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline flex items-center gap-1 font-medium"
                              >
                                View on IPFS{" "}
                                <ExternalLink className="h-4 w-4" />
                              </a>
                            </div>
                          </div>

                          <div className="flex gap-3 pt-2">
                            <Button
                              onClick={resetForm}
                              variant="outline"
                              className="flex-1"
                            >
                              Issue Another Certificate
                            </Button>
                            <Button asChild className="flex-1">
                              <Link href="/my-certificates">
                                View My Certificates
                              </Link>
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

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
                    <p className="text-2xl font-bold">{certificateId || "-"}</p>
                    <p className="text-xs text-muted-foreground">
                      Last Certificate ID
                    </p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <FileText className="h-8 w-8 mx-auto mb-2 text-primary" />
                    <p className="text-2xl font-bold">IPFS</p>
                    <p className="text-xs text-muted-foreground">
                      Decentralized Storage
                    </p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <CheckCircle className="h-8 w-8 mx-auto mb-2 text-primary" />
                    <p className="text-2xl font-bold">Sepolia</p>
                    <p className="text-xs text-muted-foreground">
                      Ethereum Testnet
                    </p>
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
