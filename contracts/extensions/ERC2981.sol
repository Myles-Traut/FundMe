// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "../interfaces/IERC2981.sol";

abstract contract ERC2981 is IERC2981 {
  /// @notice rate and scale are the royalty rate vars
  /// @notice in the default values, there would be a 3% tax on a 18 decimal asset
  /// @dev rate: the scaled rate (divide by scale to determine traditional percentage)
  uint256 private rate = 3_000;
  /// @dev scale: how much to divide amount * rate buy
  uint256 private scale = 1e5;

  mapping(uint256 => address) internal _creators;

  event RoyaltyRateSet(uint256 indexed rate, uint256 indexed scale);

  constructor() {}

  /// @notice Given an NFT and the amount of a price, returns pertinent royalty information
  /// @dev This function is specified in EIP-2981
  /// @param tokenId the index of the NFT to calculate royalties on
  /// @param _salePrice the amount the NFT is being sold for
  /// @return the address to send the royalties to, and the amount to send
  function royaltyInfo(uint256 tokenId, uint256 _salePrice)
      external
      view
      override
      returns (address, uint256)
  {
      uint256 royaltyAmount = (_salePrice * rate) / scale;
      return (getCreator(tokenId), royaltyAmount);
  }

  /// @notice gets the global royalty rate
  /// @dev divide rate by scale to get the percentage taken as royalties
  /// @return a tuple of (rate, scale)
  function getRoyaltyRate() external view returns(uint256, uint256) {
      return (rate, scale);
  }

  /// @notice gets the address of a creator for an NFT
  /// @dev The first 450 tokenIds are reserved for the HDA airdrop
  /// @param tokenId the index of the NFT to return the creator of
  /// @return the address of the creator
  function getCreator(uint256 tokenId) public virtual view returns(address) {
    // good to override and put in a check that the token exists here
    return _creators[tokenId];
  }

  /// @notice Sets the global variables relating to royalties
  /// @dev made internal to allow for access control in child contract
  /// @param _rate the amount, that when adjusted with the scale, represents the royalty rate
  /// @param _scale the amount of decimal places to scale the rate when applying
  /// example: given an 18-decimal currency, a rate of 3000 with a scale of 1e5 would be 3%
  /// since this is 0.05 to an 18-decimal currency
  function _setRoyaltyRate(uint256 _rate, uint256 _scale) internal {
      rate = _rate;
      scale = _scale;
      emit RoyaltyRateSet(_rate, _scale);
  }
}