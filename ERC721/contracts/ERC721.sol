// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import "./IERC721.sol";

contract ERC721 is IERC721 {
  address public owner;

  mapping(address => uint256) balances;

  constructor() {
    owner = msg.sender;
  }

  error NotEnoughEth(uint256 amount);

  function balanceOf(address _owner) external view override returns (uint256) {
    return balances[_owner];
  }

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

  function mint() external payable {
    require(msg.value == 0.01 ether, NotEnoughEth(0.01 ether));

    balances[msg.sender]++;
  }
}
