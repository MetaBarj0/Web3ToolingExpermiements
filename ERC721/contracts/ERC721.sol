// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import "./IERC721.sol";

contract ERC721 is IERC721 {
  address public owner;

  constructor() {
    owner = msg.sender;
  }

  function balanceOf(address _owner) external view override returns (uint256) {}

  function ownerOf(uint256 tokenId) external view override returns (address) {}

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
}
