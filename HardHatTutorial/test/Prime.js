const chai = require("chai");
const chaiAsPromised = require("chai-as-promised").default;
const hardhat = require("hardhat");

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
    it("should set the correct owner", () => {
      return contract.owner().should.eventually.equal(owner.address);
    });

    it("should assign the total supply of tokens to the owner when deployed", async () => {
      const ownerBalance = await contract.balanceOf(owner.address);

      return contract.totalSupply().should.eventually.equal(ownerBalance);
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

      return Promise.all([
        contract.balanceOf(account1.address).should.eventually.equal(
          _parsePrime("11"),
        ),
        contract.balanceOf(account2.address).should.eventually.equal(
          _parsePrime("2"),
        ),
      ]);
    });

    it("should fails if the sender account does not have enough tokens", async () => {
      // TODO: accounts also in beforeEach
      const [_, account1, account2] = await ethers.getSigners();

      return contract.connect(account1).transfer(
        account2.address,
        _parsePrime("1"),
      ).should.be.revertedWithCustomError(contract, "NotEnoughToken");
    });

    it("should emit Transfer events", async () => {
      const [_, account1, account2] = await ethers.getSigners();

      const firstTransfer = contract.transfer(
        account1.address,
        _parsePrime("17"),
      );

      const secondTransfer = contract.connect(account1).transfer(
        account2.address,
        _parsePrime("3"),
      );

      return Promise.all([
        firstTransfer.should.emit(contract, "Transfer").withArgs(
          owner.address,
          account1.address,
          _parsePrime("17"),
        ),
        secondTransfer.should.emit(contract, "Transfer").withArgs(
          account1.address,
          account2.address,
          _parsePrime("3"),
        ),
      ]);
    });

    function _parsePrime(amount) {
      return ethers.parseUnits(amount, decimal);
    }
  });
});
