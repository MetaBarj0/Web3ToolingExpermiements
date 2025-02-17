const chai = require("chai");
const chaiAsPromised = require("chai-as-promised").default;
const hardhat = require("hardhat");

chai.use(chaiAsPromised);

const { ethers } = hardhat;
chai.should();

describe("Prime contract", () => {
  let signers;

  before(async () => {
    signers = await ethers.getSigners();
  });

  let contract;
  let decimal;

  beforeEach(async () => {
    contract = await ethers.deployContract("Prime");
    decimal = await contract.decimals();
  });

  describe("Deployment", () => {
    it("should set the correct owner", () => {
      const [owner] = signers;

      return contract.owner().should.eventually.equal(owner);
    });

    it("should set the total supply", () => {
      return contract.totalSupply().should.eventually.equal(0n);
    });
  });

  describe("Transactions", () => {
    it("should not be possible to mint token for anyone but the contract's owner", () => {
      const [_, notOwner] = signers;

      return contract.connect(notOwner).mintFor(notOwner, 1234)
        .should.be.revertedWithCustomError(contract, "Unauthorized");
    });

    it("should increase the total supply after having minted tokens", async () => {
      const [owner] = signers;
      const mintAmount = 1234567n;
      const newTotalSupply = await contract.totalSupply() + mintAmount;

      const tx = await contract.connect(owner).mintFor(owner, mintAmount);
      await tx.wait();

      return contract.totalSupply()
        .should.eventually.equal(newTotalSupply);
    });

    it("should be able to transfer token between two accounts", async () => {
      const [owner, account1, account2] = signers;

      const mintTx = await contract.connect(owner).mintFor(
        owner,
        _parsePrime("13"),
      );
      await mintTx.wait();

      await contract.connect(owner).transfer(account1, _parsePrime("13"));

      await contract.connect(account1).transfer(account2, _parsePrime("2"));

      return Promise.all([
        contract.balanceOf(account1).should.eventually.equal(_parsePrime("11")),
        contract.balanceOf(account2).should.eventually.equal(_parsePrime("2")),
      ]);
    });

    it("should fails if the sender account does not have enough tokens", () => {
      const [_, account1, account2] = signers;

      return contract.connect(account1).transfer(account2, _parsePrime("1"))
        .should.be.revertedWithCustomError(
          contract,
          "ERC20InsufficientBalance",
        );
    });

    it("should emit Transfer events", async () => {
      const [owner, account1, account2] = signers;

      const mintTx = await contract.connect(owner).mintFor(
        owner,
        _parsePrime("17"),
      );
      await mintTx.wait();

      const firstTransfer = contract.connect(owner).transfer(
        account1,
        _parsePrime("17"),
      );

      const secondTransfer = contract.connect(account1).transfer(
        account2,
        _parsePrime("3"),
      );

      return Promise.all([
        firstTransfer.should.emit(contract, "Transfer")
          .withArgs(owner, account1, _parsePrime("17")),
        secondTransfer.should.emit(contract, "Transfer")
          .withArgs(account1, account2, _parsePrime("3")),
      ]);
    });

    it("should fail to transfer from zero address", () => {
      const [owner, to] = signers;

      return contract.connect(owner)
        .transferFrom(ethers.ZeroAddress, to, 0)
        .should.revertedWithCustomError(contract, "ERC20InvalidApprover")
        .withArgs(ethers.ZeroAddress);
    });

    it("should fail to transfer from behalf of the owner for a too high amount", async () => {
      const [owner, spender, from, to] = signers;

      const mintTx = await contract.connect(owner).mintFor(owner, 1234);
      await mintTx.wait();

      const fromProvisioning = await contract.connect(owner)
        .transfer(from, 1234);
      await fromProvisioning.wait();

      const approval = await contract.connect(from).approve(spender, 567);
      await approval.wait();

      return contract.connect(spender)
        .transferFrom(from, to, 1000)
        .should.revertedWithCustomError(
          contract,
          "ERC20InsufficientAllowance",
        )
        .withArgs(spender, 567, 1000);
    });

    it("should be able to transfer from behalf owner and emit Transfer event as well as update allowances", async () => {
      const [owner, from, to, spender] = signers;
      const [approvalAmount, spentAmount] = [456, 123];

      const mintTx = await contract.connect(owner).mintFor(owner, 456);
      await mintTx.wait();

      const fromProvisioning = await contract.connect(owner)
        .transfer(from, approvalAmount);
      await fromProvisioning.wait();

      const approval = await contract.connect(from)
        .approve(spender, approvalAmount);
      await approval.wait();

      const transferFrom = await contract.connect(spender)
        .transferFrom(from, to, spentAmount);
      await transferFrom.wait();

      return Promise.all([
        contract.allowance(from, spender)
          .should.eventually.equal(approvalAmount - spentAmount),
        contract.connect(spender).transferFrom(from, to, spentAmount)
          .should.emit(contract, "Transfer")
          .withArgs(from, to, spentAmount),
      ]);
    });

    it("should not be possible to burn token from any account but the owner", () => {
      const [_, account] = signers;

      return contract.connect(account).burn(1000)
        .should.be.revertedWithCustomError(contract, "Unauthorized");
    });

    it("should be possible for the owner to burn tokens and update the total supply", async () => {
      const [owner] = signers;
      const initialSupply = 2_000_000n;
      const smallBurnAmount = 1_000_000n;
      const expectedTotalSupplyAfterSmallBurn = initialSupply - smallBurnAmount;

      const mintTx = await contract.connect(owner).mintFor(
        owner,
        initialSupply,
      );
      await mintTx.wait();

      const burnTx = await contract.connect(owner).burn(smallBurnAmount);
      await burnTx.wait();

      return contract.totalSupply()
        .should.eventually.equal(expectedTotalSupplyAfterSmallBurn);
    });

    it("should not be possible to reduce the total supply below 0 after a burn", async () => {
      const [owner] = signers;
      const initialSupply = await contract.totalSupply();

      const tx = await contract.connect(owner).burn(initialSupply + 1n);
      await tx.wait();

      return contract.totalSupply()
        .should.eventually.equal(0);
    });
  });

  describe("Approval", () => {
    it("should revert when trying to approve to a zero address spender", () => {
      return contract.approve(ethers.ZeroAddress, 0n).should.be
        .revertedWithCustomError(contract, "ERC20InvalidSpender")
        .withArgs(ethers.ZeroAddress);
    });

    it("should succeed approving a valid spendable amount", async () => {
      const [owner, spender] = signers;
      const amount = 123n;

      const tx = await contract.connect(owner).approve(spender, amount);
      await tx.wait();

      return contract.allowance(owner, spender)
        .should.eventually.equal(amount);
    });

    it("should emit a proper Approval event when succeeding", async () => {
      const [owner, spender] = signers;
      const amount = 432n;

      const tx = await contract.connect(owner).approve(spender, amount);

      return tx.should.emit(contract, "Approval").withArgs(
        owner,
        spender,
        amount,
      );
    });
  });

  function _parsePrime(amount) {
    return ethers.parseUnits(amount, decimal);
  }
});
