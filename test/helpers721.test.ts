import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { Contract } from "@ethersproject/contracts";
import { ethers, expect, constants } from "./constants.test";
import { MockERC721, MockERC721__factory } from "../typechain-types";

export const deployNft = async (deployer: SignerWithAddress) => {
  const NftArtifacts: MockERC721__factory = await ethers.getContractFactory("MockERC721", deployer);
  return await NftArtifacts.deploy(
    constants.nft.name, 
    constants.nft.symbol,
    constants.nft.version
  )
}

// must be first mint from contract or will not work
export const mintSingleNft = async (Nft: MockERC721, artist: SignerWithAddress) => {
  await expect(Nft.ownerOf(constants.one))
    .to.be.revertedWith("ERC721: owner query for nonexistent token");
  await Nft.connect(artist).mintWithUriAutoTokenId(artist.address, constants.nft.uri2);
  expect(await Nft.ownerOf(constants.one))
    .to.equal(artist.address);
}

export const getSig = async (
  Nft: Contract, 
  artist: SignerWithAddress, 
  buyerAddress: string,
  chainId: number
) => {
  const Permit = constants.permitDomain;
  const _name = constants.nft.name;
  const version = constants.nft.version;
  const spender = buyerAddress;
  const tokenId = constants.one;
  const nonce = await Nft.nonces(tokenId);
  const deadline = ethers.constants.MaxUint256;
  const sig = await artist._signTypedData(
    {
      name: _name,
      version,
      chainId,
      verifyingContract: Nft.address
    },
    {
      Permit
    },
    {
      spender,
      tokenId,
      nonce,
      deadline
    }
  );

  return sig;
}

export const permit = async (
  Nft: MockERC721, 
  artist: SignerWithAddress, 
  buyer: SignerWithAddress,
  chainId: number
) => {
  const sig = await getSig(Nft, artist, buyer.address, chainId);
  const deadline = ethers.constants.MaxUint256;

  await Nft.connect(buyer).permit(
    buyer.address,
    constants.one,
    deadline,
    sig
  );

  expect(await Nft.getApproved(constants.one))
    .to.equal(buyer.address);
}

module.exports = {
  deployNft,
  mintSingleNft,
  getSig,
  permit
}