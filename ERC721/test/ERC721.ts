import * as chai from "chai";
import chaiAsPromised from "chai-as-promised";
import { ethers } from "hardhat";
import { ChainEvent, Contract, Signer, Signers } from "./typesUtils.ts";

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

  describe("Queries", () => {
    it("should return 0 for an account having no NFT", () => {
      const [owner] = signers;

      return contract.balanceOf(owner)
        .should.eventually.equal(0n);
    });

    it("should update the balance after a mint", async () => {
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

    it("should returns the owner of a valid token id", async () => {
      const [owner, account] = signers;

      const ownerTokenIdentifiers = await mintTokensAndReturnTokenIdentifiers(
        contract,
        owner,
        2n,
      );

      const accountTokenIdentifiers = await mintTokensAndReturnTokenIdentifiers(
        contract,
        account,
        4n,
      );

      return Promise.all(
        [
          ...ownerTokenIdentifiers.map((tokenId: bigint) =>
            contract.ownerOf(tokenId)
              .should.eventually.equal(owner)
          ),
          ...accountTokenIdentifiers.map((tokenId: bigint) =>
            contract.ownerOf(tokenId)
              .should.eventually.equal(account)
          ),
        ],
      );
    });

    it("should revert with a InvalidTokenId error when getting the approval for an invalid token id", () => {
      return contract.getApproved(99n)
        .should.be.revertedWithCustomError(contract, "InvalidTokenId");
    });

    it("should returns the zero address for a not yet approved NFT", async () => {
      const [owner] = signers;

      const tokenIdentifiers = await mintTokensAndReturnTokenIdentifiers(
        contract,
        owner,
        1n,
      );

      return contract.getApproved(tokenIdentifiers[0])
        .should.eventually.equal(ethers.ZeroAddress);
    });

    it("should say that an arbitrary address is not an operator for owner", () => {
      const [owner, arbitraryAccount] = signers;

      return contract.isApprovedForAll(owner, arbitraryAccount)
        .should.eventually.equal(false);
    });
  });

  describe("Minting and burning", () => {
    it("should not be possible to mint NFT for free", () => {
      const [owner] = signers;

      return contract.connect(owner)
        .mint()
        .should.be.revertedWithCustomError(contract, "IncorrectEthAmount")
        .withArgs(ethers.parseEther("0.01"));
    });

    it("should cost 0.01 eth to mint the very first NFT and it updates the buyer balance", async () => {
      const [owner] = signers;
      const tokenPrice = await contract.tokenPrice();

      const tx = await contract.connect(owner)
        .mint({ value: tokenPrice });
      await tx.wait();

      return contract.balanceOf(owner)
        .should.eventually.equal(1n);
    });

    it("should cost twice to mint the next NFT", async () => {
      const [owner, account] = signers;
      const firstTokenPrice = await contract.tokenPrice();

      const tx = await contract.connect(owner)
        .mint({ value: firstTokenPrice });
      await tx.wait();

      return contract.connect(account)
        .tokenPrice()
        .should.eventually.equal(ethers.parseEther("0.02"));
    });

    it("should not be possible to mint more than 10 tokens", async () => {
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

  describe("Approval", () => {
    it("should approve multiple operators per owner and emit approval for all", async () => {
      const [owner, firstOperator, secondOperator] = signers;

      const approveFirstOperatorTx = await contract.connect(owner)
        .setApprovalForAll(
          firstOperator,
          true,
        );
      await approveFirstOperatorTx.wait();

      const approveSecondOperatorTx = await contract.connect(owner)
        .setApprovalForAll(
          secondOperator,
          true,
        );
      await approveSecondOperatorTx.wait();

      return Promise.all([
        approveFirstOperatorTx.should.emit(contract, "ApprovalForAll")
          .withArgs(owner, firstOperator, true),
        approveSecondOperatorTx.should.emit(contract, "ApprovalForAll")
          .withArgs(owner, secondOperator, true),
        contract.isApprovedForAll(owner, firstOperator)
          .should.eventually.be.true,
        contract.isApprovedForAll(owner, secondOperator)
          .should.eventually.be.true,
      ]);
    });

    it("should not be possible to approve an invalid token id", () => {
      const [owner, account] = signers;

      return contract.connect(owner).approve(account, 66n)
        .should.revertedWithCustomError(contract, "InvalidTokenId");
    });

    it("should not be possible to approve a token that is not owned by sender", async () => {
      const [owner, account] = signers;

      const tokenId = (await mintTokensAndReturnTokenIdentifiers(
        contract,
        owner,
        1n,
      ))[0];

      return contract.connect(account).approve(owner, tokenId)
        .should.revertedWithCustomError(contract, "NotTokenOwner");
    });

    it("should be possible to approve a token that is owned by a sender", async () => {
      const [owner, account] = signers;

      const tokenId =
        (await mintTokensAndReturnTokenIdentifiers(contract, owner, 1n))[0];

      return contract.connect(owner).approve(account, tokenId)
        .should.emit(contract, "Approval")
        .withArgs(owner, account, tokenId);
    });

    it("should be possible for an operator to approve a not owned token", async () => {
      const [owner, operator, account] = signers;

      const tokenId =
        (await mintTokensAndReturnTokenIdentifiers(contract, owner, 1n))[0];

      const setApproveForAllTx = await contract.connect(owner)
        .setApprovalForAll(operator, true);
      await setApproveForAllTx.wait();

      return contract.connect(operator).approve(account, tokenId)
        .should.emit(contract, "Approval")
        .withArgs(operator, account, tokenId);
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

async function mintTokensAndReturnTokenIdentifiers(
  contract: Contract,
  owner: Signer,
  count: bigint,
): Promise<bigint[]> {
  const ownerFilter = contract.filters.Transfer(null, owner);
  await mintTokens(contract, owner, count);
  const ownerEvents = await contract.queryFilter(ownerFilter);

  return ownerEvents.map((event: ChainEvent) => event.args[2]);
}
