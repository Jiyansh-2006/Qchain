// services/quantumZKPService.ts

export interface CryptanalysisMetrics {
  entropy_score: number;
  timing_leak_score: number;
  pattern_match: number;
  signature_strength: number;
  nonce_reuse_risk: number;
  timestamp_drift: number;
}

export interface CryptanalysisResult {
  secure: boolean;
  risk: 'low' | 'medium' | 'high';
  risk_score: number;
  issues: string[];
  metrics: CryptanalysisMetrics;
  recommendations: string[];
  timestamp_analysis: {
    expected_delay: number;
    actual_delay: number;
    variance: number;
    is_suspicious: boolean;
  };
}

export interface ZKPAttribute {
  name: string;
  value: string | number;
  verified: boolean;
  proof: string;
  public_inputs?: Record<string, any>;
  circuit_type?: string;
}

export interface ZKPVerification {
  verified: boolean;
  proof_id: string;
  timestamp: number;
  attributes: ZKPAttribute[];
  overall_score: number;
  validation_method: string;
  circuit?: {
    name: string;
    constraints: number;
    proving_time_ms: number;
    verification_time_ms: number;
  };
}

export interface PqcSignature {
  signature: string;
  algorithm: string;
  pqc: boolean;
  transaction_hash: string;
  cryptanalysis: CryptanalysisResult;
  zkp_verification?: ZKPVerification;
  status: 'success' | 'warning' | 'error';
  timestamp: string;
  wallet_id: string;
}

export interface SignWithZKPOptions {
  wallet_id: string;
  transaction: {
    amount: number;
    to: string;
    from?: string;
    nonce: number;
    timestamp: string;
  };
  algorithm?: 'pqc' | 'ecdsa';
  zkp?: {
    enable?: boolean;
    attributes?: string[];
    circuit_type?: 'merkle' | 'sha256' | 'pedersen';
    public_inputs?: Record<string, any>;
  };
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

class QuantumZKPService {
  private baseUrl = 'http://localhost:8002';
  private static instance: QuantumZKPService;

  static getInstance(): QuantumZKPService {
    if (!QuantumZKPService.instance) {
      QuantumZKPService.instance = new QuantumZKPService();
    }
    return QuantumZKPService.instance;
  }

  /**
   * Check service health
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
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
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
      console.log('✅ Wallet generated:', wallet);
      return wallet;
    } catch (error) {
      console.error('❌ Generate wallet error:', error);
      throw error;
    }
  }

  /**
   * Sign a transaction with ZKP
   */
  async signWithZKP(options: SignWithZKPOptions): Promise<PqcSignature> {
    try {
      // Prepare ZKP payload with ALL required attributes
      const zkpPayload = {
        enable: true,
        attributes: [
          "amount",
          "recipient",
          "nonce",
          "amount_gt_zero"
        ],
        circuit_type: "merkle",
        public_inputs: {
          amount_gt_zero: options.transaction.amount > 0,
          amount: options.transaction.amount,
          recipient: options.transaction.to,
          nonce: options.transaction.nonce,
          timestamp: options.transaction.timestamp
        }
      };

      const requestBody = {
        wallet_id: options.wallet_id,
        transaction: {
          amount: options.transaction.amount,
          to: options.transaction.to,
          nonce: options.transaction.nonce,
          timestamp: options.transaction.timestamp
        },
        algorithm: options.algorithm || 'pqc',
        zkp: zkpPayload
      };

      console.log('🔐 Signing with ZKP - Request:', JSON.stringify(requestBody, null, 2));

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
        const errorData = await response.json();
        console.error('❌ Error response from server:', {
          status: response.status,
          data: errorData
        });
        
        // Format the error message
        let errorMessage = 'Signing failed';
        let errorDetails = '';
        
        if (errorData.detail) {
          if (typeof errorData.detail === 'string') {
            errorMessage = errorData.detail;
          } else if (errorData.detail.error) {
            errorMessage = errorData.detail.error;
            if (errorData.detail.issues) {
              errorDetails = `Issues: ${errorData.detail.issues.join(', ')}`;
            }
          }
        }
        
        const enhancedError = new Error(errorMessage);
        (enhancedError as any).raw = errorData;
        (enhancedError as any).details = errorDetails;
        
        throw enhancedError;
      }

      const result: PqcSignature = await response.json();
      console.log('✅ Signing successful:', result);
      return result;
    } catch (error) {
      console.error('❌ ZKP Signing failed:', error);
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

  /**
   * Get list of wallets
   */
  async getWallets(): Promise<{ wallets: string[]; count: number }> {
    try {
      const response = await fetch(`${this.baseUrl}/wallets`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        mode: 'cors'
      });
      
      if (!response.ok) throw new Error('Failed to get wallets');
      return await response.json();
    } catch (error) {
      console.error('❌ Failed to get wallets:', error);
      return { wallets: [], count: 0 };
    }
  }
}

export const quantumZKP = QuantumZKPService.getInstance();