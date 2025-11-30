/**
 * 通用 Provider 获取工具
 * 优先级：window.ethereum > OKX Wallet
 */
export function getWalletProvider(): any {
  if (typeof window === 'undefined') return null;
  
  // 尝试 window.ethereum（MetaMask 等）
  if ((window as any).ethereum) {
    return (window as any).ethereum;
  }
  
  // 尝试 OKX Wallet
  if ((window as any).okxwallet?.provider) {
    return (window as any).okxwallet.provider;
  }
  
  return null;
}

