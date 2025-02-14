import { ethers } from "hardhat";

export type Signers = Awaited<ReturnType<typeof ethers.getSigners>>;

type Unpacked<T> = T extends (infer U)[] ? U : never;
export type Signer = Unpacked<Signers>;

const deployContractFactory = async () => await ethers.deployContract("ERC721");
export type Contract = Awaited<ReturnType<typeof deployContractFactory>>;

export type ChainEvent = { args: unknown[] };
