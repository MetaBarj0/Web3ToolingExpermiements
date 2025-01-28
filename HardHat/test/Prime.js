import * as chai from "chai";
import chaiAsPromised from "chai-as-promised";
import hardhat from "hardhat";

chai.use(chaiAsPromised);

const { ethers } = hardhat;
chai.should();

describe("Prime contract", () => {
  let owner;
  let contract;

  beforeEach(async () => {
    [owner] = await ethers.getSigners();
    contract = await ethers.deployContract("Prime");
  });

  describe("Deployment", () => {
    it("should set the correct owner", async () => {
      await contract.owner().should.eventually.equal(owner.address);
    });

    it("should assign the total supply of tokens to the owner when deployed", async () => {
      const ownerBalance = await contract.balanceOf(owner.address);

      await contract.totalSupply().should.eventually.equal(ownerBalance);
    });
  });

  describe("Transactions", () => {
    it("should be able to transfer token between two accounts", async () => {
      const [_, account1, account2] = await ethers.getSigners();

      await contract.transfer(
        account1.address,
        await _parsePrime("13"),
      );

      await contract.connect(account1).transfer(
        account2.address,
        await _parsePrime("2"),
      );

      await contract.balanceOf(account1.address).should.eventually.equal(
        await _parsePrime("11"),
      );
      await contract.balanceOf(account2.address).should.eventually.equal(
        await _parsePrime("2"),
      );
    });

    async function _parsePrime(amount) {
      const decimal = await contract.decimal();

      return ethers.parseUnits(amount, decimal);
    }
  });
});
