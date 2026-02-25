import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useWallet } from '../hooks/useWallet';

const Header: React.FC = () => {
    const { address, disconnectWallet } = useWallet();
    const location = useLocation();

    const navItems = [
        { path: '/dashboard', label: 'Dashboard' },
        { path: '/transactions', label: 'Transactions' },
        { path: '/mint', label: 'Mint NFT' },
        { path: '/simulation', label: 'Simulation' },
    ];

    const formatAddress = (address: string) => {
        return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
    };

    return (
        <header className="bg-dark-card border-b border-dark-border">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Logo */}
                    <div className="flex items-center">
                        <Link to="/" className="flex items-center space-x-2">
                            <div className="w-8 h-8 bg-gradient-to-r from-brand-primary to-brand-secondary rounded-lg flex items-center justify-center">
                                <span className="text-white font-bold text-sm">Q</span>
                            </div>
                            <span className="text-xl font-bold text-white">Q-Chain</span>
                        </Link>
                    </div>

                    {/* Navigation */}
                    <nav className="hidden md:flex space-x-8">
                        {navItems.map((item) => (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                                    location.pathname === item.path
                                        ? 'text-brand-primary bg-brand-primary/10'
                                        : 'text-slate-400 hover:text-white hover:bg-dark-bg'
                                }`}
                            >
                                {item.label}
                            </Link>
                        ))}
                    </nav>

                    {/* Wallet Connection */}
                    <div className="flex items-center space-x-4">
                        {address ? (
                            <>
                                <div className="flex items-center space-x-3">
                                    <div className="hidden sm:block px-3 py-1.5 bg-dark-bg rounded-full border border-dark-border">
                                        <span className="text-sm font-medium text-slate-300">
                                            {formatAddress(address)}
                                        </span>
                                    </div>
                                    <button
                                        onClick={disconnectWallet}
                                        className="px-4 py-1.5 text-sm font-medium text-white bg-gradient-to-r from-red-500 to-red-600 rounded-lg hover:opacity-90 transition-opacity"
                                    >
                                        Disconnect
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div className="text-sm text-slate-400">
                                Connect Wallet to Begin
                            </div>
                        )}
                    </div>
                </div>

                {/* Mobile Navigation */}
                <div className="md:hidden py-4 border-t border-dark-border">
                    <div className="flex space-x-4 overflow-x-auto">
                        {navItems.map((item) => (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`px-3 py-2 text-sm font-medium whitespace-nowrap rounded-md ${
                                    location.pathname === item.path
                                        ? 'text-brand-primary bg-brand-primary/10'
                                        : 'text-slate-400 hover:text-white hover:bg-dark-bg'
                                }`}
                            >
                                {item.label}
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;