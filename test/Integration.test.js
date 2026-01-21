const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("Full Integration Tests", function () {
    let QuestToken, QuestHubV2, QuestVaultV2, QuestBooster;
    let token, hub, vault, booster;
    let owner, user1, user2, user3;

    const QUEST_TYPES = {
        DAILY_LOGIN: 0,
        SOCIAL_SHARE: 1,
        REFERRAL: 2,
        STAKING: 3,
        SPECIAL: 4
    };

    const BOOSTER_TIERS = {
        NONE: 0,
        BRONZE: 1,
        SILVER: 2,
        GOLD: 3,
        PLATINUM: 4,
        DIAMOND: 5
    };

    beforeEach(async function () {
        [owner, user1, user2, user3] = await ethers.getSigners();

        // Deploy all contracts
        QuestToken = await ethers.getContractFactory("QuestToken");
        token = await QuestToken.deploy("Quest Token", "QUEST", 1000000000);
        await token.waitForDeployment();

        QuestVaultV2 = await ethers.getContractFactory("QuestVaultV2");
        vault = await QuestVaultV2.deploy(await token.getAddress());
        await vault.waitForDeployment();

        QuestHubV2 = await ethers.getContractFactory("QuestHubV2");
        hub = await QuestHubV2.deploy(
            await token.getAddress(),
            await vault.getAddress()
        );
        await hub.waitForDeployment();

        QuestBooster = await ethers.getContractFactory("QuestBooster");
        booster = await QuestBooster.deploy(await hub.getAddress());
        await booster.waitForDeployment();

        // Link all contracts
        await token.addMinter(await vault.getAddress());
        await vault.setQuestHub(await hub.getAddress());
        await hub.setBooster(await booster.getAddress());
        await booster.setQuestHub(await hub.getAddress());
    });

    describe("Complete User Journey", function () {
        it("Should complete full quest-earn-claim cycle", async function () {
            // User completes daily login
            await hub.connect(user1).completeQuest(QUEST_TYPES.DAILY_LOGIN);
            
            // Check pending rewards
            const pending = await vault.getPendingRewards(user1.address);
            expect(pending).to.equal(ethers.parseEther("10"));

            // Claim rewards
            await vault.connect(user1).claimRewards();

            // Verify token balance
            const balance = await token.balanceOf(user1.address);
            expect(balance).to.equal(ethers.parseEther("10"));

            // Verify pending is now zero
            expect(await vault.getPendingRewards(user1.address)).to.equal(0);
        });

        it("Should handle 7-day streak with bonus", async function () {
            // Complete quests for 7 days
            for (let i = 0; i < 7; i++) {
                await hub.connect(user1).completeQuest(QUEST_TYPES.DAILY_LOGIN);
                if (i < 6) {
                    await time.increase(86400); // Next day
                }
            }

            // Check streak
            expect(await hub.getUserStreak(user1.address)).to.equal(7);

            // Claim all rewards
            await vault.connect(user1).claimRewards();

            // Balance should include streak bonus
            const balance = await token.balanceOf(user1.address);
            expect(balance).to.be.gt(ethers.parseEther("70")); // > 7 * 10 due to streak bonus
        });

        it("Should apply booster to rewards", async function () {
            // Activate gold booster (1.5x)
            await booster.connect(user1).activateBooster(BOOSTER_TIERS.GOLD);

            // Complete quest
            await hub.connect(user1).completeQuest(QUEST_TYPES.DAILY_LOGIN);

            // Claim
            await vault.connect(user1).claimRewards();

            // Should get 15 QUEST (10 * 1.5)
            const balance = await token.balanceOf(user1.address);
            expect(balance).to.equal(ethers.parseEther("15"));
        });

        it("Should combine streak bonus and booster", async function () {
            // Activate gold booster
            await booster.connect(user1).activateBooster(BOOSTER_TIERS.GOLD);

            // Build 7-day streak
            for (let i = 0; i < 7; i++) {
                await hub.connect(user1).completeQuest(QUEST_TYPES.DAILY_LOGIN);
                if (i < 6) {
                    await time.increase(86400);
                }
            }

            await vault.connect(user1).claimRewards();

            // Should be significantly more than base rewards
            const balance = await token.balanceOf(user1.address);
            expect(balance).to.be.gt(ethers.parseEther("100")); // Much more with combined bonuses
        });
    });

    describe("Multiple Users", function () {
        it("Should handle concurrent users correctly", async function () {
            // All users complete quests
            await hub.connect(user1).completeQuest(QUEST_TYPES.DAILY_LOGIN);
            await hub.connect(user2).completeQuest(QUEST_TYPES.SOCIAL_SHARE);
            await hub.connect(user3).completeQuest(QUEST_TYPES.REFERRAL);

            // Check individual pending rewards
            expect(await vault.getPendingRewards(user1.address)).to.equal(ethers.parseEther("10"));
            expect(await vault.getPendingRewards(user2.address)).to.equal(ethers.parseEther("20"));
            expect(await vault.getPendingRewards(user3.address)).to.equal(ethers.parseEther("50"));

            // All claim
            await vault.connect(user1).claimRewards();
            await vault.connect(user2).claimRewards();
            await vault.connect(user3).claimRewards();

            // Verify balances
            expect(await token.balanceOf(user1.address)).to.equal(ethers.parseEther("10"));
            expect(await token.balanceOf(user2.address)).to.equal(ethers.parseEther("20"));
            expect(await token.balanceOf(user3.address)).to.equal(ethers.parseEther("50"));
        });

        it("Should track streaks independently", async function () {
            // Day 1: All users complete
            await hub.connect(user1).completeQuest(QUEST_TYPES.DAILY_LOGIN);
            await hub.connect(user2).completeQuest(QUEST_TYPES.DAILY_LOGIN);

            await time.increase(86400); // Day 2

            // Only user1 completes
            await hub.connect(user1).completeQuest(QUEST_TYPES.DAILY_LOGIN);

            await time.increase(86400); // Day 3

            // Both complete
            await hub.connect(user1).completeQuest(QUEST_TYPES.DAILY_LOGIN);
            await hub.connect(user2).completeQuest(QUEST_TYPES.DAILY_LOGIN);

            // User1 has streak of 3, user2 has streak of 1 (reset)
            expect(await hub.getUserStreak(user1.address)).to.equal(3);
            expect(await hub.getUserStreak(user2.address)).to.equal(1);
        });
    });

    describe("All Quest Types", function () {
        it("Should complete all quest types and accumulate rewards", async function () {
            // Complete all quest types
            await hub.connect(user1).completeQuest(QUEST_TYPES.DAILY_LOGIN);   // 10
            await hub.connect(user1).completeQuest(QUEST_TYPES.SOCIAL_SHARE);  // 20
            await hub.connect(user1).completeQuest(QUEST_TYPES.REFERRAL);      // 50
            await hub.connect(user1).completeQuest(QUEST_TYPES.STAKING);       // 100
            await hub.connect(user1).completeQuest(QUEST_TYPES.SPECIAL);       // 200

            // Total pending should be 380
            const pending = await vault.getPendingRewards(user1.address);
            expect(pending).to.equal(ethers.parseEther("380"));

            // Claim all
            await vault.connect(user1).claimRewards();
            expect(await token.balanceOf(user1.address)).to.equal(ethers.parseEther("380"));
        });
    });

    describe("Token Supply Management", function () {
        it("Should not exceed max supply", async function () {
            const maxSupply = await token.maxSupply();
            
            // Mint close to max
            await token.addMinter(owner.address);
            await token.mint(owner.address, maxSupply - ethers.parseEther("100"));

            // Quest rewards should still work
            await hub.connect(user1).completeQuest(QUEST_TYPES.DAILY_LOGIN);
            await vault.connect(user1).claimRewards();

            // Total supply should not exceed max
            expect(await token.totalSupply()).to.be.lte(maxSupply);
        });
    });

    describe("Emergency Pause", function () {
        it("Should pause entire system", async function () {
            // Pause all contracts
            await hub.pause();
            await vault.pause();
            await booster.pause();

            // All operations should fail
            await expect(hub.connect(user1).completeQuest(QUEST_TYPES.DAILY_LOGIN)).to.be.reverted;
            await expect(vault.connect(user1).claimRewards()).to.be.reverted;
            await expect(booster.connect(user1).activateBooster(1)).to.be.reverted;
        });

        it("Should resume after unpause", async function () {
            await hub.pause();
            await hub.unpause();

            // Should work again
            await hub.connect(user1).completeQuest(QUEST_TYPES.DAILY_LOGIN);
            expect(await hub.hasCompletedToday(user1.address, QUEST_TYPES.DAILY_LOGIN)).to.be.true;
        });
    });
});
