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
});
