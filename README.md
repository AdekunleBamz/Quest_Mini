# 🎮 QuestCoin - Farcaster Mini-App

A complete quest-and-earn token system for Base Chain with a Farcaster Frame mini-app.

## 📦 Project Structure

```
quest-miniapp/
├── contracts/
│   ├── QuestToken.sol    # ERC20 reward token (1B max supply)
│   ├── QuestHub.sol      # Quest management & tracking
│   ├── QuestVault.sol    # Token distribution & claims
│   └── QuestBooster.sol  # Multipliers & streak bonuses
├── app/
│   ├── index.html        # Farcaster Frame mini-app
│   └── app.js            # Web3 interaction logic
└── README.md
```

## 🚀 Deployment Guide

### Step 1: Deploy Contracts on Remix

1. Go to [Remix IDE](https://remix.ethereum.org)
2. Create new files and paste each contract
3. In Compiler tab:
   - Select Solidity version `0.8.20`
   - Enable optimization (200 runs)
4. In Deploy tab:
   - Environment: `Injected Provider - MetaMask`
   - Make sure MetaMask is on **Base Mainnet**

### Step 2: Deploy Order (Important!)

Deploy in this exact order:

| Order | Contract | Constructor Args | Notes |
|-------|----------|------------------|-------|
| 1 | QuestToken | None | Mints 100M to deployer |
| 2 | QuestHub | None | Quest management |
| 3 | QuestVault | None | Reward distribution |
| 4 | QuestBooster | None | Boost calculations |

### Step 3: Link Contracts

After all 4 are deployed, call these functions:

**On QuestToken:**
```
addMinter(QuestVault_Address)
```

**On QuestHub:**
```
setContracts(QuestVault_Address, QuestBooster_Address)
```

**On QuestVault:**
```
setContracts(QuestToken_Address, QuestHub_Address, QuestBooster_Address)
```

**On QuestBooster:**
```
setQuestHub(QuestHub_Address)
```

### Step 4: Configure Mini-App

1. Open `app/index.html` in a browser
2. Click ⚙️ (settings)
3. Enter all 4 contract addresses
4. Set your preferred gas limit
5. Click "Save Settings"

## 🎯 How It Works

### User Flow
1. User connects wallet
2. Clicks "Complete All Quests"
3. 4 transactions execute sequentially:
   - Check-in (+10 QUEST)
   - Engage (+10 QUEST)
   - Commit (+10 QUEST)
   - Claim (+20 QUEST bonus)
4. Tokens minted to user's wallet!

### Reward Structure
| Action | Base Reward |
|--------|-------------|
| Check-in | 10 QUEST |
| Engage | 10 QUEST |
| Commit | 10 QUEST |
| Complete All Bonus | 20 QUEST |
| **Total per session** | **50 QUEST** |

### Boost Multipliers (Streaks)
| Streak | Multiplier |
|--------|------------|
| 0-2 days | 1.0x |
| 3-6 days | 1.1x |
| 7-13 days | 1.25x |
| 14-29 days | 1.5x |
| 30-59 days | 1.75x |
| 60-99 days | 2.0x |
| 100+ days | 2.5x |

## 🖼️ Farcaster Frame Setup

### 1. Host the Mini-App
Deploy `app/` folder to:
- Vercel
- Netlify
- GitHub Pages
- Any static hosting

### 2. Update Meta Tags
In `index.html`, replace:
```html
<meta property="fc:frame:image" content="https://YOUR-DOMAIN.com/frame-image.png" />
<meta property="fc:frame:button:1:target" content="https://YOUR-DOMAIN.com" />
```

### 3. Create Frame Image
Create a 1200x630px image for the frame preview.

### 4. Share on Farcaster
Just share the URL - Farcaster will auto-detect the frame!

## ⚙️ Admin Functions

### QuestToken (Owner)
- `pause()` - Pause minting
- `unpause()` - Resume minting
- `addMinter(address)` - Add minter
- `removeMinter(address)` - Remove minter
- `emergencyWithdraw(token)` - Recover stuck tokens

### QuestHub (Owner)
- `setRewards(checkin, engage, commit, bonus)` - Update rewards
- `pause()` / `unpause()` - Toggle quests

### QuestVault (Owner)
- `pause()` / `unpause()` - Toggle claims
- `emergencyWithdraw(token)` - Recover stuck funds

### QuestBooster (Owner)
- `setBoostTier(index, minStreak, multiplier)` - Update tiers
- `setSpecialBoost(user, boost)` - VIP boosts
- `batchSetSpecialBoosts(users[], boosts[])` - Batch VIP
- `setReferralSettings(bonus, maxBonus)` - Referral config

## 🔐 Security Features

- ✅ Pausable contracts
- ✅ ReentrancyGuard on claims
- ✅ Max supply cap (1 billion)
- ✅ Owner-only admin functions
- ✅ Emergency withdraw capability
- ✅ Minter whitelist

## 📊 Token Economics

| Allocation | Amount | % |
|------------|--------|---|
| Initial (Owner) | 100,000,000 | 10% |
| Quest Rewards | 900,000,000 | 90% |
| **Total Supply** | **1,000,000,000** | **100%** |

## 🌐 Base Mainnet Info

| Property | Value |
|----------|-------|
| Chain ID | 8453 |
| RPC | https://mainnet.base.org |
| Explorer | https://basescan.org |
| Currency | ETH |

## 📝 OpenZeppelin Dependencies

For Remix, import these at the top of each contract:
```solidity
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
```

Remix will auto-fetch from npm.

## 🤝 Support

Questions? Issues? 
- Check contract verification on BaseScan
- Ensure correct deployment order
- Verify all contracts are linked properly

---

**Built for Base Chain 💙**
