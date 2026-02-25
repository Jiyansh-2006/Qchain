
import React, { createContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { ethers } from 'ethers';
import { WalletState, NFT } from '../types';
import { QTOKEN_CONTRACT_ADDRESS, QTOKEN_ABI, QUANTUMID_CONTRACT_ADDRESS, QUANTUMID_ABI } from '../constants/contracts';

interface WalletContextType extends WalletState {
    loading: boolean;
    connectWallet: () => Promise<void>;
    disconnectWallet: () => void;
    refreshBalance: () => Promise<void>;
}

const defaultState: WalletState = {
    provider: null,
    signer: null,
    address: null,
    network: null,
    qTokenBalance: '0',
    nfts: [],
};

export const WalletContext = createContext<WalletContextType>({
    ...defaultState,
    loading: false,
    connectWallet: async () => {},
    disconnectWallet: () => {},
    refreshBalance: async () => {},
});

export const WalletProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [wallet, setWallet] = useState<WalletState>(defaultState);
    const [loading, setLoading] = useState<boolean>(false);

    const fetchWalletData = useCallback(async (provider: ethers.BrowserProvider, signer: ethers.JsonRpcSigner, address: string) => {
        try {
            setLoading(true);
            const network = await provider.getNetwork();

            // For demo, we are assuming Polygon Amoy. In a real app, you'd check network.chainId.
            // if (network.chainId !== 80002n) {
            //     alert("Please switch to Polygon Amoy Testnet.");
            // }

            // Mock Data for UI demonstration since contracts are placeholders
            const qTokenBalance = (Math.random() * 10000).toFixed(4);
            
            const nfts: NFT[] = Array.from({ length: 3 }).map((_, i) => ({
                id: (i + 1).toString(),
                name: `QuantumID #${i + 1}`,
                description: `A unique and secure Quantum Identity token.`,
                image: `https://picsum.photos/seed/${address}${i}/300`,
            }));

            setWallet({
                provider,
                signer,
                address,
                network,
                qTokenBalance,
                nfts,
            });
        } catch (error) {
            console.error("Error fetching wallet data:", error);
        } finally {
            setLoading(false);
        }
    }, []);


    const connectWallet = async () => {
        // Fix: Property 'ethereum' does not exist on type 'Window & typeof globalThis'.
        if (typeof (window as any).ethereum === 'undefined') {
            alert("Please install MetaMask!");
            return;
        }

        try {
            setLoading(true);
            // Fix: Property 'ethereum' does not exist on type 'Window & typeof globalThis'.
            const provider = new ethers.BrowserProvider((window as any).ethereum);
            await provider.send("eth_requestAccounts", []);
            const signer = await provider.getSigner();
            const address = await signer.getAddress();
            await fetchWalletData(provider, signer, address);
        } catch (error) {
            console.error("Failed to connect wallet:", error);
            setLoading(false);
        }
    };

    const disconnectWallet = () => {
        setWallet(defaultState);
        // In a real app you might want to call a disconnect method from the wallet provider if available
    };

    const refreshBalance = useCallback(async () => {
      if (wallet.provider && wallet.signer && wallet.address) {
        await fetchWalletData(wallet.provider, wallet.signer, wallet.address);
      }
    }, [wallet.provider, wallet.signer, wallet.address, fetchWalletData]);


    useEffect(() => {
        const handleAccountsChanged = (accounts: string[]) => {
            if (accounts.length === 0) {
                disconnectWallet();
            } else if (wallet.address !== accounts[0]) {
                connectWallet();
            }
        };

        const handleChainChanged = () => {
            window.location.reload();
        };

        // Fix: Property 'ethereum' does not exist on type 'Window & typeof globalThis'.
        if ((window as any).ethereum) {
            (window as any).ethereum.on('accountsChanged', handleAccountsChanged);
            (window as any).ethereum.on('chainChanged', handleChainChanged);
        }

        return () => {
            // Fix: Property 'ethereum' does not exist on type 'Window & typeof globalThis'.
            if ((window as any).ethereum) {
                (window as any).ethereum.removeListener('accountsChanged', handleAccountsChanged);
                (window as any).ethereum.removeListener('chainChanged', handleChainChanged);
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [wallet.address]);

    return (
        <WalletContext.Provider value={{ ...wallet, loading, connectWallet, disconnectWallet, refreshBalance }}>
            {children}
        </WalletContext.Provider>
    );
};