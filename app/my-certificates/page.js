'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { motion } from 'framer-motion';
import { Award, Calendar, CheckCircle, ExternalLink, TrendingUp, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Alert, AlertDescription } from '../../components/ui/alert';
import Link from 'next/link';
import { getMyCertificates, getCertificate, connectWallet, getCurrentAccount, getEtherscanLink, getAddressLink, formatTimestamp } from '../../lib/web3';
import { getIPFSUrl } from '../../lib/ipfs';

export default function MyCertificates() {
  const { user } = useAuth();
  const [walletAddress, setWalletAddress] = useState(null);
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadCertificates();
  }, []);

  const loadCertificates = async () => {
    setLoading(true);
    setError('');

    try {
      // Check wallet connection
      let address = await getCurrentAccount();
      
      if (!address) {
        setWalletAddress(null);
        setLoading(false);
        return;
      }

      setWalletAddress(address);

      // Fetch certificate IDs
      const result = await getMyCertificates();
      
      if (!result.success) {
        setError(result.error);
        setLoading(false);
        return;
      }

      // Fetch full certificate details for each ID
      const certificatePromises = result.certificateIds.map(async (id) => {
        const certResult = await getCertificate(id);
        if (certResult.success) {
          return certResult.certificate;
        }
        return null;
      });

      const fetchedCerts = await Promise.all(certificatePromises);
      const validCerts = fetchedCerts.filter(cert => cert !== null);
      
      setCertificates(validCerts);
    } catch (err) {
      setError('Failed to load certificates: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleConnectWallet = async () => {
    setError('');
    const result = await connectWallet();
    if (result.success) {
      setWalletAddress(result.address);
      await loadCertificates();
    } else {
      setError(result.error);
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold mb-2">
              My Certificates
            </h1>
            <p className="text-muted-foreground">
              Certificates issued from your wallet
            </p>
            {walletAddress && (
              <Badge variant="secondary" className="mt-3 font-mono text-xs">
                {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
              </Badge>
            )}
          </div>

          {/* Wallet Connection */}
          {!walletAddress && (
            <Card className="mb-6 border-orange-200 bg-orange-50">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-orange-900">Connect Your Wallet</h3>
                    <p className="text-sm text-orange-700">Connect MetaMask to view your issued certificates</p>
                  </div>
                  <Button onClick={handleConnectWallet} variant="outline">
                    Connect Wallet
                  </Button>
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

          {/* Loading State */}
          {loading && walletAddress && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <Loader2 className="h-16 w-16 text-primary animate-spin mb-4" />
                <h3 className="text-xl font-semibold mb-2">Loading Certificates...</h3>
                <p className="text-muted-foreground">Fetching data from blockchain...</p>
              </CardContent>
            </Card>
          )}

          {/* Stats */}
          {!loading && walletAddress && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Issued</p>
                      <p className="text-3xl font-bold">{certificates.length}</p>
                    </div>
                    <Award className="h-10 w-10 text-primary opacity-20" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">On Blockchain</p>
                      <p className="text-3xl font-bold">{certificates.filter(c => c.exists).length}</p>
                    </div>
                    <CheckCircle className="h-10 w-10 text-green-600 opacity-20" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Latest ID</p>
                      <p className="text-3xl font-bold">
                        {certificates.length > 0 ? Math.max(...certificates.map(c => c.id)) : 0}
                      </p>
                    </div>
                    <TrendingUp className="h-10 w-10 text-blue-600 opacity-20" />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Certificates List */}
          {!loading && walletAddress && certificates.length === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <Award className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">No Certificates Yet</h3>
                <p className="text-muted-foreground mb-6 text-center">
                  You haven&apos;t issued any certificates yet. Create your first one!
                </p>
                <Link href="/create">
                  <Button>
                    <Award className="h-4 w-4 mr-2" />
                    Create Certificate
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}

          {!loading && certificates.length > 0 && (
            <div className="space-y-4">
              {certificates.map((cert, index) => (
                <motion.div
                  key={cert.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                >
                  <Card className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div className="flex-1 space-y-3">
                          <div className="flex items-start gap-4">
                            <div className="p-3 bg-primary/10 rounded-lg">
                              <Award className="h-6 w-6 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="text-lg font-semibold mb-1">
                                Certificate #{cert.id}
                              </h3>
                              <p className="text-sm text-muted-foreground mb-2">
                                Issued to: <span className="font-medium text-foreground">{cert.studentName}</span>
                              </p>
                              <div className="flex flex-wrap items-center gap-2">
                                <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-200">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Verified on Blockchain
                                </Badge>
                                <Badge variant="outline" className="font-mono text-xs">
                                  {cert.ipfsHash.slice(0, 10)}...
                                </Badge>
                              </div>
                              <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                                <Calendar className="h-4 w-4" />
                                <span>{formatTimestamp(cert.timestamp)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex flex-col gap-2 md:items-end">
                          <a
                            href={getIPFSUrl(cert.ipfsHash)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                          >
                            View Certificate <ExternalLink className="h-3 w-3" />
                          </a>
                          <a
                            href={getAddressLink(cert.issuer)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-muted-foreground hover:underline flex items-center gap-1 font-mono"
                          >
                            Issuer: {cert.issuer.slice(0, 6)}...{cert.issuer.slice(-4)}
                          </a>
                          <Link href={`/verify?id=${cert.id}`}>
                            <Button variant="outline" size="sm">
                              View Details
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
