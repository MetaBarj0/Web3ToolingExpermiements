import * as chai from "chai";
import chaiAsPromised from "chai-as-promised";
import hardhat from "hardhat";

chai.use(chaiAsPromised);

const { ethers } = hardhat;
chai.should();

describe("Prime contract", () => {
  let owner;
  let contract;
  let decimal;

  beforeEach(async () => {
    [owner] = await ethers.getSigners();
    contract = await ethers.deployContract("Prime");
    decimal = await contract.decimal();
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
        _parsePrime("13"),
      );

      await contract.connect(account1).transfer(
        account2.address,
        _parsePrime("2"),
      );

      // TODO: merge assertion here
      await contract.balanceOf(account1.address).should.eventually.equal(
        _parsePrime("11"),
      );
      await contract.balanceOf(account2.address).should.eventually.equal(
        _parsePrime("2"),
      );
    });

    it("should fails if the sender account does not have enough tokens", async () => {
      const [_, account1, account2] = await ethers.getSigners();

      return contract.connect(account1).transfer(
        account2.address,
        _parsePrime("1"),
      ).should.be.revertedWithCustomError(contract, "NotEnoughToken"); // reverted assert must not be used with eventually
    });

    function _parsePrime(amount) {
      return ethers.parseUnits(amount, decimal);
    }
  });
});
