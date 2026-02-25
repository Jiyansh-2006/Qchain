const hre = require("hardhat");

async function main() {
  console.log("🚀 Starting QuantumNFT deployment...\n");
  
  try {
    // Get the deployer
    const [deployer] = await hre.ethers.getSigners();
    console.log("📱 Deployer Address:", deployer.address);
    
    // Get balance using provider (more compatible)
    const balance = await hre.ethers.provider.getBalance(deployer.address);
    console.log("💰 Deployer Balance:", hre.ethers.formatEther(balance), "ETH\n");
    
    console.log("🔨 Deploying QuantumNFT contract...");
    
    // Get the contract factory
    const QuantumNFT = await hre.ethers.getContractFactory("QuantumNFT");
    
    // Deploy the contract
    const quantumNFT = await QuantumNFT.deploy();
    
    // Wait for deployment
    console.log("⏳ Waiting for deployment confirmation...");
    await quantumNFT.waitForDeployment();
    
    const contractAddress = await quantumNFT.getAddress();
    console.log(`✅ QuantumNFT deployed to: ${contractAddress}`);
    
    // Get contract details
    console.log("\n📊 Contract Details:");
    console.log(`   Name: ${await quantumNFT.name()}`);
    console.log(`   Symbol: ${await quantumNFT.symbol()}`);
    console.log(`   Owner: ${await quantumNFT.owner()}`);
    console.log(`   Mint Price: ${hre.ethers.formatEther(await quantumNFT.mintPrice())} ETH`);
    console.log(`   Max Supply: ${await quantumNFT.MAX_SUPPLY()}`);
    
    console.log("\n🎉 Deployment completed successfully!");
    
  } catch (error) {
    console.error("\n❌ Deployment failed!");
    console.error("Error:", error.message);
    process.exit(1);
  }
}

main();