// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import "./IERC721.sol";

contract ERC721 is IERC721 {
  address public owner;
  uint8 private mintedTokenCountAndId;
  uint8 public totalSupply;
  uint8 public maxSupply;

  mapping(address => uint256) private balances;
  mapping(uint256 => address) private tokenIdToOwner;
  mapping(uint256 => address) private tokenIdToApproved;
  mapping(address => mapping(address => bool)) private ownerToOperatorApproval;

  constructor() {
    owner = msg.sender;
    mintedTokenCountAndId = 0;
    totalSupply = 0;
    maxSupply = 10;
  }

  error IncorrectEthAmount(uint256 amount);
  error TokenSupplyExhausted();
  error InvalidTokenId();
  error NotTokenOwner();
  error InvalidAddress();
  error Unauthorized();

  function balanceOf(address _owner) external view override returns (uint256) {
    return balances[_owner];
  }

  function ownerOf(uint256 tokenId) external view override returns (address) {
    address _owner = tokenIdToOwner[tokenId];

    require(_owner != address(0), InvalidTokenId());

    return _owner;
  }

  function transferFrom(
    address from,
    address to,
    uint256 tokenId
  ) external payable override {
    require(to != address(0), InvalidAddress());
    address _owner = tokenIdToOwner[tokenId];

    require(_owner != address(0), InvalidTokenId());
    require(_owner == from, NotTokenOwner());
    require(
      msg.sender == _owner ||
        msg.sender == tokenIdToApproved[tokenId] ||
        ownerToOperatorApproval[_owner][msg.sender],
      Unauthorized()
    );

    balances[from]--;
    balances[to]++;
    tokenIdToOwner[tokenId] = to;
    delete tokenIdToApproved[tokenId];

    emit Transfer(from, to, tokenId);
  }

  function approve(
    address approved,
    uint256 tokenId
  ) external payable override {
    address _owner = tokenIdToOwner[tokenId];

    require(_owner != address(0), InvalidTokenId());
    require(
      _owner == msg.sender || ownerToOperatorApproval[_owner][msg.sender],
      NotTokenOwner()
    );

    tokenIdToApproved[tokenId] = approved;

    emit Approval(_owner, approved, tokenId);
  }

  function setApprovalForAll(
    address operator,
    bool approved
  ) external override {
    ownerToOperatorApproval[msg.sender][operator] = approved;

    emit ApprovalForAll(msg.sender, operator, approved);
  }

  function getApproved(
    uint256 tokenId
  ) external view override returns (address) {
    require(tokenIdToOwner[tokenId] != address(0), InvalidTokenId());

    return tokenIdToApproved[tokenId];
  }

  function isApprovedForAll(
    address _owner,
    address operator
  ) external view override returns (bool) {
    return ownerToOperatorApproval[_owner][operator];
  }

  function mint() external payable {
    uint256 requiredPrice = tokenPrice();

    require(msg.value == requiredPrice, IncorrectEthAmount(requiredPrice));
    require(mintedTokenCountAndId < maxSupply, TokenSupplyExhausted());

    balances[msg.sender]++;
    mintedTokenCountAndId++;
    tokenIdToOwner[mintedTokenCountAndId] = msg.sender;
    totalSupply++;

    emit Transfer(address(0), msg.sender, mintedTokenCountAndId);
  }

  function burn(uint256 tokenId) external {
    address _owner = tokenIdToOwner[tokenId];

    require(_owner != address(0), InvalidTokenId());
    require(
      _owner == msg.sender ||
        ownerToOperatorApproval[_owner][msg.sender] ||
        msg.sender == tokenIdToApproved[tokenId],
      Unauthorized()
    );

    totalSupply--;
    balances[_owner]--;
    delete tokenIdToOwner[tokenId];
    delete tokenIdToApproved[tokenId];
  }

  function tokenPrice() public view returns (uint256) {
    return 0.01 ether * 2 ** mintedTokenCountAndId;
  }
}
