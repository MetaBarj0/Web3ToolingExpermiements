// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

/// @title ERC-721 Non-Fungible Token Standard
/// @dev See https://eips.ethereum.org/EIPS/eip-721
interface IERC721 {
  /// @dev This emits when ownership of any NFT changes by any mechanism.
  ///  This event emits when NFTs are created (`from` == 0) and destroyed
  ///  (`to` == 0). Exception: during contract creation, any number of NFTs
  ///  may be created and assigned without emitting Transfer. At the time of
  ///  any transfer, the approved address for that NFT (if any) is reset to none.
  event Transfer(
    address indexed from,
    address indexed to,
    uint256 indexed tokenId
  );

  /// @dev This emits when the approved address for an NFT is changed or
  ///  reaffirmed. The zero address indicates there is no approved address.
  ///  When a Transfer event emits, this also indicates that the approved
  ///  address for that NFT (if any) is reset to none.
  event Approval(
    address indexed owner,
    address indexed approved,
    uint256 indexed tokenId
  );

  /// @dev This emits when an operator is enabled or disabled for an owner.
  ///  The operator can manage all NFTs of the owner.
  event ApprovalForAll(
    address indexed owner,
    address indexed operator,
    bool approved
  );

  /// @notice Count all NFTs assigned to an owner
  /// @dev NFTs assigned to the zero address are considered invalid, and this
  ///  function throws for queries about the zero address.
  /// @param owner An address for whom to query the balance
  /// @return The number of NFTs owned by `_owner`, possibly zero
  function balanceOf(address owner) external view returns (uint256);

  /// @notice Find the owner of an NFT
  /// @dev NFTs assigned to zero address are considered invalid, and queries
  ///  about them do throw.
  /// @param tokenId The identifier for an NFT
  /// @return The address of the owner of the NFT
  function ownerOf(uint256 tokenId) external view returns (address);

  /// @notice Transfer ownership of an NFT
  /// @dev Throws unless `msg.sender` is the current owner, an authorized
  ///  operator, or the approved address for this NFT. Throws if `_from` is
  ///  not the current owner. Throws if `_to` is the zero address. Throws if
  ///  `_tokenId` is not a valid NFT.
  /// @param from The current owner of the NFT
  /// @param to The new owner
  /// @param tokenId The NFT to transfer
  function transferFrom(
    address from,
    address to,
    uint256 tokenId
  ) external payable;

  /// @notice Change or reaffirm the approved address for an NFT
  /// @dev The zero address indicates there is no approved address.
  ///  Throws unless `msg.sender` is the current NFT owner, or an authorized
  ///  operator of the current owner.
  /// @param approved The new approved NFT controller
  /// @param tokenId The NFT to approve
  function approve(address approved, uint256 tokenId) external payable;

  /// @notice Enable or disable approval for a third party ("operator") to manage
  ///  all of `msg.sender`'s assets
  /// @dev Emits the ApprovalForAll event. The contract MUST allow
  ///  multiple operators per owner.
  /// @param operator Address to add to the set of authorized operators
  /// @param approved True if the operator is approved, false to revoke approval
  function setApprovalForAll(address operator, bool approved) external;

  /// @notice Get the approved address for a single NFT
  /// @dev Throws if `tokenId` is not a valid NFT.
  /// @param tokenId The NFT to find the approved address for
  /// @return The approved address for this NFT, or the zero address if there is none
  function getApproved(uint256 tokenId) external view returns (address);

  /// @notice Query if an address is an authorized operator for another address
  /// @param owner The address that owns the NFTs
  /// @param operator The address that acts on behalf of the owner
  /// @return True if `operator` is an approved operator for `_owner`, false otherwise
  function isApprovedForAll(
    address owner,
    address operator
  ) external view returns (bool);
}
