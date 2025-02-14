import * as chai from "chai";
import chaiAsPromised from "chai-as-promised";
import { ethers } from "hardhat";
import { Contract, Signer, Signers } from "./typesUtils.ts";

chai.use(chaiAsPromised);
chai.should();

describe("ERC721 contract", () => {
  let signers: Signers;
  let contract: Contract;

  before(async () => {
    signers = await ethers.getSigners();
  });

  beforeEach(async () => {
    contract = await ethers.deployContract("ERC721");
  });

  describe("Deployment", () => {
    it("should set the correct owner", () => {
      const [owner] = signers;

      return contract.owner().should.eventually.equal(owner);
    });
  });

  describe("Read contract", () => {
    it("returns 0 for an account having no NFT", () => {
      const [owner] = signers;

      return contract.balanceOf(owner)
        .should.eventually.equal(0n);
    });

    it("updates the balance for a minter", async () => {
      const [owner, account] = signers;

      await mintTokens(contract, owner, 2n);
      await mintTokens(contract, account, 3n);

      return Promise.all([
        contract.balanceOf(owner)
          .should.eventually.equal(2n),
        contract.balanceOf(account)
          .should.eventually.equal(3n),
      ]);
    });

    it("should revert with a InvalidTokenId error when querying the owner with an invalid token id", () => {
      const invalidTokenIdentifiers = [0n, 1n, 42n];

      return invalidTokenIdentifiers.map((tokenId) =>
        contract.ownerOf(tokenId)
          .should.be.revertedWithCustomError(contract, "InvalidTokenId")
      );
    });
  });

  describe("Minting and burning", () => {
    it("is not possible to mint NFT for free", () => {
      const [owner] = signers;

      return contract.connect(owner)
        .mint()
        .should.be.revertedWithCustomError(contract, "IncorrectEthAmount")
        .withArgs(ethers.parseEther("0.01"));
    });

    it("costs 0.01 eth to mint the very first NFT and it updates the buyer balance", async () => {
      const [owner] = signers;
      const tokenPrice = await contract.tokenPrice();

      const tx = await contract.connect(owner)
        .mint({ value: tokenPrice });
      await tx.wait();

      return contract.balanceOf(owner)
        .should.eventually.equal(1n);
    });

    it("costs twice to mint the next NFT", async () => {
      const [owner, account] = signers;
      const firstTokenPrice = await contract.tokenPrice();

      const tx = await contract.connect(owner)
        .mint({ value: firstTokenPrice });
      await tx.wait();

      return contract.connect(account)
        .tokenPrice()
        .should.eventually.equal(ethers.parseEther("0.02"));
    });

    it("is not possible to mint more than 10 tokens", async () => {
      const [owner] = signers;

      await mintTokens(contract, owner, 10n);

      return contract.connect(owner).mint({
        value: await contract.tokenPrice(),
      })
        .should.be.revertedWithCustomError(
          contract,
          "TokenSupplyExhausted",
        );
    });

    it("should emit a Transfer event at token minting with from address being 0", async () => {
      const [owner, account] = signers;

      const txOwner = await contract.connect(owner)
        .mint({ value: await contract.tokenPrice() });
      await txOwner.wait();

      const txAccount = await contract.connect(account)
        .mint({ value: await contract.tokenPrice() });
      await txAccount.wait();

      return Promise.all([
        txOwner
          .should.emit(contract, "Transfer")
          .withArgs(ethers.ZeroAddress, owner, 1n),
        txAccount
          .should.emit(contract, "Transfer")
          .withArgs(ethers.ZeroAddress, account, 2n),
      ]);
    });
  });
});

async function mintTokens(contract: Contract, owner: Signer, count: bigint) {
  for (let index = 0n; index < count; index++) {
    const tx = await contract.connect(owner).mint({
      value: await contract.tokenPrice(),
    });

    await tx.wait();
  }
}
