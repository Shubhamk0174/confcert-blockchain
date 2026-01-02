'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Shield, Wallet, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { walletAddress, loading, signInWithEthereum, signOut } = useAuth();

  const handleWalletConnect = async () => {
    try {
      const { error } = await signInWithEthereum();
      if (error) {
        alert(error.message || 'Failed to connect with Ethereum wallet');
      }
    } catch (error) {
      console.error('Connection error:', error);
      alert('Failed to connect wallet. Please try again.');
    }
  };

  const navItems = [
    { name: 'Home', href: '/' },
    { name: 'Verify', href: '/verify' },
    { name: 'About', href: '/about' },
  ];

  const authenticatedItems = [
    { name: 'Create Certificate', href: '/create' },
    { name: 'My Certificates', href: '/my-certificates' },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 group">
            <div className="relative">
              <Shield className="h-7 w-7 text-primary group-hover:scale-110 transition-transform" />
            </div>
            <span className="text-xl font-bold text-foreground">
              Conf<span className="text-primary">Cert</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => (
              <Link key={item.name} href={item.href}>
                <Button variant="ghost" className="font-medium">
                  {item.name}
                </Button>
              </Link>
            ))}
            
            {walletAddress && authenticatedItems.map((item) => (
              <Link key={item.name} href={item.href}>
                <Button variant="ghost" className="font-medium">
                  {item.name}
                </Button>
              </Link>
            ))}
          </div>

          {/* Connect Wallet / User Menu */}
          <div className="hidden md:flex items-center gap-3">
            {loading ? (
              <div className="text-sm text-muted-foreground">Loading...</div>
            ) : walletAddress ? (
              <>
                <Badge variant="secondary" className="font-mono text-xs px-3 py-1.5">
                  <Wallet className="h-3 w-3 mr-1.5" />
                  {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                </Badge>
                <Button
                  onClick={signOut}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                >
                  <LogOut className="h-4 w-4" />
                  Disconnect
                </Button>
              </>
            ) : (
              <Button
                onClick={handleWalletConnect}
                className="gap-2"
              >
                <Wallet className="h-4 w-4" />
                Connect Wallet
              </Button>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-accent transition-colors"
          >
            {isOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden overflow-hidden border-t bg-background"
          >
            <div className="px-4 py-4 space-y-2">
              {navItems.map((item) => (
                <Link key={item.name} href={item.href} onClick={() => setIsOpen(false)}>
                  <Button variant="ghost" className="w-full justify-start">
                    {item.name}
                  </Button>
                </Link>
              ))}
              
              {walletAddress && authenticatedItems.map((item) => (
                <Link key={item.name} href={item.href} onClick={() => setIsOpen(false)}>
                  <Button variant="ghost" className="w-full justify-start">
                    {item.name}
                  </Button>
                </Link>
              ))}

              <div className="pt-2 border-t">
                {walletAddress ? (
                  <>
                    <Badge variant="secondary" className="w-full justify-start font-mono mb-2">
                      <Wallet className="h-3 w-3 mr-2" />
                      {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                    </Badge>
                    <Button
                      onClick={() => {
                        signOut();
                        setIsOpen(false);
                      }}
                      variant="outline"
                      className="w-full"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Disconnect
                    </Button>
                  </>
                ) : (
                  <Button
                    onClick={() => {
                      handleWalletConnect();
                      setIsOpen(false);
                    }}
                    className="w-full"
                  >
                    <Wallet className="h-4 w-4 mr-2" />
                    Connect Wallet
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
