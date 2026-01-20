// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

/**
 * @title QuestBooster
 * @notice Handles bonus multipliers, streaks, and special rewards
 * @dev Calculates boost based on user activity and special conditions
 */

interface IQuestHub {
    function userQuests(address user) external view returns (
        uint256 lastCheckin,
        uint256 lastEngage,
        uint256 lastCommit,
        uint256 totalCompletions,
        uint256 currentStreak,
        uint256 longestStreak,
        uint256 lastActivityTimestamp
    );
}

contract QuestBooster is Ownable, Pausable {
    
    IQuestHub public questHub;
    
    // Boost tiers based on streak
    struct BoostTier {
        uint256 minStreak;
        uint256 multiplier; // 100 = 1x, 150 = 1.5x, 200 = 2x
    }
    
    BoostTier[] public boostTiers;
    
    // Special boosts (NFT holders, early users, etc.)
    mapping(address => uint256) public specialBoosts;
    
    // Referral system
    mapping(address => address) public referrer;
    mapping(address => uint256) public referralCount;
    uint256 public referralBonus = 5; // 5% extra per referral (max 25%)
    uint256 public maxReferralBonus = 25;
    
    event BoostTierAdded(uint256 minStreak, uint256 multiplier);
    event SpecialBoostSet(address indexed user, uint256 boost);
    event ReferralSet(address indexed user, address indexed referrer);
    
    constructor() Ownable(msg.sender) {
        // Initialize default boost tiers
        boostTiers.push(BoostTier(0, 100));    // 0 streak = 1x
        boostTiers.push(BoostTier(3, 110));    // 3 day streak = 1.1x
        boostTiers.push(BoostTier(7, 125));    // 7 day streak = 1.25x
        boostTiers.push(BoostTier(14, 150));   // 14 day streak = 1.5x
        boostTiers.push(BoostTier(30, 175));   // 30 day streak = 1.75x
        boostTiers.push(BoostTier(60, 200));   // 60 day streak = 2x
        boostTiers.push(BoostTier(100, 250));  // 100 day streak = 2.5x
    }
    
    /**
     * @notice Set QuestHub contract address
     */
    function setQuestHub(address _hub) external onlyOwner {
        questHub = IQuestHub(_hub);
    }
    
    /**
     * @notice Get total boost multiplier for a user
     * @param _user User address
     * @return multiplier Total multiplier (100 = 1x)
     */
    function getBoostMultiplier(address _user) external view returns (uint256) {
        uint256 baseMultiplier = getStreakMultiplier(_user);
        uint256 special = specialBoosts[_user];
        uint256 referral = getReferralBonus(_user);
        
        // Combine boosts: base + special + referral
        // Special and referral are additive percentages
        uint256 totalMultiplier = baseMultiplier + special + referral;
        
        // Cap at 300% (3x)
        if (totalMultiplier > 300) {
            totalMultiplier = 300;
        }
        
        return totalMultiplier;
    }
    
    /**
     * @notice Get streak-based multiplier
     */
    function getStreakMultiplier(address _user) public view returns (uint256) {
        if (address(questHub) == address(0)) {
            return 100; // Default 1x if hub not set
        }
        
        (, , , , uint256 currentStreak, ,) = questHub.userQuests(_user);
        
        uint256 multiplier = 100; // Default 1x
        
        // Find highest applicable tier
        for (uint256 i = 0; i < boostTiers.length; i++) {
            if (currentStreak >= boostTiers[i].minStreak) {
                multiplier = boostTiers[i].multiplier;
            }
        }
        
        return multiplier;
    }
    
    /**
     * @notice Get referral bonus percentage
     */
    function getReferralBonus(address _user) public view returns (uint256) {
        uint256 refs = referralCount[_user];
        uint256 bonus = refs * referralBonus;
        
        if (bonus > maxReferralBonus) {
            bonus = maxReferralBonus;
        }
        
        return bonus;
    }
    
    /**
     * @notice Set referrer for a user
     * @param _referrer Referrer address
     */
    function setReferrer(address _referrer) external {
        require(referrer[msg.sender] == address(0), "QuestBooster: referrer already set");
        require(_referrer != msg.sender, "QuestBooster: cannot refer self");
        require(_referrer != address(0), "QuestBooster: invalid referrer");
        
        referrer[msg.sender] = _referrer;
        referralCount[_referrer]++;
        
        emit ReferralSet(msg.sender, _referrer);
    }
    
    /**
     * @notice Set special boost for a user (for NFT holders, early users, etc.)
     * @param _user User address
     * @param _boost Boost percentage to add (e.g., 20 = +20%)
     */
    function setSpecialBoost(address _user, uint256 _boost) external onlyOwner {
        specialBoosts[_user] = _boost;
        emit SpecialBoostSet(_user, _boost);
    }
    
    /**
     * @notice Batch set special boosts
     */
    function batchSetSpecialBoosts(
        address[] calldata _users,
        uint256[] calldata _boosts
    ) external onlyOwner {
        require(_users.length == _boosts.length, "QuestBooster: length mismatch");
        
        for (uint256 i = 0; i < _users.length; i++) {
            specialBoosts[_users[i]] = _boosts[i];
            emit SpecialBoostSet(_users[i], _boosts[i]);
        }
    }
    
    /**
     * @notice Add or update a boost tier
     */
    function setBoostTier(uint256 _index, uint256 _minStreak, uint256 _multiplier) external onlyOwner {
        require(_multiplier >= 100, "QuestBooster: multiplier must be >= 100");
        
        if (_index >= boostTiers.length) {
            boostTiers.push(BoostTier(_minStreak, _multiplier));
        } else {
            boostTiers[_index] = BoostTier(_minStreak, _multiplier);
        }
        
        emit BoostTierAdded(_minStreak, _multiplier);
    }
    
    /**
     * @notice Update referral settings
     */
    function setReferralSettings(uint256 _bonus, uint256 _maxBonus) external onlyOwner {
        referralBonus = _bonus;
        maxReferralBonus = _maxBonus;
    }
    
    /**
     * @notice Get all boost tiers
     */
    function getAllBoostTiers() external view returns (BoostTier[] memory) {
        return boostTiers;
    }
    
    /**
     * @notice Get user's full boost breakdown
     */
    function getBoostBreakdown(address _user) external view returns (
        uint256 streakBoost,
        uint256 specialBoost,
        uint256 referralBoost,
        uint256 totalBoost,
        uint256 currentStreak,
        uint256 referrals
    ) {
        streakBoost = getStreakMultiplier(_user);
        specialBoost = specialBoosts[_user];
        referralBoost = getReferralBonus(_user);
        totalBoost = streakBoost + specialBoost + referralBoost;
        
        if (totalBoost > 300) totalBoost = 300;
        
        if (address(questHub) != address(0)) {
            (, , , , currentStreak, ,) = questHub.userQuests(_user);
        }
        
        referrals = referralCount[_user];
    }
    
    function pause() external onlyOwner { _pause(); }
    function unpause() external onlyOwner { _unpause(); }
}
