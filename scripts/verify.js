const hre = require("hardhat");

async function main() {
    const contractAddresses = {
        QuestToken: process.env.QUEST_TOKEN_ADDRESS,
        QuestVaultV2: process.env.QUEST_VAULT_ADDRESS,
        QuestHubV2: process.env.QUEST_HUB_ADDRESS,
        QuestBooster: process.env.QUEST_BOOSTER_ADDRESS
    };

    console.log("Verifying Quest Mini contracts on", hre.network.name);
    console.log("================================================\n");

    // Verify QuestToken
    if (contractAddresses.QuestToken) {
        console.log("Verifying QuestToken...");
        try {
            await hre.run("verify:verify", {
                address: contractAddresses.QuestToken,
                constructorArguments: ["Quest Token", "QUEST", 1000000000]
            });
            console.log("QuestToken verified!\n");
        } catch (error) {
            console.log("QuestToken verification failed:", error.message, "\n");
        }
    }

    // Verify QuestVaultV2
    if (contractAddresses.QuestVaultV2) {
        console.log("Verifying QuestVaultV2...");
        try {
            await hre.run("verify:verify", {
                address: contractAddresses.QuestVaultV2,
                constructorArguments: [contractAddresses.QuestToken]
            });
            console.log("QuestVaultV2 verified!\n");
        } catch (error) {
            console.log("QuestVaultV2 verification failed:", error.message, "\n");
        }
    }

    // Verify QuestHubV2
    if (contractAddresses.QuestHubV2) {
        console.log("Verifying QuestHubV2...");
        try {
            await hre.run("verify:verify", {
                address: contractAddresses.QuestHubV2,
                constructorArguments: [
                    contractAddresses.QuestToken,
                    contractAddresses.QuestVaultV2
                ]
            });
            console.log("QuestHubV2 verified!\n");
        } catch (error) {
            console.log("QuestHubV2 verification failed:", error.message, "\n");
        }
    }

    // Verify QuestBooster
    if (contractAddresses.QuestBooster) {
        console.log("Verifying QuestBooster...");
        try {
            await hre.run("verify:verify", {
                address: contractAddresses.QuestBooster,
                constructorArguments: [contractAddresses.QuestHubV2]
            });
            console.log("QuestBooster verified!\n");
        } catch (error) {
            console.log("QuestBooster verification failed:", error.message, "\n");
        }
    }

    console.log("================================================");
    console.log("Verification complete!");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
