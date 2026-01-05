'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Shield, Wallet, LogOut, Sun, Moon } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from 'next-themes';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { walletAddress, loading, signInWithEthereum, signOut } = useAuth();
  const { theme, setTheme } = useTheme();

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

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const navItems = [
    { name: 'Home', href: '/' },
    { name: 'Verify', href: '/verify' },
  ];

  const authenticatedItems = [
    { name: 'Create', href: '/create' },
    { name: 'Issued History', href: '/my-certificates' },
    { name: 'Templates', href: '/edit-template' },
  ];

  const aboutItem = { name: 'About', href: '/about' };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 group">
            <div className="relative">
              <Shield className="h-6 w-6 text-primary group-hover:scale-110 transition-transform" />
            </div>
            <span className="text-lg font-bold text-foreground">
              Conf<span className="text-primary">Cert</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-0.5">
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

            <Link href={aboutItem.href}>
              <Button variant="ghost" className="font-medium">
                {aboutItem.name}
              </Button>
            </Link>

            <a
              href="https://github.com/Shubhamk0174/confcert-blockchain"
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 rounded-lg hover:bg-accent transition-colors"
            >
              <Image
                src="/icons/icons8-github-64.png"
                alt="GitHub"
                width={24}
                height={24}
                className="transition-opacity dark:invert"
              />
            </a>
          </div>

          {/* Connect Wallet / User Menu */}
          <div className="hidden md:flex items-center gap-2">
            {loading ? (
              <div className="text-sm text-muted-foreground">Loading...</div>
            ) : walletAddress ? (
              <>
                <Badge variant="secondary" className="font-mono text-xs px-2 py-1">
                  <Wallet className="h-3 w-3 mr-1" />
                  {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                </Badge>
                <Button
                  onClick={signOut}
                  variant="outline"
                  size="sm"
                  className="gap-2 mr-10"
                >
                  <LogOut className="h-4 w-4 " />
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
            <Button
              onClick={toggleTheme}
              variant="ghost"
              size="sm"
              className="p-2"
            >
              <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>
            
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

              <Link href={aboutItem.href} onClick={() => setIsOpen(false)}>
                <Button variant="ghost" className="w-full justify-start">
                  {aboutItem.name}
                </Button>
              </Link>

              <div className="pt-2 border-t">
                <Button
                  onClick={toggleTheme}
                  variant="ghost"
                  className="w-full justify-start mb-2"
                >
                  <Sun className="h-4 w-4 mr-2 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                  <Moon className="absolute h-4 w-4 mr-2 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                  <span>Toggle theme</span>
                </Button>
                <a
                  href="https://github.com/Shubhamk0174/confcert-blockchain"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-accent transition-colors mb-2"
                >
                  <Image
                    src="/icons/icons8-github-64.png"
                    alt="GitHub"
                    width={20}
                    height={20}
                    className="opacity-75 dark:invert"
                  />
                  <span>GitHub</span>
                </a>
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
