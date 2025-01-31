import { ethers } from "hardhat";

export type Signers = Awaited<ReturnType<typeof ethers.getSigners>>;

const deployContractFactory = async () => await ethers.deployContract("ERC721");
export type Contract = Awaited<ReturnType<typeof deployContractFactory>>;
