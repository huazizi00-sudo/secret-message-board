'use client';

import { useState, useEffect, useRef } from 'react';
import { useAccount, useWalletClient } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { ethers, BrowserProvider } from 'ethers';
import { getWalletProvider } from '@/utils/wallet';

// Contract configuration
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '0x0000000000000000000000000000000000000000';

const CONTRACT_ABI = [
  "function submitMessage(bytes32 encryptedValue, bytes proof) external",
  "function getMyMessage() external view returns (bytes32)",
  "function hasUserSubmitted(address user) external view returns (bool)",
];

// FHEVM v0.9 configuration (7 required parameters)
const FHEVM_CONFIG = {
  chainId: 11155111,  // Sepolia
  aclContractAddress: '0xf0Ffdc93b7E186bC2f8CB3dAA75D86d1930A433D',
  kmsContractAddress: '0xbE0E383937d564D7FF0BC3b46c51f0bF8d5C311A',
  inputVerifierContractAddress: '0xBBC1fFCdc7C316aAAd72E807D9b0272BE8F84DA0',
  verifyingContractAddressDecryption: '0x5D8BD78e2ea6bbE41f26dFe9fdaEAa349e077478',
  verifyingContractAddressInputVerification: '0x483b9dE06E4E4C7D35CCf5837A1668487406D955',
  gatewayChainId: 10901,
  relayerUrl: 'https://relayer.testnet.zama.org',
};

export default function DAppPage() {
  const { isConnected, address } = useAccount();
  const { data: walletClient } = useWalletClient();
  
  // FHEVM state
  const [fhevmInstance, setFhevmInstance] = useState<any>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);
  const isInitializingRef = useRef(false);
  
  // User input
  const [inputValue, setInputValue] = useState('');
  
  // Submit state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  
  // Countdown state
  const [countdown, setCountdown] = useState(0);
  const [canDecrypt, setCanDecrypt] = useState(false);
  
  // Decrypt state
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [decryptedValue, setDecryptedValue] = useState<string | null>(null);
  const [decryptError, setDecryptError] = useState<string | null>(null);
  
  // ==================== FHEVM Initialization ====================
  useEffect(() => {
    if (!isConnected || !address || !walletClient || isInitializingRef.current || fhevmInstance) {
      return;
    }

    const initFhevm = async () => {
      isInitializingRef.current = true;
      setIsInitializing(true);
      setInitError(null);

      try {
        // Wait for relayerSDK to load
        if (!(window as any).relayerSDK) {
          throw new Error('Relayer SDK not loaded');
        }

        // Initialize SDK (required!)
        await (window as any).relayerSDK.initSDK();
        console.log('✅ SDK initialized successfully');

        // Get provider
        let provider = getWalletProvider();
        
        if (!provider) {
          throw new Error('Wallet provider not found');
        }

        // Create FHEVM instance
        const instance = await (window as any).relayerSDK.createInstance({
          ...FHEVM_CONFIG,
          network: provider,
        });

        setFhevmInstance(instance);
        console.log('✅ FHEVM initialized successfully');
      } catch (e: any) {
        setInitError(e.message);
        console.error('❌ FHEVM initialization failed:', e);
        isInitializingRef.current = false;
      } finally {
        setIsInitializing(false);
      }
    };

    initFhevm();
  }, [isConnected, address, walletClient, fhevmInstance]);

  // ==================== Submit Secret Number ====================
  const handleSubmit = async () => {
    if (!fhevmInstance || !walletClient || !address) return;
    
    const value = parseInt(inputValue);
    if (isNaN(value) || value < 0 || value > 4294967295) {
      setSubmitError('Please enter an integer between 0 and 4,294,967,295');
      return;
    }
    
    setIsSubmitting(true);
    setSubmitError(null);
    
    try {
      // 1. Encrypt input
      console.log('🔒 Encrypting number:', value);
      const input = fhevmInstance.createEncryptedInput(CONTRACT_ADDRESS, address);
      input.add32(value);
      const encryptedInput = await input.encrypt();
      
      const handle = encryptedInput.handles[0];
      const proof = encryptedInput.inputProof;
      
      // 2. Submit to contract
      console.log('📤 Submitting to contract...');
      const provider = new BrowserProvider(walletClient as any);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
      
      const tx = await contract.submitMessage(handle, proof);
      console.log('⏳ Waiting for transaction confirmation...');
      await tx.wait();
      
      console.log('✅ Submitted successfully!');
      setHasSubmitted(true);
      
      // 3. Start 30 second countdown
      setCountdown(30);
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            setCanDecrypt(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
    } catch (e: any) {
      console.error('❌ Submission failed:', e);
      setSubmitError(e.message || 'Submission failed, please retry');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // ==================== Decrypt and View Message ====================
  const handleDecrypt = async () => {
    if (!fhevmInstance || !walletClient || !address) return;
    
    setIsDecrypting(true);
    setDecryptError(null);
    
    try {
      // 1. Get contract instance (with signer)
      const provider = new BrowserProvider(walletClient as any);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
      
      // 2. Get encrypted handle
      console.log('📥 Fetching encrypted data...');
      const encryptedHandle = await contract.getMyMessage();
      console.log('Handle:', encryptedHandle);
      
      // 3. Generate keypair
      const keypair = fhevmInstance.generateKeypair();
      
      // 4. Prepare decryption parameters
      const handleContractPairs = [
        { handle: encryptedHandle, contractAddress: CONTRACT_ADDRESS }
      ];
      const startTimeStamp = Math.floor(Date.now() / 1000).toString();
      const durationDays = "10";
      const contractAddresses = [CONTRACT_ADDRESS];
      
      // 5. Create EIP-712 signature message
      const eip712 = fhevmInstance.createEIP712(
        keypair.publicKey,
        contractAddresses,
        startTimeStamp,
        durationDays
      );
      
      // 6. User signature authorization (remove EIP712Domain)
      console.log('✍️ Requesting signature...');
      const typesWithoutDomain = { ...eip712.types };
      delete typesWithoutDomain.EIP712Domain;
      
      const signature = await signer.signTypedData(
        eip712.domain,
        typesWithoutDomain,
        eip712.message
      );
      console.log('✅ Signature completed');
      
      // 7. Call userDecrypt to decrypt
      console.log('🔓 Decrypting (may take 30-60 seconds)...');
      const decryptedResults = await fhevmInstance.userDecrypt(
        handleContractPairs,
        keypair.privateKey,
        keypair.publicKey,
        signature.replace("0x", ""),
        contractAddresses,
        address,
        startTimeStamp,
        durationDays
      );
      
      // 8. Extract result
      const result = decryptedResults[encryptedHandle];
      console.log('✅ Decryption successful:', result);
      setDecryptedValue(result.toString());
      
    } catch (e: any) {
      console.error('❌ Decryption failed:', e);
      setDecryptError(e.message || 'Decryption failed, please retry');
    } finally {
      setIsDecrypting(false);
    }
  };
  
  // ==================== Reset and Resubmit ====================
  const handleReset = () => {
    setInputValue('');
    setHasSubmitted(false);
    setCountdown(0);
    setCanDecrypt(false);
    setDecryptedValue(null);
    setSubmitError(null);
    setDecryptError(null);
  };
  
  // ==================== UI Rendering ====================
  
  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900">
        <div className="text-center space-y-6">
          <div className="text-6xl mb-4">🔐</div>
          <h1 className="text-3xl font-bold text-white mb-2">Secret Number Board</h1>
          <p className="text-gray-300 mb-8">Please connect your wallet to continue</p>
          <ConnectButton />
        </div>
      </div>
    );
  }

  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-500 mx-auto mb-4"></div>
          <p className="text-white text-lg">Initializing FHEVM...</p>
        </div>
      </div>
    );
  }

  if (initError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900">
        <div className="text-center max-w-md">
          <div className="text-red-500 text-5xl mb-4">❌</div>
          <h2 className="text-2xl font-bold text-white mb-2">Initialization Failed</h2>
          <p className="text-gray-300 text-sm">{initError}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-6 px-6 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 py-8 px-4">
      {/* Header */}
      <div className="max-w-2xl mx-auto mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-4xl">🔐</div>
            <h1 className="text-2xl font-bold text-white">Secret Number Board</h1>
          </div>
          <ConnectButton />
        </div>
      </div>
      
      {/* Main Content */}
      <div className="max-w-2xl mx-auto">
        <div className="bg-white/10 backdrop-blur-md rounded-2xl shadow-2xl border border-white/20 p-8">
          
          {/* State 1: Not submitted - Input form */}
          {!hasSubmitted && decryptedValue === null && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-white mb-2">Submit Your Secret Number</h2>
                <p className="text-gray-300 text-sm">Enter a number that will be encrypted and stored on the blockchain</p>
              </div>
              
              <div>
                <label className="block text-white text-sm font-medium mb-2">
                  Secret Number (0 - 4,294,967,295)
                </label>
                <input
                  type="number"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="e.g. 888"
                  className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white text-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  disabled={isSubmitting}
                />
              </div>
              
              {submitError && (
                <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200 text-sm">
                  ⚠️ {submitError}
                </div>
              )}
              
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || !inputValue}
                className="w-full py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Submitting...
                  </span>
                ) : (
                  '🔒 Submit Secret Number'
                )}
              </button>
            </div>
          )}
          
          {/* State 2: Submitted - Countdown */}
          {hasSubmitted && countdown > 0 && (
            <div className="text-center space-y-6">
              <div className="text-6xl mb-4">✅</div>
              <h2 className="text-2xl font-bold text-white">Submitted Successfully!</h2>
              <div className="p-4 bg-yellow-500/20 border border-yellow-500/50 rounded-lg">
                <p className="text-yellow-200 text-sm mb-2">⏳ Syncing permissions...</p>
                <p className="text-yellow-100 text-3xl font-bold">{countdown} seconds</p>
              </div>
              <p className="text-gray-300 text-sm">
                You can decrypt and view your secret number after permissions are synced
              </p>
            </div>
          )}
          
          {/* State 3: Can decrypt */}
          {canDecrypt && decryptedValue === null && (
            <div className="text-center space-y-6">
              <div className="text-6xl mb-4">🎉</div>
              <h2 className="text-2xl font-bold text-white">Permissions Synced</h2>
              <p className="text-gray-300 text-sm mb-6">
                You can now decrypt and view your secret number
              </p>
              
              {decryptError && (
                <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200 text-sm">
                  ⚠️ {decryptError}
                </div>
              )}
              
              <button
                onClick={handleDecrypt}
                disabled={isDecrypting}
                className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {isDecrypting ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Decrypting (30-60 seconds)...
                  </span>
                ) : (
                  '🔓 Decrypt & View Message'
                )}
              </button>
            </div>
          )}
          
          {/* State 4: Decrypted */}
          {decryptedValue !== null && (
            <div className="text-center space-y-6">
              <div className="text-6xl mb-4">🎊</div>
              <h2 className="text-2xl font-bold text-white mb-4">Your Secret Number</h2>
              
              <div className="p-8 bg-gradient-to-r from-purple-500/30 to-pink-500/30 border-2 border-purple-400 rounded-xl">
                <p className="text-5xl font-bold text-white">{decryptedValue}</p>
              </div>
              
              <button
                onClick={handleReset}
                className="w-full py-4 bg-white/20 text-white font-bold rounded-lg border border-white/30 hover:bg-white/30 transition-all duration-200"
              >
                ✏️ Submit Again
              </button>
            </div>
          )}
          
        </div>
        
        {/* Footer Info */}
        <div className="mt-6 text-center text-gray-400 text-sm">
          <p>🔒 Your number remains encrypted on-chain at all times</p>
          <p className="mt-1">Only you can decrypt and view it</p>
        </div>
      </div>
    </div>
  );
}

// Disable static generation
export const dynamic = 'force-dynamic';

