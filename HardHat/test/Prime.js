import * as chai from "chai";
import chaiAsPromised from "chai-as-promised";
import hardhat from "hardhat";

chai.use(chaiAsPromised);

const { ethers } = hardhat;
chai.should();

describe("Prime contract", function () {
  let owner;
  let contract;

  beforeEach(async () => {
    [owner] = await ethers.getSigners();
    contract = await ethers.deployContract("Prime");
  });

  it("should assign the total supply of tokens to the owner when deployed", async function () {
    const ownerBalance = await contract.balanceOf(owner.address);

    await contract.totalSupply().should.eventually.equal(ownerBalance);
  });

  it("should be able to transfer token between two accounts", async function () {
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
