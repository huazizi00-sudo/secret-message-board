// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint32, externalEuint32} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/**
 * @title SecretMessageBoard
 * @notice 隐私数字留言板 - 用户可以提交加密的秘密数字，只有自己能解密查看
 * @dev 使用 FHEVM v0.9 的全同态加密技术
 */
contract SecretMessageBoard is ZamaEthereumConfig {
    // 存储每个用户的加密留言（euint32 类型）
    mapping(address => euint32) public userMessages;
    
    // 记录用户是否已提交留言
    mapping(address => bool) public hasSubmitted;
    
    // 记录提交时间戳
    mapping(address => uint256) public submitTimestamp;
    
    // 事件：留言提交成功
    event MessageSubmitted(address indexed user, uint256 timestamp);
    
    // 事件：留言更新
    event MessageUpdated(address indexed user, uint256 timestamp);
    
    /**
     * @notice 提交加密的秘密数字
     * @param encryptedValue 加密的数字（从前端 FHEVM SDK 生成）
     * @param proof 零知识证明（用于验证加密数据的有效性）
     */
    function submitMessage(
        externalEuint32 encryptedValue,
        bytes calldata proof
    ) external {
        // 1. 验证并转换外部加密输入为内部 euint32 类型
        euint32 value = FHE.fromExternal(encryptedValue, proof);
        
        // 2. 存储加密的留言
        userMessages[msg.sender] = value;
        
        // 3. 更新提交状态和时间戳
        bool isUpdate = hasSubmitted[msg.sender];
        hasSubmitted[msg.sender] = true;
        submitTimestamp[msg.sender] = block.timestamp;
        
        // 4. 【关键】双重授权
        // 4.1 授予合约自身访问权限（合约才能返回 handle）
        FHE.allowThis(value);
        
        // 4.2 授予用户解密权限（用户才能解密查看）
        FHE.allow(value, msg.sender);
        
        // 5. 触发事件
        if (isUpdate) {
            emit MessageUpdated(msg.sender, block.timestamp);
        } else {
            emit MessageSubmitted(msg.sender, block.timestamp);
        }
    }
    
    /**
     * @notice 获取自己的加密留言（返回加密 handle）
     * @return 加密数据的 bytes32 句柄
     * @dev 前端使用此 handle 调用 userDecrypt 解密
     */
    function getMyMessage() external view returns (bytes32) {
        require(hasSubmitted[msg.sender], "You have not submitted a message yet");
        return FHE.toBytes32(userMessages[msg.sender]);
    }
    
    /**
     * @notice 检查用户是否已提交留言
     * @param user 用户地址
     * @return 是否已提交
     */
    function hasUserSubmitted(address user) external view returns (bool) {
        return hasSubmitted[user];
    }
    
    /**
     * @notice 获取用户的提交时间戳
     * @param user 用户地址
     * @return 提交时间戳（Unix 时间）
     */
    function getUserSubmitTimestamp(address user) external view returns (uint256) {
        require(hasSubmitted[user], "User has not submitted a message");
        return submitTimestamp[user];
    }
}

