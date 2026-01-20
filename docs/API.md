# Quest Mini App - API Documentation

## Overview

Quest Mini is a Farcaster mini-app built on Base that enables users to complete quests and earn QUEST tokens. This document describes the smart contract interfaces and how to interact with them.

## Contract Addresses (Base Mainnet)

| Contract | Address |
|----------|---------|
| QuestToken | `0xb3E3DE7248E69B1842C274fD1304d4419a734de7` |
| QuestHubV2 | `0x957b578Ac7469BDD5f0c4097C8B98200553b12ba` |
| QuestVaultV2 | `0x449436Ed23595Fc95bf19181cca63cE83f0b5EC0` |
| QuestBooster | `0xC13Ad15ac6c27477B8b56e242910A5b4cC7792Be` |

## QuestToken (ERC20)

Standard ERC20 token with minting capabilities.

### Read Functions

#### `balanceOf(address account)`
Returns the token balance of an account.
- **Parameters:** `account` - Address to check
- **Returns:** `uint256` - Balance in wei (18 decimals)

#### `totalSupply()`
Returns the total supply of tokens.
- **Returns:** `uint256` - Total supply in wei

#### `name()` / `symbol()` / `decimals()`
Standard ERC20 metadata functions.

### Write Functions

#### `transfer(address to, uint256 amount)`
Transfer tokens to another address.

#### `approve(address spender, uint256 amount)`
Approve spender to use tokens.

---

## QuestHubV2

Central hub for completing quests.

### Quest Types

| ID | Type | Reward |
|----|------|--------|
| 0 | Daily Login | 10 QUEST |
| 1 | Social Share | 20 QUEST |
| 2 | Referral | 50 QUEST |
| 3 | Staking | 100 QUEST |
| 4 | Special | 200 QUEST |

### Read Functions

#### `getUserStreak(address user)`
Get user's current daily streak.
- **Returns:** `uint256` - Number of consecutive days

#### `hasCompletedToday(address user, uint8 questType)`
Check if user completed a specific quest today.
- **Returns:** `bool`

#### `getQuestReward(uint8 questType)`
Get the reward amount for a quest type.
- **Returns:** `uint256` - Reward in wei

#### `getLastQuestTime(address user, uint8 questType)`
Get timestamp of last quest completion.
- **Returns:** `uint256` - Unix timestamp

### Write Functions

#### `completeQuest(uint8 questType)`
Complete a quest and earn rewards.
- **Parameters:** `questType` - Quest type ID (0-4)
- **Emits:** `QuestCompleted(address user, uint8 questType, uint256 reward)`

---

## QuestVaultV2

Manages reward distribution and claims.

### Read Functions

#### `getPendingRewards(address user)`
Get pending unclaimed rewards.
- **Returns:** `uint256` - Pending amount in wei

#### `getTotalRewardsEarned(address user)`
Get total rewards ever earned by user.
- **Returns:** `uint256` - Total in wei

#### `getClaimableAmount(address user)`
Get amount that can be claimed now.
- **Returns:** `uint256` - Claimable in wei

### Write Functions

#### `claimRewards()`
Claim all pending rewards.
- **Emits:** `RewardsClaimed(address user, uint256 amount)`

---

## QuestBooster

Manages reward multiplier boosters.

### Booster Tiers

| Tier | Name | Multiplier |
|------|------|------------|
| 0 | None | 1.0x |
| 1 | Bronze | 1.1x |
| 2 | Silver | 1.25x |
| 3 | Gold | 1.5x |
| 4 | Platinum | 2.0x |
| 5 | Diamond | 3.0x |

### Read Functions

#### `getUserBooster(address user)`
Get user's active booster tier.
- **Returns:** `uint8` - Tier ID

#### `getBoosterMultiplier(uint8 tier)`
Get multiplier for a tier.
- **Returns:** `uint256` - Multiplier (100 = 1x)

#### `isBoosterActive(address user)`
Check if user has an active booster.
- **Returns:** `bool`

#### `getBoosterExpiry(address user)`
Get booster expiration timestamp.
- **Returns:** `uint256` - Unix timestamp

### Write Functions

#### `activateBooster(uint8 tier)`
Activate a booster tier.
- **Parameters:** `tier` - Tier ID (1-5)
- **Emits:** `BoosterActivated(address user, uint8 tier, uint256 expiry)`

---

## JavaScript Integration Example

```javascript
import { ethers } from 'ethers';

// Connect to Base
const provider = new ethers.JsonRpcProvider('https://mainnet.base.org');

// Contract addresses
const QUEST_HUB = '0x957b578Ac7469BDD5f0c4097C8B98200553b12ba';
const QUEST_VAULT = '0x449436Ed23595Fc95bf19181cca63cE83f0b5EC0';

// Connect wallet
const signer = await provider.getSigner();

// Create contract instance
const hub = new ethers.Contract(QUEST_HUB, [
    'function completeQuest(uint8 questType)',
    'function getUserStreak(address) view returns (uint256)'
], signer);

// Complete daily login quest
const tx = await hub.completeQuest(0);
await tx.wait();
console.log('Quest completed!');

// Check streak
const streak = await hub.getUserStreak(signer.address);
console.log('Current streak:', streak.toString());
```

## Error Codes

| Code | Message | Description |
|------|---------|-------------|
| QuestAlreadyCompleted | "Quest already completed today" | User already did this quest |
| InvalidQuestType | "Invalid quest type" | Quest type not 0-4 |
| NoRewardsToClaim | "No rewards to claim" | Pending rewards is 0 |
| InsufficientBalance | "Insufficient token balance" | Vault lacks tokens |
| BoosterExpired | "Booster has expired" | Need to renew booster |

## Events

### QuestCompleted
```solidity
event QuestCompleted(
    address indexed user,
    uint8 questType,
    uint256 reward
);
```

### RewardsClaimed
```solidity
event RewardsClaimed(
    address indexed user,
    uint256 amount
);
```

### BoosterActivated
```solidity
event BoosterActivated(
    address indexed user,
    uint8 tier,
    uint256 expiry
);
```

---

## Rate Limits

- Daily quests: Once per 24 hours
- Claims: No limit
- Boosters: Can be upgraded anytime

## Support

For issues or questions:
- GitHub: [Issues](https://github.com/AdekunleBamz/Quest_Mini/issues)
- Farcaster: @questmini
