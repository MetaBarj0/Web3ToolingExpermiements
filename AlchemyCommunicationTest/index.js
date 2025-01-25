import { ethers } from "ethers";

const url =
  "https://eth-sepolia.g.alchemy.com/v2/iLvdfFWSVQ60fL1Gzgw-t8Kx8-Rk0vIi";
const provider = new ethers.JsonRpcProvider(url);
const blockNumber = await provider.getBlockNumber();
console.log(blockNumber);
