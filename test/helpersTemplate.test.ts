import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
// eslint-disable-next-line node/no-extraneous-import
// import { Contract } from "@ethersproject/contracts";
// eslint-disable-next-line node/no-missing-import
import { ethers } from "./constants.test";

export const deployFundMe = async (deployer: SignerWithAddress) => {
  // there is no MyContract - replace with the contract you're testing
  const artifacts = await ethers.getContractFactory("FundMe", deployer);
  // constructor args go in the parentheses
  // eslint-disable-next-line no-loss-of-precision
  return await artifacts.deploy();
};

// module.exports = {
//   deployFundMe,
// };
