import * as chai from "chai";
import chaiAsPromised from "chai-as-promised";
import { ethers } from "hardhat";
import { Contract, Signer } from "./types.ts";
import {
  mintOneToken,
  mintTokens,
  mintTokensAndReturnTokenIdentifiers,
  mintTokensAndZipTxWithTokenIdentifiers,
} from "./mintTokens.ts";

chai.use(chaiAsPromised);
chai.should();

describe("ERC721 contract", () => {
  let signers: Signer[];
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
        .should.eventually.equal(0);
    });

    it("should update the balance after a mint", async () => {
      const [owner, account] = signers;

      await mintTokens(contract, owner, 2);
      await mintTokens(contract, account, 3);

      return Promise.all([
        contract.balanceOf(owner)
          .should.eventually.equal(2),
        contract.balanceOf(account)
          .should.eventually.equal(3),
      ]);
    });

    it("should revert with a InvalidTokenId error when querying the owner with an invalid token id", () => {
      const invalidTokenIdentifiers = [0, 1, 42];

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
        2,
      );

      const accountTokenIdentifiers = await mintTokensAndReturnTokenIdentifiers(
        contract,
        account,
        4,
      );

      return Promise.all(
        [
          ...ownerTokenIdentifiers.map((tokenId) =>
            contract.ownerOf(tokenId)
              .should.eventually.equal(owner)
          ),
          ...accountTokenIdentifiers.map((tokenId) =>
            contract.ownerOf(tokenId)
              .should.eventually.equal(account)
          ),
        ],
      );
    });

    it("should revert with a InvalidTokenId error when getting the approval for an invalid token id", () => {
      return contract.getApproved(99)
        .should.be.revertedWithCustomError(contract, "InvalidTokenId");
    });

    it("should returns the zero address for a not yet approved NFT", async () => {
      const [owner] = signers;

      const tokenId = await mintOneToken(contract, owner);

      return contract.getApproved(tokenId)
        .should.eventually.equal(ethers.ZeroAddress);
    });

    it("should say that an arbitrary address is not an operator for owner", () => {
      const [owner, account] = signers;

      return contract.isApprovedForAll(owner, account)
        .should.eventually.equal(false);
    });

    it("should be an initial amount of 10 token", () => {
      return contract.totalSupply()
        .should.eventually.equal(10);
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

    it("should cost 0.01 eth to mint the very first NFT and update the buyer's balance", async () => {
      const [owner] = signers;

      await mintTokens(contract, owner, 3);

      return contract.balanceOf(owner)
        .should.eventually.equal(3);
    });

    it("should cost twice to mint the next NFT", async () => {
      const [owner, account] = signers;
      const firstTokenPrice = await contract.tokenPrice();

      const tx = await contract.connect(owner)
        .mint({ value: firstTokenPrice });
      await tx.wait();

      return contract.connect(account)
        .tokenPrice()
        .should.eventually.equal(firstTokenPrice * 2n);
    });

    it("should not be possible to mint more than 10 tokens", async () => {
      const [owner] = signers;

      await mintTokens(contract, owner, 10);

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

      const [{ tx: txOwner, tokenId: ownerTokenId }] =
        await mintTokensAndZipTxWithTokenIdentifiers(
          contract,
          owner,
          1,
        );

      const [{ tx: txAccount, tokenId: accountTokenId }] =
        await mintTokensAndZipTxWithTokenIdentifiers(
          contract,
          account,
          1,
        );

      return Promise.all([
        txOwner
          .should.emit(contract, "Transfer")
          .withArgs(ethers.ZeroAddress, owner, ownerTokenId),
        txAccount
          .should.emit(contract, "Transfer")
          .withArgs(ethers.ZeroAddress, account, accountTokenId),
      ]);
    });

    it("should not be possible to burn an invalid token", () => {
      const [owner] = signers;

      return contract.connect(owner).burn(99n)
        .should.revertedWithCustomError(contract, "InvalidTokenId");
    });

    it("should not be possible to burn a token not owned nor approved nor operated by the sender", async () => {
      const [owner, account] = signers;

      const tokenId = await mintOneToken(contract, owner);

      return contract.connect(account).burn(tokenId)
        .should.revertedWithCustomError(
          contract,
          "NotTokenOwnerNorOperatorNorApproved",
        );
    });

    it("should be possible for a token owner to burn it", async () => {
      const [owner] = signers;
      const tokenId = await mintOneToken(contract, owner);

      return contract.connect(owner).burn(tokenId)
        .should.not.be.reverted;
    });

    it("should be possible for an approved account to burn a token", async () => {
      const [owner, approved] = signers;

      const tokenId = await mintOneToken(contract, owner);
      const tx = await contract.connect(owner).approve(approved, tokenId);
      await tx.wait();

      return contract.connect(approved).burn(tokenId)
        .should.not.be.reverted;
    });

    it("should be possible for an operator to burn a token", async () => {
      const [owner, operator] = signers;

      const tokenId = await mintOneToken(contract, owner);
      const approvalTx = await contract.connect(owner).setApprovalForAll(
        operator,
        true,
      );
      await approvalTx.wait();

      return contract.connect(operator).burn(tokenId)
        .should.not.be.reverted;
    });

    it("should revert with invalid token id when attempting to burn several times the same token", async () => {
      const [owner] = signers;
      const tokenId = await mintOneToken(contract, owner);

      await contract.connect(owner).burn(tokenId);

      return contract.connect(owner).burn(tokenId)
        .should.be.revertedWithCustomError(contract, "InvalidTokenId");
    });

    it("should decrease the total supply of token as well as the owner balance after a token burn", async () => {
      const [owner] = signers;

      const tokenId = await mintOneToken(contract, owner);
      const tx = await contract.connect(owner).burn(tokenId);
      await tx.wait();

      return Promise.all([
        contract.totalSupply()
          .should.eventually.equal(9),
        contract.balanceOf(owner)
          .should.eventually.equal(0),
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

      const tokenId = await mintOneToken(contract, owner);

      return contract.connect(account).approve(owner, tokenId)
        .should.revertedWithCustomError(contract, "NotTokenOwner");
    });

    it("should be possible to approve a token that is owned by a sender", async () => {
      const [owner, account] = signers;

      const tokenId = await mintOneToken(contract, owner);

      return contract.connect(owner).approve(account, tokenId)
        .should.emit(contract, "Approval")
        .withArgs(owner, account, tokenId);
    });

    it("should be possible for an operator to approve a not owned token", async () => {
      const [owner, operator, account] = signers;

      const tokenId = await mintOneToken(contract, owner);

      const setApproveForAllTx = await contract.connect(owner)
        .setApprovalForAll(operator, true);
      await setApproveForAllTx.wait();

      return contract.connect(operator).approve(account, tokenId)
        .should.emit(contract, "Approval")
        .withArgs(operator, account, tokenId);
    });
  });

  describe("transfer", () => {
    it("should not be possible to transfer from with a zero destination address", () => {
      const [owner, operator] = signers;

      return contract.connect(operator).transferFrom(
        owner,
        ethers.ZeroAddress,
        42,
      )
        .should.be.revertedWithCustomError(contract, "InvalidAddress");
    });

    it("should not be possible to transfer from an invalid token", () => {
      const [owner, operator, to] = signers;

      return contract.connect(operator).transferFrom(owner, to, 99)
        .should.be.revertedWithCustomError(contract, "InvalidTokenId");
    });

    it("should not be possible to transfer from a not owned token", async () => {
      const [owner, operator, to, account] = signers;

      const tokenId = await mintOneToken(contract, owner);

      return contract.connect(operator).transferFrom(account, to, tokenId)
        .should.be.revertedWithCustomError(contract, "NotTokenOwner");
    });

    it("should not be possible to transfer from a sender that is not owner, approved or operator", async () => {
      const [owner, to, account] = signers;

      const tokenId = await mintOneToken(contract, owner);

      return contract.connect(account).transferFrom(owner, to, tokenId)
        .should.be.revertedWithCustomError(
          contract,
          "NotTokenOwnerNorOperatorNorApproved",
        );
    });

    it("should be possible to transfer from with the sender being the owner of the token", async () => {
      const [owner, to] = signers;

      const tokenId = await mintOneToken(contract, owner);

      return contract.connect(owner).transferFrom(owner, to, tokenId)
        .should.emit(contract, "Transfer")
        .withArgs(owner, to, tokenId);
    });

    it("should be possible to transfer from with the sender being the approved address for the token", async () => {
      const [owner, to, approved] = signers;

      const tokenId = await mintOneToken(contract, owner);

      const tx = await contract.connect(owner).approve(approved, tokenId);
      await tx.wait();

      return contract.connect(approved).transferFrom(owner, to, tokenId)
        .should.emit(contract, "Transfer")
        .withArgs(owner, to, tokenId);
    });

    it("should be possible to transfer from with the sender being the operator for the owner", async () => {
      const [owner, to, operator] = signers;

      const tokenId = await mintOneToken(contract, owner);

      const tx = await contract.connect(owner).setApprovalForAll(
        operator,
        true,
      );
      await tx.wait();

      return contract.connect(operator).transferFrom(owner, to, tokenId)
        .should.emit(contract, "Transfer")
        .withArgs(owner, to, tokenId);
    });

    it("should update balances and token ownership after a successful transfer from", async () => {
      const [owner, to] = signers;

      const tokenId = await mintOneToken(contract, owner);

      const tx = await contract.connect(owner).transferFrom(
        owner,
        to,
        tokenId,
      );
      await tx.wait();

      return Promise.all([
        contract.balanceOf(owner)
          .should.eventually.equal(0),
        contract.balanceOf(to)
          .should.eventually.equal(1),
        contract.ownerOf(tokenId)
          .should.eventually.equal(to),
      ]);
    });
  });
});
