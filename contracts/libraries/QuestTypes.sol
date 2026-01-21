// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title QuestTypes
 * @notice Library containing quest type definitions and utilities
 */
library QuestTypes {
    // Quest type constants
    uint8 public constant DAILY_LOGIN = 0;
    uint8 public constant SOCIAL_SHARE = 1;
    uint8 public constant REFERRAL = 2;
    uint8 public constant STAKING = 3;
    uint8 public constant SPECIAL = 4;

    // Maximum quest type value
    uint8 public constant MAX_QUEST_TYPE = 4;

    // Booster tier constants
    uint8 public constant TIER_NONE = 0;
    uint8 public constant TIER_BRONZE = 1;
    uint8 public constant TIER_SILVER = 2;
    uint8 public constant TIER_GOLD = 3;
    uint8 public constant TIER_PLATINUM = 4;
    uint8 public constant TIER_DIAMOND = 5;

    // Maximum booster tier
    uint8 public constant MAX_BOOSTER_TIER = 5;

    /**
     * @notice Check if quest type is valid
     * @param questType Quest type to check
     * @return bool True if valid
     */
    function isValidQuestType(uint8 questType) internal pure returns (bool) {
        return questType <= MAX_QUEST_TYPE;
    }

    /**
     * @notice Check if booster tier is valid
     * @param tier Booster tier to check
     * @return bool True if valid
     */
    function isValidBoosterTier(uint8 tier) internal pure returns (bool) {
        return tier <= MAX_BOOSTER_TIER;
    }

    /**
     * @notice Get quest type name
     * @param questType Quest type
     * @return string Quest name
     */
    function getQuestName(uint8 questType) internal pure returns (string memory) {
        if (questType == DAILY_LOGIN) return "Daily Login";
        if (questType == SOCIAL_SHARE) return "Social Share";
        if (questType == REFERRAL) return "Referral";
        if (questType == STAKING) return "Staking";
        if (questType == SPECIAL) return "Special";
        return "Unknown";
    }

    /**
     * @notice Get booster tier name
     * @param tier Booster tier
     * @return string Tier name
     */
    function getBoosterTierName(uint8 tier) internal pure returns (string memory) {
        if (tier == TIER_NONE) return "None";
        if (tier == TIER_BRONZE) return "Bronze";
        if (tier == TIER_SILVER) return "Silver";
        if (tier == TIER_GOLD) return "Gold";
        if (tier == TIER_PLATINUM) return "Platinum";
        if (tier == TIER_DIAMOND) return "Diamond";
        return "Unknown";
    }
}
