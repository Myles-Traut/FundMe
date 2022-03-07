import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { Contract } from "@ethersproject/contracts";
import { ethers, expect, constants } from "./constants.test";
import { MockERC1155, MockERC1155__factory } from "../typechain-types";

// Gets the time of the last block.
export const currentTime = async () => {
  const { timestamp } = await ethers.provider.getBlock("latest");
  return timestamp;
};

// Increases the time in the EVM.
// seconds = number of seconds to increase the time by
export const fastForward = async (seconds:any) => {
  await ethers.provider.send("evm_increaseTime", [seconds]);
  await ethers.provider.send("evm_mine", []);
};

export const deployNft = async (deployer: SignerWithAddress) => {
  const NftArtifacts: MockERC1155__factory = await ethers.getContractFactory("MockERC1155", deployer);
  return await NftArtifacts.deploy()
}

// must be first mint from contract or will not work
export const mintSingleNft = async (Nft: MockERC1155, artist: SignerWithAddress) => {
  const origArtistBalance = await Nft.balanceOf(artist.address, constants.one);
  await Nft.connect(artist).mintWithUriAutoTokenId(
    artist.address, 
    constants.one, 
    constants.nft.uri
  );
  const postArtistBalance = await Nft.balanceOf(artist.address, constants.one);
  expect(postArtistBalance).to.equal(origArtistBalance.add(1));
  const nftCreator = (await Nft.royaltyInfo(constants.one, constants.oneEth))[0];
  expect(nftCreator).to.equal(artist.address);
}

export const mintBatch = async (Nft: MockERC1155, owner: SignerWithAddress, artist: SignerWithAddress) => {
  const origArtistBalanceId1 = await Nft.balanceOf(artist.address, constants.one);
  const origArtistBalanceId2 = await Nft.balanceOf(artist.address, ethers.BigNumber.from("2"));

  await Nft.connect(artist).mintBatchWithAutoTokenIdAndUri(
    artist.address,
    [constants.one, constants.one],
    [constants.nft.uri, constants.nft.uri2]
  );

  const postArtistBalanceId1 = await Nft.balanceOf(artist.address, constants.one);
  const postArtistBalanceId2 = await Nft.balanceOf(artist.address, ethers.BigNumber.from("2"));

  expect(postArtistBalanceId1).to.equal(origArtistBalanceId1.add(1));
  expect(postArtistBalanceId2).to.equal(origArtistBalanceId2.add(1));
}

export const setBiddersUp = async (
  TokenInstance:Contract,
  SaleOrAuction: Contract,
  bidder1:SignerWithAddress,
  bidder2:SignerWithAddress,
  bidder3:SignerWithAddress
  ) => {
  await TokenInstance.mint(bidder1.address,ethers.utils.parseUnits("1000000000"));
  await TokenInstance.mint(bidder2.address,ethers.utils.parseUnits("1000000000"));
  await TokenInstance.mint(bidder3.address,ethers.utils.parseUnits("1000000000"));

  await TokenInstance.connect(bidder1).approve(SaleOrAuction.address, ethers.constants.MaxUint256);
  await TokenInstance.connect(bidder2).approve(SaleOrAuction.address, ethers.constants.MaxUint256);
  await TokenInstance.connect(bidder3).approve(SaleOrAuction.address, ethers.constants.MaxUint256);
}

module.exports = {
  deployNft,
  mintSingleNft,
  mintBatch,
  currentTime,
  fastForward,
  setBiddersUp
  
}