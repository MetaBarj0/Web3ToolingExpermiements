import { ethers } from "ethers";
import process from "node:process";
import abi from "./contractABI.js";

class ProviderAndSigner {
  constructor(signerKey) {
    this.#provider = new ethers.JsonRpcProvider(
      "https://eth-sepolia.g.alchemy.com/v2/iLvdfFWSVQ60fL1Gzgw-t8Kx8-Rk0vIi",
    );

    this.#signer = new ethers.Wallet(signerKey, this.getProvider());
  }

  getProvider() {
    return this.#provider;
  }

  getSigner() {
    return this.#signer;
  }

  #provider;
  #signer;
}

class TransactionsToEOAs extends ProviderAndSigner {
  constructor({ signerKey }) {
    super(signerKey);
  }

  async transactType0RecommendedGasPrice(to) {
    await this.#transactType0({ to });
  }

  async transactType0Cheap(to) {
    await this.#transactType0({
      to,
      gasPrice: (await this.getProvider().getFeeData()).gasPrice * 98n / 100n,
    });
  }

  async transactType0Expensive(to) {
    await this.#transactType0({
      to,
      gasPrice: (await this.getProvider().getFeeData()).gasPrice * 10n,
    });
  }

  async transactType0BadGasLimit(to) {
    await this.#transactType0({ to, gasLimit: 20000n });
  }

  async transactType2RecommendedFees(to, value) {
    await this.#transactType2({ to, value });
  }

  async transactType2TooSmallNonce(to) {
    await this.#transactType2({
      to,
      nonce: await this.getSigner().getNonce() - 1,
    });
  }

  async transactType2NonceAheadOfTime(to) {
    await this.#transactType2({
      to,
      nonce: await this.getSigner().getNonce() + 1,
    });
  }

  async #computeRecommendedFeeData() {
    const currentFeeData = await this.getProvider().getFeeData();

    return {
      maxPriorityFeePerGas: currentFeeData.maxPriorityFeePerGas * 3n,
      maxFeePerGas: currentFeeData.maxFeePerGas -
        currentFeeData.maxPriorityFeePerGas +
        currentFeeData.maxPriorityFeePerGas * 3n,
    };
  }

  async #transactType0(
    {
      to,
      valueInEth = "0.01",
      gasLimit = 21000n,
      gasPrice,
      nonce,
    },
  ) {
    // cannot await for argument default value
    if (!gasPrice) {
      gasPrice = (await this.getProvider().getFeeData()).gasPrice * 15n / 10n;
    }

    // cannot await for argument default value
    if (!nonce) {
      nonce = await this.getSigner().getNonce();
    }

    const tx = await this.getSigner().sendTransaction({
      type: 0,
      to,
      value: ethers.parseEther(valueInEth),
      gasLimit,
      gasPrice,
      nonce,
    });

    const receipt = await tx.wait();

    console.log(receipt);
  }
  async #transactType2(
    {
      to,
      value = "0.01",
      gasLimit = 21000n,
      maxPriorityFeePerGas,
      maxFeePerGas,
      nonce,
    },
  ) {
    if (!maxPriorityFeePerGas || !maxFeePerGas) {
      const feeData = await this.#computeRecommendedFeeData();
      maxPriorityFeePerGas = maxPriorityFeePerGas
        ? maxPriorityFeePerGas
        : feeData.maxPriorityFeePerGas;

      maxFeePerGas = maxFeePerGas ? maxFeePerGas : feeData.maxFeePerGas;
    }

    // cannot await for argument default value
    if (!nonce) {
      nonce = await this.getSigner().getNonce();
    }

    const tx = await this.getSigner().sendTransaction({
      type: 2,
      to,
      value: ethers.parseEther(value),
      gasLimit,
      maxPriorityFeePerGas: maxPriorityFeePerGas,
      maxFeePerGas: maxFeePerGas,
      nonce,
    });

    const receipt = await tx.wait();

    console.log(receipt);
  }
}

class ContractTransactions extends ProviderAndSigner {
  constructor({ signerKey, contractAddress, abi }) {
    super(signerKey);

    this.#contractWriter = new ethers.Contract(
      contractAddress,
      abi,
      this.getSigner(),
    );

    this.#contractReader = new ethers.Contract(
      contractAddress,
      abi,
      this.getProvider(),
    );
  }

  async printContractPublicInfo() {
    const name = await this.#contractReader.name();
    const symbol = await this.#contractReader.symbol();
    const totalSupply = await this.#contractReader.totalSupply();

    console.log({ name, symbol, totalSupply });
  }

  async printContractBalanceOf(address) {
    const balance = await this.#contractReader.balanceOf(address);

    console.log({ address, balance: this.#formatBalance(balance) });
  }

  async transfer({ to, value }) {
    const amount = ethers.parseUnits(value, 17);

    const estimate = await this.#contractWriter.transfer.estimateGas(
      to,
      amount,
    );

    console.log(`estimated gas price: ${estimate}`);

    const tx = await this.#contractWriter.transfer(
      to,
      amount,
      { gasLimit: estimate },
    );

    const receipt = await tx.wait();

    console.log(receipt);
  }

  async printTransferEventCount({ fromBlock, toBlock }) {
    const events = await this.#contractReader.queryFilter(
      "Transfer",
      fromBlock,
      toBlock,
    );

    console.log(`${events.length} events...`);
  }

  #contractReader;
  #contractWriter;

  #formatBalance(balance) {
    // const decimal = await this.#contractReader.decimal();
    const decimal = 17; // I forgot to make this property public...

    return ethers.formatUnits(balance, decimal);
  }
}

async function transactWithEOAs() {
  const transactionsToEOAs = new TransactionsToEOAs({
    signerKey: process.env.SIGNERKEY,
  });

  await transactionsToEOAs.transactType0RecommendedGasPrice(
    "0x23451F1BA8cEb318CE20aa825b97dc12e4fc136F",
  );

  await transactionsToEOAs.transactType2RecommendedFees(
    "0x23451F1BA8cEb318CE20aa825b97dc12e4fc136F",
  );
}

async function transactWithContract() {
  const contractTransactions = new ContractTransactions(
    {
      signerKey: process.env.SIGNERKEY,
      contractAddress: "0xa1d990b7732e00adfaf2e3834675fcae3345c8a7",
      abi,
    },
  );

  await contractTransactions.printContractPublicInfo();

  await contractTransactions.printContractBalanceOf(
    "0xFb3b70beAE334a407975189874A1CD0A91c3C60a",
  );

  await contractTransactions.transfer({
    to: "0x23451F1BA8cEb318CE20aa825b97dc12e4fc136F",
    value: "2",
  });

  await contractTransactions.printTransferEventCount({
    fromBlock: 7582429,
  });
}

async function main() {
  // await transactWithEOAs();
  await transactWithContract();
}

main();
