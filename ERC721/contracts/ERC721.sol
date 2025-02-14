// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import "./IERC721.sol";

contract ERC721 is IERC721 {
  address public owner;

  mapping(address => uint256) balances;

  uint256 mintedTokenCountAndId = 0;

  constructor() {
    owner = msg.sender;
  }

  error IncorrectEthAmount(uint256 amount);
  error TokenSupplyExhausted();
  error InvalidTokenId();

  function balanceOf(address _owner) external view override returns (uint256) {
    return balances[_owner];
  }

  function ownerOf(uint256 tokenId) external view override returns (address) {
    revert InvalidTokenId();
  }

  function transferFrom(
    address from,
    address to,
    uint256 tokenId
  ) external payable override {}

  function approve(
    address approved,
    uint256 tokenId
  ) external payable override {}

  function setApprovalForAll(
    address operator,
    bool approved
  ) external override {}

  function getApproved(
    uint256 tokenId
  ) external view override returns (address) {}

  function isApprovedForAll(
    address _owner,
    address operator
  ) external view override returns (bool) {}

  function mint() external payable {
    uint256 requiredPrice = this.tokenPrice();

    require(msg.value == requiredPrice, IncorrectEthAmount(requiredPrice));
    require(mintedTokenCountAndId < 10, TokenSupplyExhausted());

    balances[msg.sender]++;
    mintedTokenCountAndId++;

    emit Transfer(address(0), msg.sender, mintedTokenCountAndId);
  }

  function tokenPrice() external view returns (uint256) {
    return 0.01 ether * 2 ** mintedTokenCountAndId;
  }
}
