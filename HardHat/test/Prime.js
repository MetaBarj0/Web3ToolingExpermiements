import * as chai from "chai";
import chaiAsPromised from "chai-as-promised";
import hardhat from "hardhat";

chai.use(chaiAsPromised);

const { ethers } = hardhat;
chai.should();

describe("Prime contract", function () {
  it("Deployment should assign the total supply of tokens to the owner", async function () {
    const [owner] = await ethers.getSigners();

    const contract = await ethers.deployContract("Prime");
    const ownerBalance = await contract.balanceOf(owner.address);

    contract.totalSupply().should.eventually.equal(ownerBalance);
  });
});
