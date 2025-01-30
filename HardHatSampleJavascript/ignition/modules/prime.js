const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

const PrimeModule = buildModule("PrimeModule", (m) => {
  const prime = m.contract("Prime");

  return { prime };
});

module.exports = PrimeModule;
