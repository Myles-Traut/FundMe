// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

interface IERC20Receiver {
  function onERC20Received(
    address from,
    address to,
    uint256 amount,
    bytes memory data
  ) external returns(bytes4);
}