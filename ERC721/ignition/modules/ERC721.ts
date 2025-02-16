import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("ERC721Module", (module) => {
  const erc721 = module.contract("ERC721");

  return { erc721 };
});
