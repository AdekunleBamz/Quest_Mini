# Quest Mini App - Architecture Guide

## System Overview

Quest Mini is a decentralized quest-and-earn application built on the Base blockchain. Users complete quests to earn QUEST tokens, with optional boosters to multiply rewards.

```
┌─────────────────────────────────────────────────────────────────┐
│                        Quest Mini App                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐      │
│  │   Frontend   │    │   Farcaster  │    │    Wallet    │      │
│  │   (HTML/JS)  │◄──►│    Frame     │◄──►│  (MetaMask)  │      │
│  └──────┬───────┘    └──────────────┘    └──────┬───────┘      │
│         │                                        │              │
│         └────────────────┬───────────────────────┘              │
│                          │                                      │
│                          ▼                                      │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    Base Blockchain                        │  │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐          │  │
│  │  │ QuestToken │  │ QuestHub   │  │ QuestVault │          │  │
│  │  │   (ERC20)  │◄─┤    V2      │──►│    V2      │          │  │
│  │  └────────────┘  └─────┬──────┘  └────────────┘          │  │
│  │                        │                                  │  │
│  │                        ▼                                  │  │
│  │                  ┌────────────┐                          │  │
│  │                  │   Quest    │                          │  │
│  │                  │  Booster   │                          │  │
│  │                  └────────────┘                          │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Contract Architecture

### QuestToken (ERC20)

The native token of the Quest ecosystem.

**Responsibilities:**
- Standard ERC20 functionality
- Minting capability (controlled by minters)
- Max supply enforcement (1 billion tokens)

**Key Features:**
- Mintable by authorized contracts (Vault)
- Burnable (optional)
- No transfer restrictions

```
┌─────────────────────────────────────┐
│           QuestToken                │
├─────────────────────────────────────┤
│ - name: "Quest Token"               │
│ - symbol: "QUEST"                   │
│ - decimals: 18                      │
│ - maxSupply: 1,000,000,000          │
├─────────────────────────────────────┤
│ + balanceOf(address)                │
│ + transfer(to, amount)              │
│ + mint(to, amount) [minter only]    │
│ + addMinter(address) [owner only]   │
└─────────────────────────────────────┘
```

### QuestHubV2

Central coordinator for quest completion and reward calculation.

**Responsibilities:**
- Quest completion validation
- Streak tracking
- Reward calculation with booster multipliers
- Communication with Vault and Booster

```
┌─────────────────────────────────────┐
│           QuestHubV2                │
├─────────────────────────────────────┤
│ - token: QuestToken                 │
│ - vault: QuestVaultV2               │
│ - booster: QuestBooster             │
│ - streaks: mapping(address => uint) │
├─────────────────────────────────────┤
│ + completeQuest(questType)          │
│ + getUserStreak(address)            │
│ + hasCompletedToday(address, type)  │
│ + getQuestReward(questType)         │
└─────────────────────────────────────┘
```

### QuestVaultV2

Manages reward accumulation and distribution.

**Responsibilities:**
- Track pending rewards per user
- Handle reward claims
- Mint tokens for rewards

```
┌─────────────────────────────────────┐
│          QuestVaultV2               │
├─────────────────────────────────────┤
│ - token: QuestToken                 │
│ - questHub: QuestHubV2              │
│ - pendingRewards: mapping           │
│ - totalEarned: mapping              │
├─────────────────────────────────────┤
│ + addRewards(user, amount) [hub]    │
│ + claimRewards()                    │
│ + getPendingRewards(address)        │
│ + getTotalRewardsEarned(address)    │
└─────────────────────────────────────┘
```

### QuestBooster

Manages reward multiplier boosts.

**Responsibilities:**
- Booster tier management
- Multiplier calculations
- Expiration tracking

```
┌─────────────────────────────────────┐
│          QuestBooster               │
├─────────────────────────────────────┤
│ - questHub: QuestHubV2              │
│ - userTiers: mapping                │
│ - expirations: mapping              │
├─────────────────────────────────────┤
│ + activateBooster(tier)             │
│ + getUserBooster(address)           │
│ + getBoosterMultiplier(tier)        │
│ + isBoosterActive(address)          │
└─────────────────────────────────────┘
```

## Data Flow

### Quest Completion Flow

```
User                Hub                 Vault              Token
 │                   │                    │                  │
 │ completeQuest(0)  │                    │                  │
 │──────────────────►│                    │                  │
 │                   │ Check: completed?  │                  │
 │                   │ Update streak      │                  │
 │                   │ Calculate reward   │                  │
 │                   │                    │                  │
 │                   │ addRewards(user)   │                  │
 │                   │───────────────────►│                  │
 │                   │                    │ Update pending   │
 │                   │                    │                  │
 │                   │◄───────────────────│                  │
 │◄──────────────────│                    │                  │
 │  Event: QuestCompleted                 │                  │
```

### Reward Claim Flow

```
User                Vault              Token
 │                   │                  │
 │ claimRewards()    │                  │
 │──────────────────►│                  │
 │                   │ Check pending    │
 │                   │                  │
 │                   │ mint(user, amt)  │
 │                   │─────────────────►│
 │                   │                  │ Create tokens
 │                   │◄─────────────────│
 │                   │ Reset pending    │
 │◄──────────────────│                  │
 │  Tokens received  │                  │
```

## Security Model

### Access Control

```
┌───────────────────────────────────────────────────────────┐
│                    Access Control                          │
├───────────────────────────────────────────────────────────┤
│                                                           │
│  Owner (Deployer)                                         │
│  ├── Can pause/unpause contracts                          │
│  ├── Can update linked contract addresses                 │
│  ├── Can add/remove minters                               │
│  └── Can transfer ownership                               │
│                                                           │
│  Minter (QuestVaultV2)                                    │
│  └── Can mint tokens (for rewards only)                   │
│                                                           │
│  QuestHub                                                 │
│  └── Can call addRewards on Vault                         │
│                                                           │
│  Users                                                    │
│  ├── Can complete quests                                  │
│  ├── Can claim rewards                                    │
│  └── Can activate boosters                                │
│                                                           │
└───────────────────────────────────────────────────────────┘
```

### Security Features

1. **ReentrancyGuard** - Prevents reentrancy attacks
2. **Pausable** - Emergency stop mechanism
3. **Ownable** - Access control for admin functions
4. **Checks-Effects-Interactions** - Pattern followed

## Frontend Architecture

```
app/
├── index.html          # Main app entry
├── js/
│   ├── app.js          # Main application logic
│   ├── wallet.js       # Wallet connection manager
│   ├── contracts.js    # Contract interactions
│   ├── constants.js    # Configuration constants
│   ├── utils.js        # Utility functions
│   └── toast.js        # Notification system
├── styles/
│   ├── variables.css   # CSS custom properties
│   ├── layout.css      # Grid and flexbox utilities
│   ├── buttons.css     # Button components
│   ├── cards.css       # Card components
│   ├── forms.css       # Form elements
│   ├── modals.css      # Modal dialogs
│   ├── toasts.css      # Toast notifications
│   ├── loading.css     # Loading states
│   └── animations.css  # CSS animations
└── assets/
    └── images/         # Static images
```

## State Management

The app uses a simple reactive state pattern:

```javascript
const state = {
    wallet: {
        connected: false,
        address: null,
        chainId: null
    },
    user: {
        balance: '0',
        streak: 0,
        pendingRewards: '0',
        boosterTier: 0
    },
    quests: {
        completed: {},
        available: []
    }
};
```

## Event System

Contracts emit events for all state changes:

| Event | Contract | When Emitted |
|-------|----------|--------------|
| QuestCompleted | Hub | Quest finished |
| RewardsClaimed | Vault | Rewards claimed |
| BoosterActivated | Booster | Booster enabled |
| StreakUpdated | Hub | Streak changes |

## Scalability Considerations

1. **Gas Optimization** - Minimal storage writes
2. **Batch Operations** - Future support planned
3. **Layer 2** - Built on Base (Ethereum L2)
4. **Upgradability** - V2 contracts support linking updates

## Future Extensions

- [ ] NFT badges for achievements
- [ ] Referral tracking system
- [ ] Governance token voting
- [ ] Cross-chain bridging
- [ ] Staking pools
