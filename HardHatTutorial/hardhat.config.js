require("@nomicfoundation/hardhat-toolbox");
require("hardhat-watcher");

const { vars } = require("hardhat/config");

const ALCHEMY_API_KEY = vars.get("ALCHEMY_API_KEY");
const SEPOLIA_PRIVATE_KEY = vars.get("SEPOLIA_PRIVATE_KEY");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.28",
  networks: {
    sepolia: {
      url: `https://eth-sepolia.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
      accounts: [SEPOLIA_PRIVATE_KEY],
    },
  },
  watcher: {
    compile: {
      tasks: ["compile"],
      files: ["./contracts"],
      verbose: true,
      clearOnStart: true,
    },
    test: {
      tasks: [
        {
          command: "test",
        },
      ],
      files: ["./test/**/*.js", "./contracts/**/*.sol"],
      verbose: true,
      clearOnStart: true,
    },
  },
};
