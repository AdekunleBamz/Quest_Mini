# Quest Mini App - Deployment Guide

## Prerequisites

Before deploying the Quest Mini contracts, ensure you have:

1. **Node.js** v18 or higher
2. **Hardhat** or **Foundry** for contract deployment
3. **ETH on Base** for gas fees
4. **Private key** of deployer wallet

## Contract Deployment Order

The contracts must be deployed in a specific order due to dependencies:

```
1. QuestToken (standalone)
2. QuestVaultV2 (needs Token address)
3. QuestHubV2 (needs Token + Vault addresses)
4. QuestBooster (needs Hub address)
```

## Step-by-Step Deployment

### 1. Deploy QuestToken

```javascript
const QuestToken = await ethers.getContractFactory("QuestToken");
const token = await QuestToken.deploy(
    "Quest Token",           // name
    "QUEST",                 // symbol
    1000000000               // max supply (1 billion)
);
await token.waitForDeployment();
console.log("QuestToken:", await token.getAddress());
```

### 2. Deploy QuestVaultV2

```javascript
const QuestVaultV2 = await ethers.getContractFactory("QuestVaultV2");
const vault = await QuestVaultV2.deploy(
    tokenAddress             // QuestToken address
);
await vault.waitForDeployment();
console.log("QuestVaultV2:", await vault.getAddress());
```

### 3. Deploy QuestHubV2

```javascript
const QuestHubV2 = await ethers.getContractFactory("QuestHubV2");
const hub = await QuestHubV2.deploy(
    tokenAddress,            // QuestToken address
    vaultAddress             // QuestVaultV2 address
);
await hub.waitForDeployment();
console.log("QuestHubV2:", await hub.getAddress());
```

### 4. Deploy QuestBooster

```javascript
const QuestBooster = await ethers.getContractFactory("QuestBooster");
const booster = await QuestBooster.deploy(
    hubAddress               // QuestHubV2 address
);
await booster.waitForDeployment();
console.log("QuestBooster:", await booster.getAddress());
```

## Post-Deployment Configuration

### Link Contracts Together

After deployment, you need to configure the contracts to work together:

```javascript
// 1. Add VaultV2 as minter on Token
await token.addMinter(vaultAddress);
console.log("Added Vault as minter");

// 2. Set Hub on Vault
await vault.setQuestHub(hubAddress);
console.log("Set Hub on Vault");

// 3. Set Booster on Hub
await hub.setBooster(boosterAddress);
console.log("Set Booster on Hub");

// 4. Set Hub on Booster
await booster.setQuestHub(hubAddress);
console.log("Set Hub on Booster");
```

### Verify Linking

```javascript
// Verify minter role
const isMinter = await token.isMinter(vaultAddress);
console.log("Vault is minter:", isMinter);

// Verify hub connection
const vaultHub = await vault.questHub();
console.log("Vault's Hub:", vaultHub);
```

## Using Remix IDE

If deploying via Remix:

1. **Compile** each contract with Solidity 0.8.20+
2. **Deploy** in the order specified above
3. **Copy** each deployed address
4. **Paste** addresses as constructor arguments for next contract
5. **Run** the linking functions via Remix's function interface

### Remix Linking Steps

1. On QuestToken: Call `addMinter(vaultAddress)`
2. On QuestVaultV2: Call `setQuestHub(hubAddress)`
3. On QuestHubV2: Call `setBooster(boosterAddress)`
4. On QuestBooster: Call `setQuestHub(hubAddress)`

## Verification

Verify contracts on BaseScan:

```bash
# Using Hardhat
npx hardhat verify --network base <CONTRACT_ADDRESS> <CONSTRUCTOR_ARGS>

# Example for QuestToken
npx hardhat verify --network base \
  0xb3E3DE7248E69B1842C274fD1304d4419a734de7 \
  "Quest Token" "QUEST" 1000000000
```

## Environment Variables

Create a `.env` file:

```env
PRIVATE_KEY=your_deployer_private_key
BASE_RPC_URL=https://mainnet.base.org
BASESCAN_API_KEY=your_basescan_api_key
```

## Hardhat Config

```javascript
// hardhat.config.js
module.exports = {
  solidity: "0.8.20",
  networks: {
    base: {
      url: process.env.BASE_RPC_URL,
      accounts: [process.env.PRIVATE_KEY],
      chainId: 8453
    }
  },
  etherscan: {
    apiKey: {
      base: process.env.BASESCAN_API_KEY
    },
    customChains: [{
      network: "base",
      chainId: 8453,
      urls: {
        apiURL: "https://api.basescan.org/api",
        browserURL: "https://basescan.org"
      }
    }]
  }
};
```

## Gas Estimates

Approximate gas costs for deployment (at 0.1 gwei):

| Contract | Gas Used | Cost (ETH) |
|----------|----------|------------|
| QuestToken | ~1,200,000 | ~0.00012 |
| QuestVaultV2 | ~800,000 | ~0.00008 |
| QuestHubV2 | ~1,500,000 | ~0.00015 |
| QuestBooster | ~900,000 | ~0.00009 |
| **Total** | ~4,400,000 | ~0.00044 |

## Troubleshooting

### "Execution reverted"
- Check constructor arguments are correct
- Ensure sufficient ETH for gas

### "Contract not verified"
- Ensure constructor args match exactly
- Use flattened source if needed

### "Minter not set"
- Run `addMinter()` on Token contract
- Only owner can add minters

### "Hub not linked"
- Run linking functions in correct order
- Check each contract's owner

## Security Checklist

- [ ] Deployer wallet is secure
- [ ] All contracts verified on BaseScan
- [ ] Ownership transferred to multisig (production)
- [ ] Minter roles limited to Vault only
- [ ] Emergency pause tested
- [ ] No admin keys remain on hot wallets

## Support

For deployment assistance:
- GitHub Issues: [Quest_Mini](https://github.com/AdekunleBamz/Quest_Mini/issues)
