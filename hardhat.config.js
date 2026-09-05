require("dotenv").config();
require("@matterlabs/hardhat-zksync-deploy");
require("@matterlabs/hardhat-zksync-verify");
require("@matterlabs/hardhat-zksync-solc");

module.exports = {
  solidity: {
    version: "0.8.0", // Matches your Remix deployment
    settings: {
      optimizer: {
        enabled: true,
        runs: 200 // Matches your Remix setting
      },
      evmVersion: "prague", // Matches your Remix EVM version
      metadata: {
        bytecodeHash: "none" // Important for verification
      }
    }
  },
  networks: {
    zkSyncSepolia: {
      url: process.env.RPC_URL,
      chainId: 300,
      ethNetwork: "sepolia",
      zksync: true,
      accounts: [process.env.PRIVATE_KEY],
      verifyURL: "https://explorer.sepolia.era.zksync.dev/contract_verification"
    },
  },
  zksolc: {
    version: "1.3.7", // zkSync compiler version
    compilerSource: "binary",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200 // Must match both Solidity and zksolc optimizer settings
      },
      metadata: {
        bytecodeHash: "none" // Important for consistent bytecode
      }
    }
  }
};