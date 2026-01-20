/**
 * Quest Mini App - Contract Service
 * Handles all smart contract interactions
 */

import { CONTRACTS } from './constants.js';
import { wallet } from './wallet.js';
import { toast } from './toast.js';

// Contract ABIs (simplified - full ABIs in separate files)
const TOKEN_ABI = [
    'function balanceOf(address) view returns (uint256)',
    'function approve(address spender, uint256 amount) returns (bool)',
    'function allowance(address owner, address spender) view returns (uint256)',
    'function totalSupply() view returns (uint256)',
    'function name() view returns (string)',
    'function symbol() view returns (string)',
    'function decimals() view returns (uint8)'
];

const HUB_ABI = [
    'function completeQuest(uint8 questType)',
    'function getUserStreak(address user) view returns (uint256)',
    'function getLastQuestTime(address user, uint8 questType) view returns (uint256)',
    'function hasCompletedToday(address user, uint8 questType) view returns (bool)',
    'function getQuestReward(uint8 questType) view returns (uint256)',
    'event QuestCompleted(address indexed user, uint8 questType, uint256 reward)'
];

const VAULT_ABI = [
    'function claimRewards()',
    'function getPendingRewards(address user) view returns (uint256)',
    'function getTotalRewardsEarned(address user) view returns (uint256)',
    'function getClaimableAmount(address user) view returns (uint256)',
    'event RewardsClaimed(address indexed user, uint256 amount)'
];

const BOOSTER_ABI = [
    'function activateBooster(uint8 tier)',
    'function getUserBooster(address user) view returns (uint8)',
    'function getBoosterMultiplier(uint8 tier) view returns (uint256)',
    'function getBoosterExpiry(address user) view returns (uint256)',
    'function isBoosterActive(address user) view returns (bool)',
    'event BoosterActivated(address indexed user, uint8 tier, uint256 expiry)'
];

class ContractService {
    constructor() {
        this.token = null;
        this.hub = null;
        this.vault = null;
        this.booster = null;
    }

    /**
     * Initialize contracts with signer
     */
    async init() {
        if (!wallet.signer) {
            throw new Error('Wallet not connected');
        }

        this.token = new ethers.Contract(CONTRACTS.QUEST_TOKEN, TOKEN_ABI, wallet.signer);
        this.hub = new ethers.Contract(CONTRACTS.QUEST_HUB, HUB_ABI, wallet.signer);
        this.vault = new ethers.Contract(CONTRACTS.QUEST_VAULT, VAULT_ABI, wallet.signer);
        this.booster = new ethers.Contract(CONTRACTS.QUEST_BOOSTER, BOOSTER_ABI, wallet.signer);
    }

    /**
     * Get read-only contracts (no signer needed)
     * @param {ethers.Provider} provider 
     */
    initReadOnly(provider) {
        this.token = new ethers.Contract(CONTRACTS.QUEST_TOKEN, TOKEN_ABI, provider);
        this.hub = new ethers.Contract(CONTRACTS.QUEST_HUB, HUB_ABI, provider);
        this.vault = new ethers.Contract(CONTRACTS.QUEST_VAULT, VAULT_ABI, provider);
        this.booster = new ethers.Contract(CONTRACTS.QUEST_BOOSTER, BOOSTER_ABI, provider);
    }

    // ==================== Token Functions ====================

    /**
     * Get token balance
     * @param {string} address - User address
     * @returns {Promise<string>} Balance in wei
     */
    async getTokenBalance(address) {
        return (await this.token.balanceOf(address)).toString();
    }

    /**
     * Get token info
     * @returns {Promise<Object>} Token info
     */
    async getTokenInfo() {
        const [name, symbol, decimals, totalSupply] = await Promise.all([
            this.token.name(),
            this.token.symbol(),
            this.token.decimals(),
            this.token.totalSupply()
        ]);
        return { name, symbol, decimals, totalSupply: totalSupply.toString() };
    }

    // ==================== Quest Functions ====================

    /**
     * Complete a quest
     * @param {number} questType - Quest type ID
     * @returns {Promise<Object>} Transaction receipt
     */
    async completeQuest(questType) {
        try {
            const tx = await this.hub.completeQuest(questType);
            toast.transaction(tx.hash, 'Completing quest...');
            
            const receipt = await tx.wait();
            toast.success('Quest completed! Rewards added.');
            
            return receipt;
        } catch (error) {
            this.handleError(error);
            throw error;
        }
    }

    /**
     * Get user streak
     * @param {string} address - User address
     * @returns {Promise<number>} Streak count
     */
    async getUserStreak(address) {
        return Number(await this.hub.getUserStreak(address));
    }

    /**
     * Check if quest completed today
     * @param {string} address - User address
     * @param {number} questType - Quest type
     * @returns {Promise<boolean>}
     */
    async hasCompletedToday(address, questType) {
        return await this.hub.hasCompletedToday(address, questType);
    }

    /**
     * Get quest reward amount
     * @param {number} questType - Quest type
     * @returns {Promise<string>} Reward in wei
     */
    async getQuestReward(questType) {
        return (await this.hub.getQuestReward(questType)).toString();
    }

    // ==================== Vault Functions ====================

    /**
     * Claim pending rewards
     * @returns {Promise<Object>} Transaction receipt
     */
    async claimRewards() {
        try {
            const tx = await this.vault.claimRewards();
            toast.transaction(tx.hash, 'Claiming rewards...');
            
            const receipt = await tx.wait();
            toast.success('Rewards claimed successfully!');
            
            return receipt;
        } catch (error) {
            this.handleError(error);
            throw error;
        }
    }

    /**
     * Get pending rewards
     * @param {string} address - User address
     * @returns {Promise<string>} Pending amount in wei
     */
    async getPendingRewards(address) {
        return (await this.vault.getPendingRewards(address)).toString();
    }

    /**
     * Get total rewards earned
     * @param {string} address - User address
     * @returns {Promise<string>} Total earned in wei
     */
    async getTotalRewardsEarned(address) {
        return (await this.vault.getTotalRewardsEarned(address)).toString();
    }

    // ==================== Booster Functions ====================

    /**
     * Activate a booster
     * @param {number} tier - Booster tier
     * @returns {Promise<Object>} Transaction receipt
     */
    async activateBooster(tier) {
        try {
            const tx = await this.booster.activateBooster(tier);
            toast.transaction(tx.hash, 'Activating booster...');
            
            const receipt = await tx.wait();
            toast.success('Booster activated!');
            
            return receipt;
        } catch (error) {
            this.handleError(error);
            throw error;
        }
    }

    /**
     * Get user's booster tier
     * @param {string} address - User address
     * @returns {Promise<number>} Booster tier
     */
    async getUserBooster(address) {
        return Number(await this.booster.getUserBooster(address));
    }

    /**
     * Check if booster is active
     * @param {string} address - User address
     * @returns {Promise<boolean>}
     */
    async isBoosterActive(address) {
        return await this.booster.isBoosterActive(address);
    }

    /**
     * Get booster expiry timestamp
     * @param {string} address - User address
     * @returns {Promise<number>} Unix timestamp
     */
    async getBoosterExpiry(address) {
        return Number(await this.booster.getBoosterExpiry(address));
    }

    // ==================== Error Handling ====================

    /**
     * Handle contract errors
     * @param {Error} error - Error object
     */
    handleError(error) {
        console.error('Contract error:', error);
        
        let message = 'Transaction failed';
        
        if (error.code === 'ACTION_REJECTED') {
            message = 'Transaction rejected by user';
        } else if (error.message?.includes('insufficient funds')) {
            message = 'Insufficient ETH for gas';
        } else if (error.message?.includes('execution reverted')) {
            // Try to parse revert reason
            const reason = error.reason || error.message;
            message = reason || 'Transaction reverted';
        }
        
        toast.error(message);
    }
}

// Export singleton instance
export const contracts = new ContractService();
export default contracts;
