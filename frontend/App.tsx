import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import MintNFT from './pages/MintNFT';
import Simulation from './pages/Simulation';
import TestConnection from './pages/TestConnection'; // Add this
import { useWallet } from './hooks/useWallet';
import TestTransactions from './pages/TestTransactions';
const App: React.FC = () => {
  const { address, isConnected } = useWallet();

const ProtectedRoute: React.FC<{ children: JSX.Element }> = ({ children }) => {
  const { isConnected } = useWallet();

  if (!isConnected) {
    return <Navigate to="/" replace />;
  }

  return children;
};


  return (
    <HashRouter>
      <div className="min-h-screen bg-dark-bg text-slate-200 font-sans">
        <Header />
        <main className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
          {isConnected ? (
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/transactions" element={<Transactions />} />
              <Route path="/mint" element={<MintNFT />} />
              <Route path="/simulation" element={<Simulation />} />
              <Route path="/test" element={<TestConnection />} /> {/* Add test route */}
              <Route path="*" element={<Navigate to="/dashboard" />} />
              <Route path="/test-transactions" element={<TestTransactions />} />
            </Routes>
          ) : (
            <WalletConnectPage />
          )}
        </main>
      </div>
    </HashRouter>
  );
};

const WalletConnectPage: React.FC = () => {
    const { connectWallet, isLoading } = useWallet();
    return (
        <div className="flex flex-col items-center justify-center min-h-[70vh] text-center animate-fade-in">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-brand-primary to-brand-secondary text-transparent bg-clip-text">Welcome to Q-Chain</h1>
            <p className="text-slate-400 mb-8 max-w-md">The future of secure, quantum-resilient blockchain technology. Connect your wallet to begin.</p>
            <button
                onClick={connectWallet}
                disabled={isLoading}
                className="px-8 py-3 bg-gradient-to-r from-brand-primary to-brand-secondary text-white font-bold rounded-lg shadow-lg hover:scale-105 transform transition-transform duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isLoading ? 'Connecting...' : 'Connect MetaMask Wallet'}
            </button>
            <div className="mt-8 p-4 bg-dark-card/50 rounded-lg max-w-md">
                <h3 className="text-lg font-semibold text-white mb-2">Quick Setup Guide</h3>
                <ol className="text-left text-slate-400 space-y-2">
                    <li className="flex items-start">
                        <span className="text-brand-primary mr-2">1.</span>
                        <span>Run Hardhat node: <code className="bg-dark-bg px-2 py-1 rounded text-xs">npx hardhat node</code></span>
                    </li>
                    <li className="flex items-start">
                        <span className="text-brand-primary mr-2">2.</span>
                        <span>Connect MetaMask to Localhost 8545 (Chain ID: 31337)</span>
                    </li>
                    <li className="flex items-start">
                        <span className="text-brand-primary mr-2">3.</span>
                        <span>Import test account for ETH</span>
                    </li>
                </ol>
            </div>
        </div>
    );
};

export default App;