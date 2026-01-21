const hre = require("hardhat");

async function main() {
    console.log("Starting Quest Mini deployment to", hre.network.name);
    console.log("================================================\n");

    const [deployer] = await hre.ethers.getSigners();
    console.log("Deploying with account:", deployer.address);
    console.log("Account balance:", (await hre.ethers.provider.getBalance(deployer.address)).toString());
    console.log("");

    // Deploy QuestToken
    console.log("1. Deploying QuestToken...");
    const QuestToken = await hre.ethers.getContractFactory("QuestToken");
    const token = await QuestToken.deploy("Quest Token", "QUEST", 1000000000);
    await token.waitForDeployment();
    const tokenAddress = await token.getAddress();
    console.log("   QuestToken deployed to:", tokenAddress);

    // Deploy QuestVaultV2
    console.log("2. Deploying QuestVaultV2...");
    const QuestVaultV2 = await hre.ethers.getContractFactory("QuestVaultV2");
    const vault = await QuestVaultV2.deploy(tokenAddress);
    await vault.waitForDeployment();
    const vaultAddress = await vault.getAddress();
    console.log("   QuestVaultV2 deployed to:", vaultAddress);

    // Deploy QuestHubV2
    console.log("3. Deploying QuestHubV2...");
    const QuestHubV2 = await hre.ethers.getContractFactory("QuestHubV2");
    const hub = await QuestHubV2.deploy(tokenAddress, vaultAddress);
    await hub.waitForDeployment();
    const hubAddress = await hub.getAddress();
    console.log("   QuestHubV2 deployed to:", hubAddress);

    // Deploy QuestBooster
    console.log("4. Deploying QuestBooster...");
    const QuestBooster = await hre.ethers.getContractFactory("QuestBooster");
    const booster = await QuestBooster.deploy(hubAddress);
    await booster.waitForDeployment();
    const boosterAddress = await booster.getAddress();
    console.log("   QuestBooster deployed to:", boosterAddress);

    console.log("\n================================================");
    console.log("Deployment complete! Now linking contracts...\n");

    // Link contracts
    console.log("5. Adding Vault as minter on Token...");
    const tx1 = await token.addMinter(vaultAddress);
    await tx1.wait();
    console.log("   Done!");

    console.log("6. Setting Hub on Vault...");
    const tx2 = await vault.setQuestHub(hubAddress);
    await tx2.wait();
    console.log("   Done!");

    console.log("7. Setting Booster on Hub...");
    const tx3 = await hub.setBooster(boosterAddress);
    await tx3.wait();
    console.log("   Done!");

    console.log("8. Setting Hub on Booster...");
    const tx4 = await booster.setQuestHub(hubAddress);
    await tx4.wait();
    console.log("   Done!");

    console.log("\n================================================");
    console.log("All contracts deployed and linked successfully!\n");
    console.log("Contract Addresses:");
    console.log("-------------------");
    console.log("QuestToken:    ", tokenAddress);
    console.log("QuestVaultV2:  ", vaultAddress);
    console.log("QuestHubV2:    ", hubAddress);
    console.log("QuestBooster:  ", boosterAddress);
    console.log("");

    // Save deployment info
    const deploymentInfo = {
        network: hre.network.name,
        chainId: hre.network.config.chainId,
        deployer: deployer.address,
        contracts: {
            QuestToken: tokenAddress,
            QuestVaultV2: vaultAddress,
            QuestHubV2: hubAddress,
            QuestBooster: boosterAddress
        },
        timestamp: new Date().toISOString()
    };

    console.log("Deployment Info (save this!):");
    console.log(JSON.stringify(deploymentInfo, null, 2));

    // Verification instructions
    if (hre.network.name !== "localhost" && hre.network.name !== "hardhat") {
        console.log("\n================================================");
        console.log("To verify contracts on BaseScan, run:\n");
        console.log(`npx hardhat verify --network ${hre.network.name} ${tokenAddress} "Quest Token" "QUEST" 1000000000`);
        console.log(`npx hardhat verify --network ${hre.network.name} ${vaultAddress} ${tokenAddress}`);
        console.log(`npx hardhat verify --network ${hre.network.name} ${hubAddress} ${tokenAddress} ${vaultAddress}`);
        console.log(`npx hardhat verify --network ${hre.network.name} ${boosterAddress} ${hubAddress}`);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
