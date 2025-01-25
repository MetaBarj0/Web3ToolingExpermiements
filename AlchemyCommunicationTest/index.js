import { ethers } from "ethers";

class Playground {
  constructor(opts) {
    this.provider = new ethers.JsonRpcProvider(opts.providerUrl);
  }

  async printLastBlockNumber() {
    const blockNumber = await this.provider.getBlockNumber();

    console.log(blockNumber);
  }

  async printLastContent() {
    const blockContent = await this.provider.getBlock(
      await this.printLastBlockNumber(),
    );

    console.log(blockContent);
  }

  async printBalance(address) {
    if (address === "") {
      return;
    }

    const balance = await this.provider.getBalance(address);

    console.log(ethers.formatUnits(balance, "ether"));
  }

  async transfer(opts) {
    const { signerPrivateKey, to } = opts;

    if (signerPrivateKey === "" || to === "") {
      return;
    }

    const signer = new ethers.Wallet(signerPrivateKey, this.provider);
    const amount = ethers.parseEther("0.01");
    const tx = await signer.sendTransaction({ to, value: amount });

    await tx.wait();

    console.log(`Done! ${amount} wei have been transferred to ${to}!`);
  }
}

async function main() {
  const playground = new Playground({
    providerUrl:
      "https://eth-sepolia.g.alchemy.com/v2/iLvdfFWSVQ60fL1Gzgw-t8Kx8-Rk0vIi",
  });

  await playground.printLastBlockNumber();
  await playground.printLastContent();
  await playground.printBalance("");
  await playground.transfer({ signerPrivateKey: "", to: "" });
}

await main();
