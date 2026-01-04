'use client';

import { createContext, useContext, useEffect, useState } from 'react';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [walletAddress, setWalletAddress] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for connected Ethereum wallet on mount
    const checkWalletConnection = async () => {
      // Check if user intentionally disconnected
      const isDisconnected = localStorage.getItem('wallet_disconnected') === 'true';
      
      if (isDisconnected) {
        console.log('User previously disconnected wallet');
        setLoading(false);
        return;
      }
      
      // Wait a bit for wallet providers to be injected
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Check Ethereum wallet (MetaMask, etc.)
      if (typeof window.ethereum !== 'undefined') {
        try {
          const accounts = await window.ethereum.request({ 
            method: 'eth_accounts' 
          });
          if (accounts && accounts.length > 0) {
            console.log('Ethereum wallet connected:', accounts[0]);
            setWalletAddress(accounts[0]);
          }
        } catch (error) {
          console.log('Error checking Ethereum wallet:', error);
        }
      }
      
      setLoading(false);
    };

    checkWalletConnection();

    // Listen for MetaMask account changes
    if (typeof window.ethereum !== 'undefined') {
      const handleAccountsChanged = (accounts) => {
        console.log('MetaMask accounts changed:', accounts);
        if (accounts.length > 0) {
          setWalletAddress(accounts[0]);
        } else {
          setWalletAddress(null);
        }
      };

      const handleChainChanged = () => {
        // Reload the page when chain changes
        window.location.reload();
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);

      return () => {
        if (window.ethereum.removeListener) {
          window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
          window.ethereum.removeListener('chainChanged', handleChainChanged);
        }
      };
    }
  }, []);

  const signInWithEthereum = async () => {
    try {
      if (typeof window.ethereum === 'undefined') {
        throw new Error('No Ethereum wallet found. Please install MetaMask or another Web3 wallet.');
      }

      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });

      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts found in wallet');
      }

      console.log('Ethereum accounts:', accounts);
      setWalletAddress(accounts[0]);
      
      // Clear disconnected flag when user connects
      localStorage.removeItem('wallet_disconnected');

      return { data: { address: accounts[0] }, error: null };
    } catch (error) {
      console.error('Error connecting Ethereum wallet:', error);
      return { data: null, error };
    }
  };

  const signOut = async () => {
    try {
      // Try to revoke permissions if supported (opens MetaMask)
      if (typeof window.ethereum !== 'undefined' && window.ethereum.request) {
        try {
          await window.ethereum.request({
            method: 'wallet_revokePermissions',
            params: [{ eth_accounts: {} }],
          });
        } catch (error) {
          // wallet_revokePermissions might not be supported, try alternative method
          console.log('wallet_revokePermissions not supported, trying alternative...');
          
          // Try to request permissions again to open MetaMask
          try {
            await window.ethereum.request({
              method: 'eth_requestAccounts',
            });
          } catch (altError) {
            console.log('Could not trigger MetaMask to open for disconnection');
          }
        }
      }
    } catch (error) {
      console.log('Error during wallet disconnection:', error);
    }

    // Clear wallet address from state
    setWalletAddress(null);
    // Set flag to prevent auto-reconnect on reload
    localStorage.setItem('wallet_disconnected', 'true');
    console.log('Wallet disconnected from app');
  };

  const value = {
    walletAddress,
    loading,
    signInWithEthereum,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
