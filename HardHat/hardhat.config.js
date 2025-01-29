require("@nomicfoundation/hardhat-toolbox");
require("hardhat-watcher");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.28",
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
