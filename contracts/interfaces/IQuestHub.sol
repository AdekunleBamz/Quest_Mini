// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IQuestHub
 * @notice Interface for the QuestHub quest management contract
 */
interface IQuestHub {
    enum QuestType { CHECKIN, ENGAGE, COMMIT, CLAIM }
    
    function completeCheckin() external returns (uint256);
    function completeEngage() external returns (uint256);
    function completeCommit() external returns (uint256);
    
    function hasCompletedAllQuests(address user) external view returns (bool);
    function getTotalReward() external view returns (uint256);
    function updateStreak(address user) external;
    
    function getUserStatus(address user) external view returns (
        uint256 completions,
        uint256 streak,
        uint256 longestStreak,
        bool checkinDone,
        bool engageDone,
        bool commitDone
    );
    
    function userQuests(address user) external view returns (
        uint256 lastCheckin,
        uint256 lastEngage,
        uint256 lastCommit,
        uint256 totalCompletions,
        uint256 currentStreak,
        uint256 longestStreak,
        uint256 lastActivityTimestamp
    );
    
    function setContracts(address vault, address booster) external;
    function setRewards(uint256 checkin, uint256 engage, uint256 commit, uint256 bonus) external;
    function pause() external;
    function unpause() external;
}
