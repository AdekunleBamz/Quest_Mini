// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IQuestEvents
 * @notice Common events emitted by Quest contracts
 */
interface IQuestEvents {
    /**
     * @notice Emitted when a quest is completed
     * @param user Address of the user
     * @param questType Type of quest completed
     * @param reward Amount of tokens rewarded
     * @param streak Current streak count
     */
    event QuestCompleted(
        address indexed user,
        uint8 indexed questType,
        uint256 reward,
        uint256 streak
    );

    /**
     * @notice Emitted when rewards are claimed
     * @param user Address of the user
     * @param amount Amount of tokens claimed
     */
    event RewardsClaimed(
        address indexed user,
        uint256 amount
    );

    /**
     * @notice Emitted when a booster is activated
     * @param user Address of the user
     * @param tier Booster tier activated
     * @param expiry Expiration timestamp
     */
    event BoosterActivated(
        address indexed user,
        uint8 indexed tier,
        uint256 expiry
    );

    /**
     * @notice Emitted when a booster expires
     * @param user Address of the user
     * @param tier Booster tier that expired
     */
    event BoosterExpired(
        address indexed user,
        uint8 indexed tier
    );

    /**
     * @notice Emitted when streak is updated
     * @param user Address of the user
     * @param oldStreak Previous streak count
     * @param newStreak New streak count
     */
    event StreakUpdated(
        address indexed user,
        uint256 oldStreak,
        uint256 newStreak
    );

    /**
     * @notice Emitted when streak is reset
     * @param user Address of the user
     * @param lostStreak Streak count that was lost
     */
    event StreakReset(
        address indexed user,
        uint256 lostStreak
    );

    /**
     * @notice Emitted when rewards are added to pending
     * @param user Address of the user
     * @param amount Amount added
     * @param newTotal New total pending
     */
    event RewardsAccumulated(
        address indexed user,
        uint256 amount,
        uint256 newTotal
    );
}
