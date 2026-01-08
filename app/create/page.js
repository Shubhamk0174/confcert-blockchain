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
  Mail,
  Users,
  Table,
  Download,
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
import { getIPFSUrl } from "../../lib/ipfs";
import {
  issueCertificate,
  bulkIssueCertificates,
  connectWallet,
  getCurrentAccount,
  getEtherscanLink,
} from "../../lib/web3";
import NextImage from "next/image";
import localforage from 'localforage';
import * as XLSX from 'xlsx';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../../lib/canvas-constants';

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
    email: "",
    customPlaceholderValues: {}, // For storing custom placeholder values
  });

  const [sendEmail, setSendEmail] = useState(true);

  // Bulk upload state
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [excelFile, setExcelFile] = useState(null);
  const [studentsData, setStudentsData] = useState([]);
  const [bulkProgress, setBulkProgress] = useState({ current: 0, total: 0 });
  const [bulkResults, setBulkResults] = useState(null);

  // Check wallet connection on mount
  useEffect(() => {
    checkWalletConnection();
    loadSavedTemplates();
  }, []);

  // Re-parse Excel data when template changes in bulk mode
  useEffect(() => {
    if (isBulkMode && excelFile && selectedTemplate && selectedTemplate.customPlaceholders) {
      // Re-read the Excel file to extract custom placeholder values
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = new Uint8Array(event.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(firstSheet);

          if (jsonData.length === 0) return;

          const students = jsonData.map((row, index) => {
            const name = row.name || row.Name || row.studentName || row.StudentName || "";
            const email = row.email || row.Email || "";

            if (!name) return null;

            // Extract custom placeholder values
            const customPlaceholderValues = {};
            if (selectedTemplate.customPlaceholders) {
              selectedTemplate.customPlaceholders.forEach(placeholder => {
                if (placeholder.key) {
                  // Try different case variations of the key
                  const value = row[placeholder.key] || 
                               row[placeholder.key.toLowerCase()] || 
                               row[placeholder.key.toUpperCase()] || 
                               "";
                  customPlaceholderValues[placeholder.key] = value;
                }
              });
            }

            return {
              name: name.trim(),
              email: email.trim(),
              customPlaceholderValues,
            };
          }).filter(Boolean);

          setStudentsData(students);
        } catch (err) {
          console.error('Error re-parsing Excel with template:', err);
        }
      };
      reader.readAsArrayBuffer(excelFile);
    }
  }, [selectedTemplate, excelFile, isBulkMode]);

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
    setIpfsHash(""); // Clear previous IPFS hash when selecting new template
    
    // Initialize custom placeholder values based on template
    const initialCustomValues = {};
    if (template.customPlaceholders && Array.isArray(template.customPlaceholders)) {
      template.customPlaceholders.forEach(ph => {
        if (ph.key) {
          initialCustomValues[ph.key] = '';
        }
      });
    }
    setFormData(prev => ({
      ...prev,
      customPlaceholderValues: initialCustomValues
    }));
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

      // Draw custom placeholders
      if (selectedTemplate.customPlaceholders && Array.isArray(selectedTemplate.customPlaceholders)) {
        selectedTemplate.customPlaceholders.forEach((placeholder) => {
          if (placeholder.key) {
            ctx.save();
            ctx.fillStyle = placeholder.color;
            ctx.font = `${placeholder.fontWeight} ${placeholder.fontSize}px ${placeholder.fontFamily}`;
            ctx.textAlign = placeholder.align;
            ctx.textBaseline = "top";

            const placeholderX =
              placeholder.align === "center"
                ? placeholder.x + placeholder.width / 2
                : placeholder.align === "right"
                ? placeholder.x + placeholder.width
                : placeholder.x;

            const displayValue = formData.customPlaceholderValues?.[placeholder.key] || `<${placeholder.key}>`;
            ctx.fillText(displayValue, placeholderX, placeholder.y);
            ctx.restore();
          }
        });
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
  }, [formData.studentName, formData.customPlaceholderValues, selectedTemplate, useTemplate]);

  const handleUseCustomFile = () => {
    setUseTemplate(false);
    setSelectedTemplate(null);
    setSelectedFile(null);
    setPreviewUrl(null);
    setError("");
  };

  const generateCertificateFromTemplate = async (template, studentName, customPlaceholderValues = {}) => {
    // Create a canvas and draw the template
    const canvas = document.createElement("canvas");
    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;
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

    // Draw custom placeholders
    if (template.customPlaceholders && Array.isArray(template.customPlaceholders)) {
      template.customPlaceholders.forEach((placeholder) => {
        if (placeholder.key && customPlaceholderValues[placeholder.key]) {
          ctx.save();
          ctx.fillStyle = placeholder.color;
          ctx.font = `${placeholder.fontWeight} ${placeholder.fontSize}px ${placeholder.fontFamily}`;
          ctx.textAlign = placeholder.align;
          ctx.textBaseline = "top";

          const placeholderX =
            placeholder.align === "center"
              ? placeholder.x + placeholder.width / 2
              : placeholder.align === "right"
              ? placeholder.x + placeholder.width
              : placeholder.x;

          ctx.fillText(customPlaceholderValues[placeholder.key], placeholderX, placeholder.y);
          ctx.restore();
        }
      });
    }

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
          formData.studentName,
          formData.customPlaceholderValues
        );
        if (!fileToUpload) {
          throw new Error("Failed to generate certificate from template");
        }
      } else {
        fileToUpload = selectedFile;
      }

      const formDataUpload = new FormData();
      formDataUpload.append('file', fileToUpload);

      const response = await fetch('/api/upload-to-ipfs', {
        method: 'POST',
        body: formDataUpload,
      });

      const result = await response.json();

      if (response.ok) {
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

    if (!walletAddress) {
      setError("Please connect your wallet first");
      return;
    }

    if (!useTemplate && !selectedFile) {
      setError("Please select a certificate file or choose a template");
      return;
    }

    if (useTemplate && !selectedTemplate) {
      setError("Please select a template");
      return;
    }

    setError("");
    setIssuingOnChain(true);
    setTransactionStatus("pending");

    try {
      let currentIpfsHash = ipfsHash;

      // Upload to IPFS first if not already uploaded
      if (!currentIpfsHash) {
        setUploadingToIPFS(true);
        
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

        const formDataUpload = new FormData();
        formDataUpload.append('file', fileToUpload);

        const response = await fetch('/api/upload-to-ipfs', {
          method: 'POST',
          body: formDataUpload,
        });

        const uploadResult = await response.json();

        if (response.ok) {
          currentIpfsHash = uploadResult.ipfsHash;
          setIpfsHash(uploadResult.ipfsHash);
        } else {
          throw new Error(uploadResult.error || "Failed to upload to IPFS");
        }
        
        setUploadingToIPFS(false);
      }

      setTransactionStatus("mining");
      const result = await issueCertificate(formData.studentName, currentIpfsHash);

      if (result.success) {
        setTransactionStatus("success");
        setCertificateId(result.certificateId);
        setTransactionHash(result.transactionHash);
        setSuccess(true);

        // Send email if enabled
        if (sendEmail && formData.email) {
          try {
            const emailResponse = await fetch('/api/send-certificate-email', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                to: formData.email,
                studentName: formData.studentName,
                certificateId: result.certificateId,
                ipfsHash: currentIpfsHash,
                issuerAddress: walletAddress,
                transactionHash: result.transactionHash,
              }),
            });
            const emailResult = await emailResponse.json();
            if (!emailResult.success) {
              console.error('Failed to send email:', emailResult.error);
            }
          } catch (emailError) {
            console.error('Failed to send email:', emailError);
            // Don't set error, as certificate was issued successfully
          }
        }

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
    setFormData({ studentName: "", email: "" });
    setSendEmail(false);
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
    setIsBulkMode(false);
    setExcelFile(null);
    setStudentsData([]);
    setBulkProgress({ current: 0, total: 0 });
    setBulkResults(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Excel file handling
  const handleExcelUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      setError("Please upload a valid Excel file (.xlsx or .xls)");
      return;
    }

    setExcelFile(file);
    setError("");

    // Read and parse Excel file
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet);

        // Validate data structure
        if (jsonData.length === 0) {
          setError("Excel file is empty");
          return;
        }

        const students = jsonData.map((row, index) => {
          const name = row.name || row.Name || row.studentName || row.StudentName || "";
          const email = row.email || row.Email || "";

          if (!name) {
            throw new Error(`Row ${index + 1}: Missing name field`);
          }

          // Extract custom placeholder values
          const customPlaceholderValues = {};
          if (selectedTemplate && selectedTemplate.customPlaceholders) {
            selectedTemplate.customPlaceholders.forEach(placeholder => {
              if (placeholder.key) {
                // Try different case variations of the key
                const value = row[placeholder.key] || 
                             row[placeholder.key.toLowerCase()] || 
                             row[placeholder.key.toUpperCase()] || 
                             "";
                customPlaceholderValues[placeholder.key] = value;
              }
            });
          }

          return {
            name: name.trim(),
            email: email.trim(),
            customPlaceholderValues,
          };
        });

        if (students.length > 100) {
          setError("Cannot process more than 100 students at once. Please split into multiple files.");
          return;
        }

        setStudentsData(students);
        setError("");
      } catch (err) {
        setError(`Failed to parse Excel file: ${err.message}`);
        setStudentsData([]);
      }
    };

    reader.onerror = () => {
      setError("Failed to read Excel file");
    };

    reader.readAsArrayBuffer(file);
  };

  const downloadExcelTemplate = () => {
    const templateRow = { name: "John Doe", email: "john@example.com" };
    
    // Add custom placeholder columns if template is selected
    if (selectedTemplate && selectedTemplate.customPlaceholders) {
      selectedTemplate.customPlaceholders.forEach(placeholder => {
        if (placeholder.key) {
          templateRow[placeholder.key] = `Sample ${placeholder.key}`;
        }
      });
    }
    
    const template = [
      templateRow,
      { ...templateRow, name: "Jane Smith", email: "jane@example.com" },
      { ...templateRow, name: "Bob Johnson", email: "bob@example.com" },
    ];

    const worksheet = XLSX.utils.json_to_sheet(template);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Students");
    XLSX.writeFile(workbook, "certificate_template.xlsx");
  };

  const handleBulkIssue = async () => {
    if (!walletAddress) {
      setError("Please connect your wallet first");
      return;
    }

    if (!selectedTemplate) {
      setError("Please select a template for bulk issuance");
      return;
    }

    if (studentsData.length === 0) {
      setError("Please upload an Excel file with student data");
      return;
    }

    setError("");
    setLoading(true);
    setIssuingOnChain(true);
    setTransactionStatus("pending");
    setBulkProgress({ current: 0, total: studentsData.length });

    try {
      // Step 1: Generate all certificates
      const certificates = [];
      for (let i = 0; i < studentsData.length; i++) {
        setBulkProgress({ current: i + 1, total: studentsData.length, stage: 'Generating certificates' });
        const blob = await generateCertificateFromTemplate(
          selectedTemplate, 
          studentsData[i].name,
          studentsData[i].customPlaceholderValues || {}
        );
        certificates.push({ blob, student: studentsData[i] });
      }

      // Step 2: Upload all to IPFS
      const ipfsHashes = [];
      for (let i = 0; i < certificates.length; i++) {
        setBulkProgress({ current: i + 1, total: certificates.length, stage: 'Uploading to IPFS' });
        
        const formDataUpload = new FormData();
        formDataUpload.append('file', certificates[i].blob);

        const response = await fetch('/api/upload-to-ipfs', {
          method: 'POST',
          body: formDataUpload,
        });

        const uploadResult = await response.json();

        if (!response.ok) {
          throw new Error(`Failed to upload certificate ${i + 1} to IPFS: ${uploadResult.error}`);
        }

        ipfsHashes.push(uploadResult.ipfsHash);
      }

      // Step 3: Issue all certificates in one blockchain transaction
      setBulkProgress({ current: 0, total: studentsData.length, stage: 'Issuing on blockchain' });
      setTransactionStatus("mining");

      const studentNames = studentsData.map(s => s.name);
      const result = await bulkIssueCertificates(studentNames, ipfsHashes);

      if (result.success) {
        setTransactionStatus("success");
        setTransactionHash(result.transactionHash);
        
        // Store results
        const results = studentsData.map((student, index) => ({
          name: student.name,
          email: student.email,
          certificateId: result.certificateIds[index],
          ipfsHash: ipfsHashes[index],
        }));
        
        setBulkResults(results);

        // Step 4: Send emails to all students
        if (sendEmail) {
          setBulkProgress({ current: 0, total: results.length, stage: 'Sending emails' });
          
          for (let i = 0; i < results.length; i++) {
            if (results[i].email) {
              try {
                await fetch('/api/send-certificate-email', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    to: results[i].email,
                    studentName: results[i].name,
                    certificateId: results[i].certificateId,
                    ipfsHash: results[i].ipfsHash,
                    issuerAddress: walletAddress,
                    transactionHash: result.transactionHash,
                  }),
                });
              } catch (emailError) {
                console.error(`Failed to send email to ${results[i].email}:`, emailError);
              }
            }
            setBulkProgress({ current: i + 1, total: results.length, stage: 'Sending emails' });
          }
        }

        setSuccess(true);
      } else {
        setTransactionStatus("");
        setError(result.error);
      }
    } catch (err) {
      setTransactionStatus("");
      setError("Failed to issue certificates in bulk: " + err.message);
    } finally {
      setLoading(false);
      setIssuingOnChain(false);
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
            
            {/* Mode Toggle */}
            <div className="mt-4 flex gap-3">
              <Button
                variant={!isBulkMode ? "default" : "outline"}
                onClick={() => {
                  setIsBulkMode(false);
                  setError("");
                  setBulkResults(null);
                }}
              >
                <User className="mr-2 h-4 w-4" />
                Single Certificate
              </Button>
              <Button
                variant={isBulkMode ? "default" : "outline"}
                onClick={() => {
                  setIsBulkMode(true);
                  setError("");
                  setSuccess(false);
                }}
              >
                <Users className="mr-2 h-4 w-4" />
                Bulk Issue
              </Button>
            </div>
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

          {/* Bulk Upload Section */}
          {isBulkMode ? (
            <Card>
              <CardHeader>
                <CardTitle>Bulk Certificate Issuance</CardTitle>
                <CardDescription>
                  Upload an Excel file with student details to issue multiple certificates at once
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Template Selection for Bulk */}
                <div className="space-y-4">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Palette className="h-4 w-4 text-muted-foreground" />
                    Select Certificate Template *
                  </label>

                  {availableTemplates.length === 0 ? (
                    <div className="text-center py-8 border-2 border-dashed rounded-lg">
                      <Palette className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground mb-4">
                        No saved templates found
                      </p>
                      <Button asChild variant="outline">
                        <Link href="/edit-template">Create Template</Link>
                      </Button>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {availableTemplates.map((template, index) => (
                        <button
                          key={index}
                          type="button"
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
                  )}
                </div>

                {/* Excel Upload */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <Table className="h-4 w-4 text-muted-foreground" />
                      Upload Student List (Excel) *
                    </label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={downloadExcelTemplate}
                      className="text-xs"
                    >
                      <Download className="h-3 w-3 mr-1" />
                      Download Template
                    </Button>
                  </div>

                  <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary transition-colors">
                    <input
                      type="file"
                      accept=".xlsx,.xls"
                      onChange={handleExcelUpload}
                      className="hidden"
                      id="excel-file"
                      disabled={loading}
                    />
                    <label htmlFor="excel-file" className="cursor-pointer flex flex-col items-center">
                      <Table className="h-12 w-12 text-muted-foreground mb-2" />
                      <p className="text-sm font-medium">
                        Click to upload Excel file
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Must contain &quot;name&quot; and &quot;email&quot; columns (Max 100 students)
                      </p>
                    </label>
                  </div>

                  {excelFile && (
                    <div className="mt-3 p-3 bg-secondary rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          <span className="text-sm font-medium">{excelFile.name}</span>
                          <Badge variant="secondary">{studentsData.length} students</Badge>
                        </div>
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      </div>
                    </div>
                  )}
                </div>

                {/* Students Preview Table */}
                {studentsData.length > 0 && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Students Preview</label>
                    <div className="border rounded-lg overflow-hidden">
                      <div className="max-h-64 overflow-y-auto">
                        <table className="w-full text-sm">
                          <thead className="bg-secondary sticky top-0">
                            <tr>
                              <th className="px-4 py-2 text-left">#</th>
                              <th className="px-4 py-2 text-left">Name</th>
                              <th className="px-4 py-2 text-left">Email</th>
                              {selectedTemplate && selectedTemplate.customPlaceholders && 
                               selectedTemplate.customPlaceholders.map((placeholder, idx) => (
                                placeholder.key && (
                                  <th key={idx} className="px-4 py-2 text-left capitalize">
                                    {placeholder.key.replace(/([A-Z])/g, ' $1').trim()}
                                  </th>
                                )
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {studentsData.map((student, index) => (
                              <tr key={index} className="border-t hover:bg-secondary/50">
                                <td className="px-4 py-2">{index + 1}</td>
                                <td className="px-4 py-2">{student.name}</td>
                                <td className="px-4 py-2 text-muted-foreground">{student.email || '-'}</td>
                                {selectedTemplate && selectedTemplate.customPlaceholders && 
                                 selectedTemplate.customPlaceholders.map((placeholder, idx) => (
                                  placeholder.key && (
                                    <td key={idx} className="px-4 py-2 text-muted-foreground">
                                      {student.customPlaceholderValues?.[placeholder.key] || '-'}
                                    </td>
                                  )
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {/* Email Option */}
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="sendBulkEmail"
                    checked={sendEmail}
                    onChange={(e) => setSendEmail(e.target.checked)}
                    disabled={loading}
                    className="rounded"
                  />
                  <label htmlFor="sendBulkEmail" className="text-sm text-muted-foreground">
                    Send certificate emails to all students
                  </label>
                </div>

                {/* Bulk Issue Button */}
                <Button
                  type="button"
                  onClick={handleBulkIssue}
                  disabled={
                    loading ||
                    !walletAddress ||
                    !selectedTemplate ||
                    studentsData.length === 0
                  }
                  className="w-full"
                  size="lg"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {bulkProgress.stage || 'Processing...'}
                      {bulkProgress.total > 0 && ` (${bulkProgress.current}/${bulkProgress.total})`}
                    </>
                  ) : (
                    <>
                      <Award className="mr-2 h-4 w-4" />
                      Issue {studentsData.length} Certificate{studentsData.length !== 1 ? 's' : ''} on BlockChain
                    </>
                  )}
                </Button>

                {/* Bulk Success Results */}
                {bulkResults && transactionStatus === "success" && (
                  <Card className="border-primary/50 bg-primary/5 shadow-lg">
                    <CardContent className="pt-6">
                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <div className="p-3 bg-primary rounded-full">
                            <CheckCircle className="h-8 w-8 text-primary-foreground" />
                          </div>
                          <div>
                            <h3 className="text-2xl font-bold text-primary">
                              {bulkResults.length} Certificates Issued Successfully! 🎉
                            </h3>
                            <p className="text-primary/80">
                              All certificates have been registered on the blockchain
                            </p>
                          </div>
                        </div>

                        <div className="bg-card rounded-lg p-4 space-y-3 border border-primary/20">
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
                              View on Etherscan <ExternalLink className="h-4 w-4" />
                            </a>
                          </div>

                          {/* Results Table */}
                          <div className="border rounded-lg overflow-hidden mt-4">
                            <div className="max-h-96 overflow-y-auto">
                              <table className="w-full text-sm">
                                <thead className="bg-secondary sticky top-0">
                                  <tr>
                                    <th className="px-4 py-2 text-left">Name</th>
                                    <th className="px-4 py-2 text-left">Certificate ID</th>
                                    <th className="px-4 py-2 text-left">Actions</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {bulkResults.map((result, index) => (
                                    <tr key={index} className="border-t hover:bg-secondary/50">
                                      <td className="px-4 py-2">{result.name}</td>
                                      <td className="px-4 py-2 font-mono">{result.certificateId}</td>
                                      <td className="px-4 py-2">
                                        <a
                                          href={getIPFSUrl(result.ipfsHash)}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-blue-600 hover:underline text-xs flex items-center gap-1"
                                        >
                                          View <ExternalLink className="h-3 w-3" />
                                        </a>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-3 pt-2">
                          <Button onClick={resetForm} variant="outline" className="flex-1">
                            Issue More Certificates
                          </Button>
                          <Button asChild className="flex-1">
                            <Link href="/my-certificates">View My Certificates</Link>
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Info */}
                <div className="text-sm text-muted-foreground space-y-1 pt-4 border-t">
                  <p className="font-semibold">How bulk issuance works:</p>
                  <ol className="list-decimal list-inside space-y-1 ml-2">
                    <li>Select a certificate template</li>
                    <li>Upload Excel file with student names and emails</li>
                    <li>System generates certificates for all students</li>
                    <li>All certificates are uploaded to IPFS</li>
                    <li>All certificates are issued in ONE blockchain transaction</li>
                    <li>Emails are sent to all students (if enabled)</li>
                  </ol>
                </div>
              </CardContent>
            </Card>
          ) : (
            // Original Single Certificate Form
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

                {/* Email */}
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    Student Email
                  </label>
                  <Input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Enter student's email address"
                    disabled={issuingOnChain}
                  />
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="sendEmail"
                      checked={sendEmail}
                      onChange={(e) => setSendEmail(e.target.checked)}
                      disabled={issuingOnChain}
                      className="rounded"
                    />
                    <label htmlFor="sendEmail" className="text-sm text-muted-foreground">
                      Send certificate email to student
                    </label>
                  </div>
                </div>

                {/* Custom Placeholder Fields */}
                {useTemplate && selectedTemplate && selectedTemplate.customPlaceholders && 
                 selectedTemplate.customPlaceholders.length > 0 && (
                  <div className="space-y-4">
                    <label className="text-sm font-medium">Custom Fields</label>
                    {selectedTemplate.customPlaceholders.map((placeholder, index) => (
                      placeholder.key && (
                        <div key={index} className="space-y-2">
                          <label className="text-sm text-muted-foreground capitalize">
                            {placeholder.key.replace(/([A-Z])/g, ' $1').trim()}
                          </label>
                          <Input
                            type="text"
                            value={formData.customPlaceholderValues?.[placeholder.key] || ''}
                            onChange={(e) => {
                              setFormData(prev => ({
                                ...prev,
                                customPlaceholderValues: {
                                  ...prev.customPlaceholderValues,
                                  [placeholder.key]: e.target.value
                                }
                              }));
                            }}
                            placeholder={`Enter ${placeholder.key}`}
                            disabled={issuingOnChain}
                          />
                        </div>
                      )
                    ))}
                  </div>
                )}

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
                              type="button"
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
                            width={CANVAS_WIDTH}
                            height={CANVAS_HEIGHT}
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
                  <Button
                    type="button"
                    onClick={handleIssueOnBlockchain}
                    disabled={
                      issuingOnChain ||
                      uploadingToIPFS ||
                      !walletAddress ||
                      !formData.studentName ||
                      (!selectedFile && (!useTemplate || !selectedTemplate))
                    }
                    className="flex-1"
                  >
                    {uploadingToIPFS ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Uploading to IPFS...
                      </>
                    ) : issuingOnChain ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {transactionStatus === "mining"
                          ? "Mining Transaction..."
                          : "Issuing..."}
                      </>
                    ) : (
                      <>
                        <Award className="mr-2 h-4 w-4" />
                        {ipfsHash ? "Issue on Blockchain" : "Upload & Issue on Blockchain"}
                      </>
                    )}
                  </Button>
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
          )}

          {/* Transaction Status */}
          {issuingOnChain && (
            <Card className="mb-6 border-primary/30 bg-linear-to-r from-primary/5 to-primary/10 shadow-lg">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-primary/10 rounded-full">
                    <Loader2 className="h-8 w-8 text-primary animate-spin" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-primary mb-1">
                      {transactionStatus === "pending" &&
                        "Waiting for confirmation..."}
                      {transactionStatus === "mining" &&
                        "Transaction submitted! Mining in progress..."}
                    </h3>
                    <p className="text-sm text-primary/80">
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
