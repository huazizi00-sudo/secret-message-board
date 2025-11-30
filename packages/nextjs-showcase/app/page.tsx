import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900">
      <div className="text-center space-y-8 p-8">
        {/* Logo */}
        <div className="flex items-center justify-center">
          <div className="text-6xl">🔐</div>
        </div>
        
        {/* Title */}
        <h1 className="text-5xl font-bold text-white">
          Secret Number Board
        </h1>
        
        {/* Subtitle */}
        <p className="text-xl text-gray-300 max-w-2xl mx-auto">
          Privacy-Preserving On-Chain Number Message Board
          <br />
          <span className="text-sm text-gray-400 mt-2 block">
            Using FHEVM fully homomorphic encryption technology, only you can see your secret number
          </span>
        </p>
        
        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mt-12">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <div className="text-3xl mb-3">🔒</div>
            <h3 className="text-lg font-semibold text-white mb-2">End-to-End Encryption</h3>
            <p className="text-sm text-gray-300">Numbers are encrypted on the frontend and remain encrypted on-chain</p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <div className="text-3xl mb-3">🛡️</div>
            <h3 className="text-lg font-semibold text-white mb-2">Privacy Protection</h3>
            <p className="text-sm text-gray-300">Only you can decrypt and view your secret number</p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <div className="text-3xl mb-3">⚡</div>
            <h3 className="text-lg font-semibold text-white mb-2">Decentralized</h3>
            <p className="text-sm text-gray-300">Based on Ethereum Sepolia testnet, no need to trust centralized services</p>
          </div>
        </div>
        
        {/* CTA Button */}
        <div className="pt-8">
          <Link 
            href="/dapp"
            className="inline-block px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
          >
            🚀 Get Started
          </Link>
        </div>
        
        {/* Tech Stack */}
        <div className="pt-12 text-sm text-gray-400">
          <p>Powered by FHEVM v0.9 · Next.js 15 · Ethereum Sepolia</p>
        </div>
      </div>
    </div>
  );
}

