const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🚀 Starting QuantumNFT deployment...\n");
  
  try {
    // Get deployer account
    const [deployer] = await ethers.getSigners();
    console.log("📱 Deployer Address:", deployer.address);
    
    // Check balance
    const balance = await deployer.getBalance();
    console.log("💰 Deployer Balance:", ethers.utils.formatEther(balance), "ETH");
    
    // Check if we're on a testnet and need test ETH
    const network = await ethers.provider.getNetwork();
    if (network.name !== "localhost" && network.name !== "hardhat") {
      if (balance.lt(ethers.utils.parseEther("0.01"))) {
        console.warn("⚠️  Low balance. You need test ETH for gas fees.");
        console.log("\n💡 Get test ETH for:", network.name);
        console.log("   Your address:", deployer.address);
        return;
      }
    }
    
    console.log("\n📄 Compiling and deploying QuantumNFT contract...");
    
    // Deploy QuantumNFT
    const QuantumNFT = await ethers.getContractFactory("QuantumNFT");
    const quantumNFT = await QuantumNFT.deploy();
    
    console.log("⏳ Waiting for deployment confirmation...");
    await quantumNFT.deployed();
    
    console.log("\n✅ DEPLOYMENT SUCCESSFUL!");
    console.log("📍 Contract Address:", quantumNFT.address);
    console.log("📝 Transaction Hash:", quantumNFT.deployTransaction.hash);
    
    // Get contract details
    console.log("\n📊 Contract Details:");
    const name = await quantumNFT.name();
    const symbol = await quantumNFT.symbol();
    const owner = await quantumNFT.owner();
    const mintPrice = await quantumNFT.mintPrice();
    const maxSupply = await quantumNFT.MAX_SUPPLY();
    const mintActive = await quantumNFT.mintActive();
    
    console.log("   Name:", name);
    console.log("   Symbol:", symbol);
    console.log("   Owner:", owner);
    console.log("   Mint Price:", ethers.utils.formatEther(mintPrice), "ETH");
    console.log("   Max Supply:", maxSupply.toString());
    console.log("   Mint Active:", mintActive);
    
    // Save deployment info
    const deploymentInfo = {
      network: {
        name: network.name,
        chainId: network.chainId.toString()
      },
      contract: {
        name: "QuantumNFT",
        address: quantumNFT.address,
        deployer: deployer.address,
        transactionHash: quantumNFT.deployTransaction.hash,
        timestamp: new Date().toISOString()
      },
      details: {
        name,
        symbol,
        owner,
        mintPrice: ethers.utils.formatEther(mintPrice),
        maxSupply: maxSupply.toString(),
        mintActive
      }
    };
    
    // Create deployments folder if it doesn't exist
    const deploymentsDir = path.join(__dirname, "..", "deployments");
    if (!fs.existsSync(deploymentsDir)) {
      fs.mkdirSync(deploymentsDir, { recursive: true });
    }
    
    // Save to file
    const filename = `deployment-${network.name}-${Date.now()}.json`;
    fs.writeFileSync(
      path.join(deploymentsDir, filename),
      JSON.stringify(deploymentInfo, null, 2)
    );
    
    console.log("\n💾 Deployment info saved to: deployments/" + filename);
    console.log("\n🎉 Deployment complete!");
    
    // Verification instructions for testnets
    if (network.name !== "localhost" && network.name !== "hardhat") {
      console.log("\n🔍 To verify on Etherscan, run:");
      console.log(`   npx hardhat verify --network ${network.name} ${quantumNFT.address}`);
    }
    
  } catch (error) {
    console.error("\n❌ DEPLOYMENT FAILED!");
    console.error("Error:", error.message);
    
    if (error.message.includes("insufficient funds")) {
      console.log("\n💡 Get test ETH from a faucet first!");
    }
    
    if (error.message.includes("network")) {
      console.log("\n💡 Check your hardhat.config.js has correct network settings");
    }
    
    console.log("\n🔧 Full error for debugging:", error);
    process.exit(1);
  }
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });