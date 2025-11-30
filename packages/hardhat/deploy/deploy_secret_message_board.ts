import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

/**
 * 部署 SecretMessageBoard 合约到 Sepolia 测试网
 * 
 * @param hre HardhatRuntimeEnvironment
 */
const deploySecretMessageBoard: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  console.log("Deploying SecretMessageBoard with account:", deployer);

  const secretMessageBoard = await deploy("SecretMessageBoard", {
    from: deployer,
    args: [], // 无构造函数参数
    log: true,
    autoMine: true,
  });

  console.log("✅ SecretMessageBoard deployed to:", secretMessageBoard.address);
  console.log("📝 Please update NEXT_PUBLIC_CONTRACT_ADDRESS in packages/nextjs-showcase/.env.local");
};

export default deploySecretMessageBoard;

// 标签用于选择性部署
deploySecretMessageBoard.tags = ["SecretMessageBoard"];

