import * as chai from "chai";
import chaiAsPromised from "chai-as-promised";
import { ethers } from "hardhat";

chai.use(chaiAsPromised);
chai.should();

describe("ERC721 contract", () => {
  it("should fail, that's it...", () => {
    return Promise.resolve(true).should.eventually.be.false;
  });
});
