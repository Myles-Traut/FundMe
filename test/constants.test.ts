export const { expect } = require("chai");
export const { ethers } = require("hardhat");
export const hre = require("hardhat");

export const constants = {
  one: ethers.BigNumber.from("1"),
  hundred: ethers.BigNumber.from("100"),
  oneEth: ethers.utils.parseUnits("1"),
  nft: {
    name: "Test NFT",
    symbol: "TST",
    version: "1",
    uri: "ipfs://QmeSjSinHpPnmXmspMjwiXyN6zS4E9zccariGR3jxcaWtq/1",
    uri2: "ipfs://QmeSjSinHpPnmXmspMjwiXyN6zS4E9zccariGR3jxcaWtq/2",
  },
  TEST: {
    oneDay: 86400,
    oneMonth: 2629800,
    twoMonths: 2629800 * 2,
    ETH: "0xaAaAaAaaAaAaAaaAaAAAAAAAAaaaAaAaAaaAaaAa",
  },
  ERC20: {
    tokenSupply: ethers.utils.parseUnits("1000000"),
    name: "Testing Token",
    symbol: "TEST",
    tooMuch: ethers.utils.parseUnits("1000000000"),
    transfer: ethers.utils.parseUnits("50"),
    smallTransfer: ethers.utils.parseUnits("10"),
  },
  POLYGON: {
  DAI: "0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063",
  },
  eip712domain: [
    { name: 'name', type: 'string' },
    { name: 'version', type: 'string' },
    { name: 'chainId', type: 'uint256' },
    { name: 'verifyingContract', type: 'address' },
  ],
  permitDomain: [
    { name: 'spender', type: 'address' },
    { name: 'tokenId', type: 'uint256' },
    { name: 'nonce', type: 'uint256' },
    { name: 'deadline', type: 'uint256' },
  ]
}

module.exports = {
  hre,
  ethers,
  expect,
  constants
}