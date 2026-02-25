// services/quantumService.ts

export interface QuantumSignature {
  signature: string;
  algorithm: string;
  transaction_hash: string;
  timestamp: string;
  wallet_id: string;
}

export interface QuantumWallet {
  wallet_id: string;
  kyber_public_key: string;
  dilithium_public_key: string;
  security: {
    encryption: string;
    signature: string;
    created_at: string;
  };
}

class QuantumService {
  private baseUrl = 'http://localhost:8002';
  private static instance: QuantumService;

  static getInstance(): QuantumService {
    if (!QuantumService.instance) {
      QuantumService.instance = new QuantumService();
    }
    return QuantumService.instance;
  }

  /**
   * Check if quantum service is running
   */
  async checkHealth(): Promise<boolean> {
    try {
      console.log('🔍 Checking quantum service health...');
      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        mode: 'cors'
      });
      
      if (!response.ok) {
        console.log('❌ Health check failed with status:', response.status);
        return false;
      }
      
      const data = await response.json();
      console.log('✅ Health check response:', data);
      return data.status === 'healthy';
    } catch (error) {
      console.error('❌ Health check error:', error);
      return false;
    }
  }

  /**
   * Generate a new quantum wallet
   */
  async generateWallet(): Promise<QuantumWallet> {
    try {
      console.log('🔑 Generating quantum wallet...');
      const response = await fetch(`${this.baseUrl}/generate-wallet`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        mode: 'cors',
        body: JSON.stringify({
          security_level: 'Kyber768',
          signature_level: 'Dilithium2'
        })
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to generate wallet: ${error}`);
      }

      const wallet = await response.json();
      console.log('✅ Wallet generated:', wallet.wallet_id);
      return wallet;
    } catch (error) {
      console.error('❌ Generate wallet error:', error);
      throw error;
    }
  }

  /**
   * Sign a transaction using PQC
   */
  async signTransaction(walletId: string, amount: number, to: string): Promise<QuantumSignature> {
    try {
      const transaction = {
        amount: amount,
        to: to,
        nonce: Date.now(),
        timestamp: new Date().toISOString()
      };

      const requestBody = {
        wallet_id: walletId,
        transaction: transaction,
        algorithm: "pqc"
      };

      console.log('📤 Signing transaction request:', JSON.stringify(requestBody, null, 2));

      const response = await fetch(`${this.baseUrl}/sign`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        mode: 'cors',
        body: JSON.stringify(requestBody)
      });

      console.log('📡 Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Error response:', errorText);
        
        let errorMessage = 'Signing failed';
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.detail || errorJson.message || errorText;
        } catch {
          errorMessage = errorText;
        }
        
        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log('✅ Signing successful:', result);
      
      return {
        signature: result.signature,
        algorithm: result.algorithm,
        transaction_hash: result.transaction_hash,
        timestamp: result.timestamp,
        wallet_id: result.wallet_id
      };
    } catch (error) {
      console.error('❌ Sign transaction error:', error);
      throw error;
    }
  }

  /**
   * Get wallet by ID
   */
  async getWallet(walletId: string): Promise<QuantumWallet | null> {
    try {
      const response = await fetch(`${this.baseUrl}/wallets/${walletId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        mode: 'cors'
      });

      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(`Failed to get wallet: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('❌ Get wallet error:', error);
      return null;
    }
  }
}

export const quantumService = QuantumService.getInstance();