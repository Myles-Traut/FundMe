// SPDX-License-Identifier: MIT
pragma solidity ^0.8.6;

import "@openzeppelin/contracts/token/ERC20/extensions/draft-ERC20Permit.sol";
import "./extensions/SaferERC20.sol";

contract MockERC20 is SaferERC20, ERC20Permit {
  constructor() SaferERC20("Testing Token", "TEST") ERC20Permit("TestingToken") {}

  /// @notice allows the minting of tokens
  /// @param to the address to mint the tokens to
  /// @param amount the uint256 amount of tokens to mint
  function mint(address to, uint256 amount) public {
    _mint(to, amount);
  }

  /// @notice allows the minting of tokens
  /// @dev performs extra check if recipient is a contract to see that they signal ERC20Receiver
  /// @param to the address to mint the tokens to
  /// @param amount the uint256 amount of tokens to mint
  function safeMint(address to, uint256 amount) public {
    require(_checkOnERC20Received(msg.sender, to, amount, ""), "ERC20: non ERC20Receiver");
    _mint(to, amount);
  }

  /// @notice allows the burning of tokens
  /// @dev unlike sending to the zero address, this will also remove the tokens
  ///  from the total supply
  /// @param account the address holding the tokens to be burnt
  /// @param amount the uint256 amount of tokens to burn
  function burn(address account, uint256 amount) public {
    _burn(account, amount);
  }

  /// @notice allows the transfer of another address's tokens with a signature
  /// @dev the signed message must conform to EIP-2612 (EIP-712)
  /// @param from the address the tokens should be transferred from
  /// @param to the address the tokens should be transferred to
  /// @param amount the uint256 amount of tokens to transfer
  /// @param deadline the uint256 timestamp of the latest time this signature will be valid
  /// @param v the v component of the signature
  /// @param r the r component of the signature
  /// @param s the s component of the signature
  function transferWithPermit(
    address from,
    address to,
    uint256 amount,
    uint256 deadline,
    uint8 v,
    bytes32 r,
    bytes32 s
  ) public {
    ERC20Permit.permit(from, msg.sender, amount, deadline, v, r, s);
    require(transferFrom(from, to, amount), "transferFrom failed");
  }

  /// @notice allows the transfer of another address's tokens with a signature
  /// @dev the signed message must conform to EIP-2612 (EIP-712)
  /// @dev uses EIP-4524 to check if `to` signals that they are an ERC20 receiver
  /// @param from the address the tokens should be transferred from
  /// @param to the address the tokens should be transferred to
  /// @param amount the uint256 amount of tokens to transfer
  /// @param deadline the uint256 timestamp of the latest time this signature will be valid
  /// @param v the v component of the signature
  /// @param r the r component of the signature
  /// @param s the s component of the signature
  /// @param data arbitrary data field
  function safeTransferWithPermit(
    address from,
    address to,
    uint256 amount,
    uint256 deadline,
    uint8 v,
    bytes32 r,
    bytes32 s,
    bytes memory data
  ) public {
    ERC20Permit.permit(from, msg.sender, amount, deadline, v, r, s);
    require(safeTransferFrom(from, to, amount, data), "safeTransfer failed");
  }
}