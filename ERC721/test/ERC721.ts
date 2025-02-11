import * as chai from "chai";
import chaiAsPromised from "chai-as-promised";
import { ethers } from "hardhat";
import { Contract, Signers } from "./typesUtils.ts";

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
  });

  describe("Minting and burning", () => {
    it("is not possible to mint NFT for free", () => {
      const [owner] = signers;

      return contract.connect(owner)
        .mint()
        .should.be.revertedWithCustomError(contract, "NotEnoughEth")
        .withArgs(ethers.parseEther("0.01"));
    });

    it("costs 0.01 eth to mint the very first NFT and it updates the buyer balance", async () => {
      const [owner] = signers;

      const tx = await contract.connect(owner)
        .mint({ value: ethers.parseEther("0.01") });
      await tx.wait();

      return contract.balanceOf(owner)
        .should.eventually.equal(1n);
    });
  });
});
