// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

/**
  THIS CONTRACT ONLY FOR TESTING PURPOSES
 */

 import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";

 contract Mock1155 is ERC1155 {

   constructor() ERC1155("") {}
   function mint(address to, uint256 id, uint256 amount) external {
     _mint(to, id, amount, "");
   }
 }