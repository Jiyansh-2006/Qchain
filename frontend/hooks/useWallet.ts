// hooks/useWallet.ts
import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';

// Declare global ethereum
declare global {
    interface Window {
        ethereum?: any;
    }
}

// Basic ERC20 ABI (just the methods we need)
const ERC20_ABI = [
    "function name() view returns (string)",
    "function symbol() view returns (string)",
    "function decimals() view returns (uint8)",
    "function totalSupply() view returns (uint256)",
    "function balanceOf(address) view returns (uint256)",
    "function transfer(address to, uint256 amount) returns (bool)",
    "function transferFrom(address from, address to, uint256 amount) returns (bool)",
    "function approve(address spender, uint256 amount) returns (bool)",
    "function allowance(address owner, address spender) view returns (uint256)",
    "event Transfer(address indexed from, address indexed to, uint256 value)",
    "event Approval(address indexed owner, address indexed spender, uint256 value)"
];

// Add PQC method if your contract has it
const QTOKEN_ABI = [
    ...ERC20_ABI,
    "function transferWithPQC(address to, uint256 amount) returns (bool)"
];

// Contract addresses (adjust based on your deployment)
const CONTRACT_ADDRESSES: { [chainId: number]: string } = {
    31337: '0x5FbDB2315678afecb367f032d93F642f64180aa3', // Default Hardhat localhost
    // 31337: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512', // Alternative localhost
};

// Test accounts data (from your hardhat node)
export const TEST_ACCOUNTS = [
    { address: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266', name: 'Account #0' },
    { address: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8', name: 'Account #1' },
    { address: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC', name: 'Account #2' },
    { address: '0x90F79bf6EB2c4f870365E785982E1f101E93b906', name: 'Account #3' },
    { address: '0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65', name: 'Account #4' },
    { address: '0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc', name: 'Account #5' },
    { address: '0x976EA74026E726554dB657fA54763abd0C3a0aa9', name: 'Account #6' },
    { address: '0x14dC79964da2C08b23698B3D3cc7Ca32193d9955', name: 'Account #7' },
    { address: '0x23618e81E3f5cdF7f54C3d65f7FBc0aBf5B21E8f', name: 'Account #8' },
    { address: '0xa0Ee7A142d267C1f36714E4a8F75612F20a79720', name: 'Account #9' },
    { address: '0xBcd4042DE499D14e55001CcbB24a551F3b954096', name: 'Account #10' },
    { address: '0x71bE63f3384f5fb98995898A86B02Fb2426c5788', name: 'Account #11' },
    { address: '0xFABB0ac9d68B0B445fB7357272Ff202C5651694a', name: 'Account #12' },
    { address: '0x1CBd3b2770909D4e10f157cABC84C7264073C9Ec', name: 'Account #13' },
    { address: '0xdF3e18d64BC6A983f673Ab319CCaE4f1a57C7097', name: 'Account #14' },
    { address: '0xcd3B766CCDd6AE721141F452C550Ca635964ce71', name: 'Account #15' },
    { address: '0x2546BcD3c84621e976D8185a91A922aE77ECEc30', name: 'Account #16' },
    { address: '0xbDA5747bFD65F08deb54cb465eB87D40e51B197E', name: 'Account #17' },
    { address: '0xdD2FD4581271e230360230F9337D5c0430Bf44C0', name: 'Account #18' },
    { address: '0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199', name: 'Account #19' }
];

export const useWallet = () => {
    // State
    const [address, setAddress] = useState<string>('');
    const [signer, setSigner] = useState<ethers.Signer | null>(null);
    const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
    const [network, setNetwork] = useState<any>(null);
    const [balance, setBalance] = useState({ 
        native: '0', 
        qToken: '0' 
    });
    const [isConnected, setIsConnected] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string>('');

    // Check if MetaMask is installed
    const isMetaMaskInstalled = (): boolean => {
        return typeof window !== 'undefined' && !!window.ethereum;
    };

    // Get contract address for current network
    const getContractAddress = (chainId: number): string | null => {
        return CONTRACT_ADDRESSES[chainId] || null;
    };

    // Connect wallet
    const connectWallet = async (): Promise<boolean> => {
        if (!isMetaMaskInstalled()) {
            setError('Please install MetaMask to continue');
            return false;
        }

        try {
            setIsLoading(true);
            setError('');

            // Request account access
            const web3Provider = new ethers.BrowserProvider(window.ethereum);
            const accounts = await web3Provider.send('eth_requestAccounts', []);
            
            if (!accounts || accounts.length === 0) {
                throw new Error('No accounts found');
            }

            const signer = await web3Provider.getSigner();
            const address = await signer.getAddress();
            const networkInfo = await web3Provider.getNetwork();
            const chainId = Number(networkInfo.chainId);
            
            // Get network info
            const network = {
                name: networkInfo.name,
                chainId: chainId,
                explorer: getExplorerUrl(chainId)
            };

            // Get balances
            const nativeBalance = await web3Provider.getBalance(address);
            const qTokenBalance = await getQTokenBalance(web3Provider, address, chainId);

            // Update state
            setAddress(address);
            setSigner(signer);
            setProvider(web3Provider);
            setNetwork(network);
            setBalance({
                native: ethers.formatEther(nativeBalance),
                qToken: qTokenBalance
            });
            setIsConnected(true);
            
            console.log('✅ Wallet connected:', address);
            console.log('📊 Balance:', qTokenBalance, 'QTOK');
            console.log('🔗 Network:', network);
            
            return true;

        } catch (err: any) {
            console.error('❌ Wallet connection failed:', err);
            setError(err.message || 'Failed to connect wallet');
            return false;
        } finally {
            setIsLoading(false);
        }
    };

    // Get QToken balance for any address
    const getQTokenBalance = async (
        provider: ethers.BrowserProvider,
        address: string,
        chainId: number
    ): Promise<string> => {
        try {
            const contractAddress = getContractAddress(chainId);
            if (!contractAddress) {
                console.warn(`⚠️ No QToken contract on chain ${chainId}`);
                return '0';
            }

            console.log(`📞 Getting balance from contract: ${contractAddress} for address: ${address}`);
            
            const contract = new ethers.Contract(
                contractAddress, 
                QTOKEN_ABI, 
                provider
            );
            
            const balance = await contract.balanceOf(address);
            // Assuming 18 decimals for QToken
            const formattedBalance = ethers.formatUnits(balance, 18);
            
            console.log(`💰 Balance for ${address}: ${formattedBalance} QTOK`);
            return formattedBalance;
            
        } catch (error: any) {
            console.error('❌ Error getting QToken balance:', error);
            return '0';
        }
    };

    // Get test account balance
    const getTestAccountBalance = async (
        accountAddress: string
    ): Promise<string> => {
        if (!provider || !network) {
            console.warn('⚠️ Provider or network not available');
            return '0';
        }

        try {
            return await getQTokenBalance(provider, accountAddress, network.chainId);
        } catch (error) {
            console.error(`❌ Error getting balance for ${accountAddress}:`, error);
            return '0';
        }
    };

    // Get all test account balances
    const getAllTestAccountBalances = async (): Promise<Array<{ 
        address: string; 
        name: string; 
        balance: string 
    }>> => {
        if (!provider || !network) {
            console.warn('⚠️ Provider or network not available');
            return TEST_ACCOUNTS.map(acc => ({ ...acc, balance: '0' }));
        }

        const balances = [];
        
        for (const account of TEST_ACCOUNTS) {
            try {
                const balance = await getQTokenBalance(provider, account.address, network.chainId);
                balances.push({
                    ...account,
                    balance: parseFloat(balance).toFixed(4)
                });
            } catch (error) {
                console.error(`Error getting balance for ${account.address}:`, error);
                balances.push({
                    ...account,
                    balance: '0'
                });
            }
        }
        
        console.log('✅ Loaded all test account balances');
        return balances;
    };

    // Refresh all balances
    const refreshBalance = async (): Promise<void> => {
        if (!provider || !address || !network) {
            console.log('Cannot refresh: provider, address, or network missing');
            return;
        }

        try {
            console.log('🔄 Refreshing balances...');
            const nativeBalance = await provider.getBalance(address);
            const qTokenBalance = await getQTokenBalance(provider, address, network.chainId);

            console.log(`✅ Refreshed - ETH: ${ethers.formatEther(nativeBalance)}, QTOK: ${qTokenBalance}`);
            
            setBalance({
                native: ethers.formatEther(nativeBalance),
                qToken: qTokenBalance
            });
        } catch (error: any) {
            console.error('❌ Error refreshing balance:', error);
        }
    };

    // Send QToken
    const sendQToken = async (
        toAddress: string, 
        amount: string, 
        isPqc: boolean = false
    ): Promise<any> => {
        if (!signer || !address) {
            throw new Error('Wallet not connected');
        }

        // Validate address
        if (!ethers.isAddress(toAddress)) {
            throw new Error('Invalid recipient address');
        }

        // Validate amount
        const amountNum = parseFloat(amount);
        if (isNaN(amountNum) || amountNum <= 0) {
            throw new Error('Invalid amount');
        }

        // Check balance
        const qTokenBalanceNum = parseFloat(balance.qToken);
        if (amountNum > qTokenBalanceNum) {
            throw new Error(`Insufficient balance. You have ${balance.qToken} QTOK`);
        }

        try {
            setIsLoading(true);
            setError('');

            const contractAddress = getContractAddress(network?.chainId || 31337);
            if (!contractAddress) {
                throw new Error('QToken contract not deployed on this network');
            }

            console.log(`📤 Sending ${amount} QTOK to ${toAddress}...`);
            console.log(`📝 Contract: ${contractAddress}`);
            console.log(`🛡️ PQC Enabled: ${isPqc}`);
            
            const contract = new ethers.Contract(
                contractAddress,
                QTOKEN_ABI,
                signer
            );

            // Convert amount to wei (18 decimals)
            const amountInWei = ethers.parseUnits(amount, 18);
            console.log(`🔢 Amount in wei: ${amountInWei}`);
            
            let tx;
            if (isPqc) {
                try {
                    // Try PQC method first
                    tx = await contract.transferWithPQC(toAddress, amountInWei);
                    console.log('🛡️ Using PQC transfer');
                } catch (pqcError) {
                    console.log('⚠️ PQC method not available, using standard transfer');
                    tx = await contract.transfer(toAddress, amountInWei);
                }
            } else {
                tx = await contract.transfer(toAddress, amountInWei);
                console.log('⚡ Using standard transfer');
            }

            console.log('✅ Transaction sent! Hash:', tx.hash);

            // Wait for transaction to be mined
            const receipt = await tx.wait();
            console.log('✅ Transaction confirmed in block:', receipt.blockNumber);

            // Return transaction details
            return {
                hash: tx.hash,
                success: true,
                receipt: receipt,
                from: address,
                to: toAddress,
                amount: amount
            };

        } catch (err: any) {
            console.error('❌ Transaction failed:', err);
            
            let errorMsg = 'Transaction failed';
            if (err.code === 'ACTION_REJECTED') {
                errorMsg = 'Transaction rejected by user';
            } else if (err.message?.includes('insufficient funds')) {
                errorMsg = 'Insufficient balance for gas';
            } else if (err.message?.includes('execution reverted')) {
                // Try to get the revert reason
                try {
                    const data = err.data;
                    if (data) {
                        const reason = ethers.toUtf8String('0x' + data.substring(138));
                        errorMsg = `Transaction reverted: ${reason}`;
                    } else {
                        errorMsg = 'Transaction reverted by contract';
                    }
                } catch {
                    errorMsg = 'Transaction reverted by contract';
                }
            } else if (err.message?.includes('wrong chain id')) {
                errorMsg = 'Wrong network. Please switch to localhost (31337)';
            } else if (err.message?.includes('invalid address')) {
                errorMsg = 'Invalid recipient address';
            } else if (err.message) {
                errorMsg = err.message;
            }
            
            console.error('Error details:', err);
            setError(errorMsg);
            throw new Error(errorMsg);
        } finally {
            setIsLoading(false);
        }
    };

    // Batch send QToken to multiple accounts
    const batchSendQTokens = async (
        recipients: Array<{ address: string; amount: string }>,
        isPqc: boolean = false
    ): Promise<Array<{ success: boolean; hash?: string; error?: string }>> => {
        const results = [];
        
        for (const recipient of recipients) {
            try {
                console.log(`📦 Batch sending ${recipient.amount} QTOK to ${recipient.address}`);
                const result = await sendQToken(recipient.address, recipient.amount, isPqc);
                results.push({ success: true, hash: result.hash });
                
                // Wait a bit between transactions
                await new Promise(resolve => setTimeout(resolve, 2000));
            } catch (error: any) {
                results.push({ success: false, error: error.message });
                console.error(`❌ Batch send failed for ${recipient.address}:`, error);
            }
        }
        
        // Refresh balance after all transactions
        await refreshBalance();
        
        return results;
    };

    // Send test transactions to multiple accounts
    const sendTestTransactions = async (): Promise<any> => {
        // Send to first 5 accounts with different amounts
        const testRecipients = [
            { address: TEST_ACCOUNTS[1].address, amount: '10' },   // Account #1: 10 QTOK
            { address: TEST_ACCOUNTS[2].address, amount: '25' },   // Account #2: 25 QTOK
            { address: TEST_ACCOUNTS[3].address, amount: '50' },   // Account #3: 50 QTOK
            { address: TEST_ACCOUNTS[4].address, amount: '100' },  // Account #4: 100 QTOK
            { address: TEST_ACCOUNTS[5].address, amount: '200' },  // Account #5: 200 QTOK
        ];

        console.log('🚀 Starting test transactions...');
        return await batchSendQTokens(testRecipients, false);
    };

    // Get explorer URL
    const getExplorerUrl = (chainId: number): string => {
        switch (chainId) {
            case 31337: // Localhost
                return 'http://localhost:8545';
            case 11155111: // Sepolia
                return 'https://sepolia.etherscan.io';
            case 1: // Mainnet
                return 'https://etherscan.io';
            default:
                return '';
        }
    };

    // Format address
    const formatAddress = (addr: string, start: number = 6, end: number = 4): string => {
        if (!addr) return '';
        if (addr.length <= start + end) return addr;
        return `${addr.substring(0, start)}...${addr.substring(addr.length - end)}`;
    };

    // Get account name by address
    const getAccountName = (addr: string): string => {
        const account = TEST_ACCOUNTS.find(acc => 
            acc.address.toLowerCase() === addr.toLowerCase()
        );
        return account ? account.name : formatAddress(addr);
    };

    // Disconnect wallet
    const disconnectWallet = (): void => {
        setAddress('');
        setSigner(null);
        setProvider(null);
        setNetwork(null);
        setBalance({ native: '0', qToken: '0' });
        setIsConnected(false);
        console.log('🔌 Wallet disconnected');
    };

    // Switch to a different test account
    const switchToTestAccount = async (accountIndex: number): Promise<boolean> => {
        if (!isMetaMaskInstalled() || accountIndex >= TEST_ACCOUNTS.length) {
            return false;
        }

        try {
            setIsLoading(true);
            
            // Request to switch account
            await window.ethereum.request({
                method: 'wallet_requestPermissions',
                params: [{
                    eth_accounts: {}
                }]
            });
            
            // Now connect wallet - it will pick up the new account
            return await connectWallet();
            
        } catch (err: any) {
            console.error('❌ Error switching account:', err);
            setError(err.message || 'Failed to switch account');
            return false;
        } finally {
            setIsLoading(false);
        }
    };

    // Event listeners
    useEffect(() => {
        if (!isMetaMaskInstalled()) return;

        const handleAccountsChanged = (accounts: string[]) => {
            console.log('Accounts changed:', accounts);
            if (accounts.length === 0) {
                disconnectWallet();
            } else if (accounts[0] !== address) {
                connectWallet();
            }
        };

        const handleChainChanged = (chainId: string) => {
            console.log('Chain changed:', chainId);
            window.location.reload();
        };

        window.ethereum.on('accountsChanged', handleAccountsChanged);
        window.ethereum.on('chainChanged', handleChainChanged);

        return () => {
            window.ethereum?.removeListener('accountsChanged', handleAccountsChanged);
            window.ethereum?.removeListener('chainChanged', handleChainChanged);
        };
    }, [address]);

    // Auto-connect on mount
    useEffect(() => {
        const autoConnect = async () => {
            if (!isMetaMaskInstalled()) return;
            
            try {
                console.log('🔍 Auto-connecting wallet...');
                const provider = new ethers.BrowserProvider(window.ethereum);
                const accounts = await provider.send('eth_accounts', []);
                
                if (accounts.length > 0) {
                    console.log('🔗 Found existing connection');
                    await connectWallet();
                } else {
                    console.log('🔗 No existing connection found');
                }
            } catch (error) {
                console.error('❌ Auto-connect failed:', error);
            }
        };

        autoConnect();
    }, []);

    return {
        // State
        address,
        signer,
        provider,
        network,
        balance,
        isConnected,
        isLoading,
        error,
        
        // Balances (for easy access)
        qTokenBalance: balance.qToken,
        nativeBalance: balance.native,
        
        // Test accounts
        TEST_ACCOUNTS,
        
        // Actions
        connectWallet,
        disconnectWallet,
        refreshBalance,
        sendQToken,
        batchSendQTokens,
        sendTestTransactions,
        switchToTestAccount,
        
        // Balance functions
        getTestAccountBalance,
        getAllTestAccountBalances,
        
        // Utilities
        isMetaMaskInstalled,
        formatAddress,
        getAccountName,
        getExplorerUrl: () => getExplorerUrl(network?.chainId || 31337)
    };
};