# 🔐 Secret Message Board

> **Privacy-Preserving Encrypted Message Board** - Decentralized encrypted messaging system based on FHEVM v0.9

A privacy-preserving encrypted message board that uses Zama FHEVM fully homomorphic encryption technology. Users can encrypt and store secret messages on the blockchain that only they can decrypt and view.

**Current Demo**: This implementation uses numbers (uint32) as messages to demonstrate the core FHE encryption/decryption flow. The architecture can be easily extended to support text messages, files, or other data types.

---

## 🌟 Core Features

- 🔒 **End-to-End Encryption** - Messages are encrypted on the frontend, remain encrypted on-chain
- 🛡️ **Privacy Protection** - Only you can decrypt and view your secret messages
- ⚡ **Decentralized** - Based on Ethereum Sepolia testnet, no need to trust centralized services
- 🎨 **Modern UI** - Clean and elegant user interface with smooth interactions
- 🌙 **Dark Theme** - Support for dark mode to protect your eyes
- 📦 **Extensible Architecture** - Easy to extend to support text, images, or other data types

---

## 🔒 FHE Technology Usage

This project uses **Fully Homomorphic Encryption (FHE)** technology provided by Zama's FHEVM at the following locations:

### 1. **Smart Contract** (`packages/hardhat/contracts/SecretMessageBoard.sol`)
```solidity
import {FHE, euint32, externalEuint32} from "@fhevm/solidity/lib/FHE.sol";

// Store encrypted messages (euint32 type - can be extended to other types)
mapping(address => euint32) public userMessages;

// Accept encrypted input from frontend
function submitMessage(externalEuint32 encryptedValue, bytes calldata proof) external {
    // Convert external encrypted input to internal euint32
    euint32 value = FHE.fromExternal(encryptedValue, proof);
    
    // Grant contract access permission
    FHE.allowThis(value);
    
    // Grant user decryption permission
    FHE.allow(value, msg.sender);
}
```

### 2. **Frontend Encryption** (`packages/nextjs-showcase/app/dapp/page.tsx`)
```typescript
// Create encrypted input
const input = fhevmInstance.createEncryptedInput(CONTRACT_ADDRESS, address);
input.add32(value);  // Encrypt uint32 message (can use addBytes for text)
const encryptedInput = await input.encrypt();
```

### 3. **Frontend Decryption** (`packages/nextjs-showcase/app/dapp/page.tsx`)
```typescript
// User-side decryption (requires private key signature)
const decryptedResults = await fhevmInstance.userDecrypt(
  handleContractPairs,
  keypair.privateKey,
  keypair.publicKey,
  signature,
  contractAddresses,
  address,
  startTimeStamp,
  durationDays
);
```

**Key Points:**
- ✅ Messages are **encrypted on the frontend** before being sent to the blockchain
- ✅ **On-chain data remains encrypted** at all times (euint32 type)
- ✅ Smart contract **cannot see the plaintext**, only processes encrypted data
- ✅ Only the owner **can decrypt** (requires private key signature authorization)
- ✅ Uses Zama's **KMS and Relayer infrastructure** for secure key management
- 🔄 **Extensible**: Can be extended to support `euint64`, `ebytes256`, or other encrypted types for text/files

---

## 🏗️ Technical Architecture

### Smart Contract
- **FHEVM Version**: v0.9.1
- **Contract**: `SecretMessageBoard.sol`
- **Network**: Ethereum Sepolia Testnet
- **Encryption Type**: `euint32` (supports 0 to 4,294,967,295)
- **Extensibility**: Can be extended to support `ebytes256` for text messages

### Frontend
- **Framework**: Next.js 15 + React 19
- **Styling**: Tailwind CSS
- **Wallet**: RainbowKit + Wagmi v2
- **FHEVM SDK**: Relayer SDK 0.3.0-5 (CDN)
- **Deployment**: Vercel

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- pnpm (recommended) or npm
- MetaMask or compatible Web3 wallet
- Sepolia testnet ETH ([Get testnet tokens](https://sepoliafaucet.com/))

### Install Dependencies

```bash
# Clone repository
git clone https://github.com/huazizi00-sudo/secret-message-board.git
cd secret-message-board

# Install Hardhat dependencies
cd packages/hardhat
pnpm install

# Install frontend dependencies
cd ../nextjs-showcase
pnpm install
```

### Configure Environment Variables

#### 1. Hardhat Configuration

```bash
cd packages/hardhat
cp .env.example .env
```

Edit `.env` file:
```env
PRIVATE_KEY=your_private_key
ALCHEMY_API_KEY=your_alchemy_api_key
RPC_URL=https://eth-sepolia.g.alchemy.com/v2/${ALCHEMY_API_KEY}
```

#### 2. Frontend Configuration

```bash
cd packages/nextjs-showcase
```

Create `.env.local` file:
```env
NEXT_PUBLIC_CONTRACT_ADDRESS=contract_address
NEXT_PUBLIC_CHAIN_ID=11155111
```

### Deploy Contract

```bash
cd packages/hardhat

# Compile contract
pnpm compile

# Deploy to Sepolia
pnpm deploy

# Copy the output contract address to frontend .env.local
```

### Start Frontend

```bash
cd packages/nextjs-showcase

# Development mode
pnpm dev

# Visit http://localhost:3000
```

---

## 📖 User Guide

### 1. Connect Wallet
- Visit the DApp page
- Click "Connect Wallet"
- Select MetaMask or another wallet
- Make sure you're on Sepolia testnet

### 2. Submit Secret Message
- Enter a number (0 to 4,294,967,295) in the input box
- Click "🔒 Submit Secret Number"
- Confirm the transaction
- Wait for transaction confirmation (~15-30 seconds)

**Note**: Current demo uses numbers. To extend to text messages, replace `euint32` with `ebytes256` in the contract and use `input.addBytes()` in frontend.

### 3. Wait for Permission Sync
- After successful submission, a 30-second countdown will appear
- This allows permission information to sync on the relayer
- Please wait patiently for the countdown to finish

### 4. Decrypt and View
- After the countdown ends, click "🔓 Decrypt & View Message"
- Sign the authorization in your wallet (EIP-712)
- Wait for decryption to complete (~30-60 seconds)
- View your secret message

### 5. Resubmit
- After successful decryption, you can click "✏️ Submit Again"
- Submitting a new message will overwrite the old data

---

## 🔒 Privacy & Security

### Privacy Guarantees
- ✅ Messages are encrypted using FHEVM on the frontend, plaintext never goes on-chain
- ✅ On-chain data remains encrypted at all times
- ✅ Only the user can decrypt (requires private key signature)
- ✅ The contract cannot see the plaintext messages
- ✅ Other users cannot decrypt your data

### Access Control
```solidity
// Dual authorization in the contract
FHE.allowThis(value);         // Contract can return handle
FHE.allow(value, msg.sender); // User can decrypt
```

### Known Limitations
- Each address can only store one message (can be overwritten)
- Current demo: Number range 0 - 4,294,967,295 (uint32)
- Decryption requires waiting for permission sync (30 seconds)
- Decryption process is slow (30-60 seconds)

---

## 🔄 Extending to Text Messages

To extend this demo to support text messages:

1. **Contract**: Change `euint32` to `ebytes256`
```solidity
mapping(address => ebytes256) public userMessages;
```

2. **Frontend Encryption**: Use `addBytes` instead of `add32`
```typescript
const input = fhevmInstance.createEncryptedInput(CONTRACT_ADDRESS, address);
input.addBytes256(textBytes);  // For text messages
```

3. **Frontend Decryption**: Decode bytes to text
```typescript
const decryptedBytes = decryptedResults[encryptedHandle];
const text = new TextDecoder().decode(decryptedBytes);
```

---

## 📁 Project Structure

```
secret-message-board/
├── packages/
│   ├── hardhat/                    # Smart contracts
│   │   ├── contracts/
│   │   │   └── SecretMessageBoard.sol
│   │   ├── deploy/
│   │   │   └── deploy_secret_message_board.ts
│   │   ├── hardhat.config.ts
│   │   └── package.json
│   │
│   └── nextjs-showcase/            # Frontend application
│       ├── app/
│       │   ├── layout.tsx          # Root layout, loads FHEVM SDK
│       │   ├── page.tsx            # Landing page
│       │   ├── dapp/
│       │   │   └── page.tsx        # Core DApp page
│       │   └── globals.css
│       ├── components/
│       │   ├── Providers.tsx       # RainbowKit/Wagmi
│       │   └── ClientProviders.tsx
│       ├── utils/
│       │   └── wallet.ts           # Provider utilities
│       ├── next.config.js          # Webpack + CORS
│       ├── vercel.json             # Vercel CORS config
│       └── package.json
│
└── README.md
```

---

## 🛠️ Development Guide

### Contract Development

```bash
cd packages/hardhat

# Compile
pnpm compile

# Test (if available)
pnpm test

# Deploy
pnpm deploy --network sepolia
```

### Frontend Development

```bash
cd packages/nextjs-showcase

# Development mode (hot reload)
pnpm dev

# Build production version
pnpm build

# Start production server
pnpm start

# Lint code
pnpm lint
```

---

## 🚢 Deployment Guide

### 1. Deploy Contract to Sepolia

```bash
cd packages/hardhat
pnpm deploy
# Record the output contract address
```

### 2. Deploy Frontend to Vercel

#### Method 1: Via GitHub

1. Push code to GitHub
2. Visit [Vercel](https://vercel.com)
3. Import GitHub repository
4. Configure Root Directory: `packages/nextjs-showcase`
5. Add environment variables:
   - `NEXT_PUBLIC_CONTRACT_ADDRESS`: contract address
   - `NEXT_PUBLIC_CHAIN_ID`: `11155111`
6. Click Deploy

#### Method 2: Vercel CLI

```bash
cd packages/nextjs-showcase
npm i -g vercel
vercel --prod
```

---

## 🔧 Troubleshooting

### FHEVM Initialization Failed

**Issue**: "KMS contract address is not valid"

**Solution**: Ensure you're using the correct 7 configuration parameters:
```typescript
const FHEVM_CONFIG = {
  chainId: 11155111,
  aclContractAddress: '0xf0Ffdc93b7E186bC2f8CB3dAA75D86d1930A433D',
  kmsContractAddress: '0xbE0E383937d564D7FF0BC3b46c51f0bF8d5C311A',
  // ... other configs
};
```

### Decryption Failed (500 Error)

**Issue**: "User decrypt failed: relayer respond with HTTP code 500"

**Solution**: 
1. Make sure to wait for the 30-second countdown to finish
2. Check if the contract address configuration is correct
3. Confirm the transaction was successfully confirmed
4. Try refreshing the page and decrypt again

### CORS Error

**Issue**: Browser reports CORS error

**Solution**: Ensure `next.config.js` and `vercel.json` have the correct CORS headers configured:
```javascript
headers: [
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
  { key: 'Cross-Origin-Embedder-Policy', value: 'credentialless' },
]
```

---

## 📚 Reference Resources

- [Zama FHEVM Official Documentation](https://docs.zama.org/fhevm)
- [FHEVM Solidity API](https://docs.zama.org/protocol/solidity-guides/smart-contract/api)
- [Next.js Documentation](https://nextjs.org/docs)
- [RainbowKit Documentation](https://www.rainbowkit.com/docs)
- [Wagmi Documentation](https://wagmi.sh/)

---

## 🎯 Zama Developer Program

This project participates in the [Zama Developer Program](https://www.zama.ai/), demonstrating the core capabilities of FHEVM:

- ✅ Complete FHEVM v0.9 integration
- ✅ End-to-end encrypted data flow
- ✅ User-side decryption (userDecrypt)
- ✅ Modern user interface
- ✅ Complete documentation and comments
- ✅ Extensible architecture for various data types

---

## 📄 License

MIT License

---

## 🙏 Acknowledgments

- [Zama](https://www.zama.ai/) - Providing FHEVM technology
- [RainbowKit](https://www.rainbowkit.com/) - Excellent wallet connection solution
- [Next.js](https://nextjs.org/) - Powerful React framework

---

## 📞 Contact

If you have questions or suggestions, feel free to:
- Submit an Issue
- Create a Pull Request
- Contact the developer

---

**🎉 Start building your privacy-preserving encrypted message board now!**
