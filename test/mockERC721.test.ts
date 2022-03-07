import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { hexlify } from "ethers/lib/utils";
import { MockERC721 } from "../typechain-types";
import { ethers, expect, constants } from "./constants.test";
import { deployNft, getSig, mintSingleNft, permit } from "./helpers721.test";


describe("ERC721 tests", () => {
  let owner: SignerWithAddress, artist: SignerWithAddress, buyer: SignerWithAddress;

  let Nft: MockERC721;

  beforeEach(async () => {
    // Put logic that will be needed before every test
    [owner, artist, buyer] = await ethers.getSigners();

    Nft = await deployNft(owner);
  });

  describe("general view functions", () => {
    it("displays uri properly (minted)", async () => {
      await mintSingleNft(Nft, artist);

      expect(await Nft.tokenURI(constants.one))
        .to.equal(constants.nft.uri2);
    });

    it("cannot get uri of unminted token", async () => {
      await expect(Nft.tokenURI(constants.one))
        .to.be.revertedWith("ERC721Metadata: URI query for nonexistent token");
    })
  })

  describe("mint tests", () => {
    it("mint", async () => {
      await expect(Nft.ownerOf(constants.one))
        .to.be.revertedWith("ERC721: owner query for nonexistent token");
      await Nft.connect(artist).mintWithUriAutoTokenId(
        buyer.address, 
        constants.nft.uri
      );
      expect(await Nft.ownerOf(constants.one))
        .to.equal(buyer.address);
    });

    it("second mint has correct tokenId", async () => {
      await mintSingleNft(Nft, artist);

      await expect(Nft.tokenURI(ethers.BigNumber.from("2")))
        .to.be.revertedWith("ERC721Metadata: URI query for nonexistent token");
      await Nft.connect(artist).mintWithUriAutoTokenId(
        buyer.address,
        "oogly boogly"
      );
      expect(await Nft.tokenURI(ethers.BigNumber.from("2")))
        .to.equal("oogly boogly");
    });
  });

  describe("approval and transfer tests", () => {
    it("can approve on a single NFT", async () => {
      await mintSingleNft(Nft, artist);
      expect(await Nft.getApproved(constants.one))
        .to.equal(ethers.constants.AddressZero);
      await Nft.connect(artist).approve(buyer.address, constants.one);
      expect(await Nft.getApproved(constants.one))
        .to.equal(buyer.address);
    });

    it("approved by single approve can transfer", async () => {
      await mintSingleNft(Nft, artist);
      expect(await Nft.getApproved(constants.one))
        .to.equal(ethers.constants.AddressZero);
      await Nft.connect(artist).approve(buyer.address, constants.one);
      expect(await Nft.getApproved(constants.one))
        .to.equal(buyer.address);

      await Nft.connect(buyer)['safeTransferFrom(address,address,uint256)'](
        artist.address,
        buyer.address,
        constants.one
      );

      expect(await Nft.ownerOf(constants.one))
        .to.equal(buyer.address);
    });

    it("can approve operator on all NFTs", async () => {
      expect(await Nft.isApprovedForAll(artist.address, buyer.address))
        .to.be.false;

      await Nft.connect(artist).setApprovalForAll(buyer.address, true);

      expect(await Nft.isApprovedForAll(artist.address, buyer.address))
        .to.be.true;
    });

    it("approved for all can transfer NFTs", async () => {
      await mintSingleNft(Nft, artist);

      expect(await Nft.isApprovedForAll(artist.address, buyer.address))
        .to.be.false;

      await Nft.connect(artist).setApprovalForAll(buyer.address, true);

      expect(await Nft.isApprovedForAll(artist.address, buyer.address))
        .to.be.true;
      expect(await Nft.balanceOf(buyer.address))
        .to.equal(ethers.constants.Zero);

      await Nft.connect(buyer)['safeTransferFrom(address,address,uint256)'](
        artist.address,
        buyer.address,
        constants.one
      );

      expect(await Nft.balanceOf(buyer.address))
        .to.equal(constants.one);
    });

    it("safeTransferFrom works properly", async () => {
      await mintSingleNft(Nft, artist);

      expect(await Nft.balanceOf(artist.address))
        .to.equal(constants.one);
      expect(await Nft.balanceOf(buyer.address))
        .to.equal(ethers.constants.Zero);

      await Nft.connect(artist)['safeTransferFrom(address,address,uint256)'](
        artist.address,
        buyer.address,
        constants.one
      );

      expect(await Nft.balanceOf(artist.address))
        .to.equal(ethers.constants.Zero);
      expect(await Nft.balanceOf(buyer.address))
        .to.equal(constants.one);
    });
  });

  describe("royalty information", () => {
    beforeEach(async () => {
      await mintSingleNft(Nft, artist);
    });

    it("displays royalty information properly", async () => {
      const royaltyInfo = await Nft.royaltyInfo(
        constants.one, 
        ethers.utils.parseEther("100")
      );
      expect(royaltyInfo[0]).to.equal(artist.address);
      expect(royaltyInfo[1]).to.equal(ethers.utils.parseEther("3"));
    });

    it("owner can set royalty rate", async () => {
      const rate = (await Nft.royaltyInfo(constants.one, constants.oneEth))[1];
      expect(rate).to.equal(ethers.utils.parseUnits("0.03"));

      await Nft.connect(owner).setRoyaltyRate(ethers.BigNumber.from("200"), ethers.BigNumber.from("1000"));

      const newRate = (await Nft.royaltyInfo(constants.one, constants.oneEth))[1];
      expect(newRate).to.equal(ethers.utils.parseUnits("0.2"));
    });

    it("non-owner cannot set royalty rate", async () => {
      await expect(Nft.connect(artist).setRoyaltyRate(
        ethers.BigNumber.from("200"), 
        ethers.BigNumber.from("1000")
      )).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });

  describe("permit tests", () => {
    let chainId: any;

    beforeEach(async () => {
      const network = await ethers.provider.getNetwork();
      chainId = network.chainId;
      await mintSingleNft(Nft, artist);
    });

    it("initial nonce is 0", async () => {
      expect(await Nft.nonces(constants.one))
        .to.equal(ethers.constants.Zero);
    });

    it("domain separator returns properly", async () => {
      const _name = constants.nft.name;
      const version = constants.nft.version;
      const verifyingContract = Nft.address;
      expect(await Nft.DOMAIN_SEPARATOR())
        // if the next line is failing, try removing the underscore
        .to.equal(await ethers.utils._TypedDataEncoder.hashDomain({
          name: _name,
          version,
          chainId,
          verifyingContract
        }));
    });

    it("accepts owner signature (EOA)", async () => {
      await permit(Nft, artist, buyer, chainId);
      expect(await Nft.getApproved(constants.one))
        .to.equal(buyer.address);
    });

    it("accepts owner signature (EIP1271)");

    it("accepts owner signature (EIP2098)");

    it("rejects reused signature", async () => {
      const sig = await getSig(Nft, artist, buyer.address, chainId);
      await permit(Nft, artist, buyer, chainId);
      await Nft.connect(buyer)['safeTransferFrom(address,address,uint256,bytes)'](
        artist.address,
        buyer.address,
        constants.one,
        "0x"
      );
      // transfer back to artist to avoid owner == spender error
      await Nft.connect(buyer)['safeTransferFrom(address,address,uint256,bytes)'](
        buyer.address,
        artist.address,
        constants.one,
        "0x"
      );
      await expect(Nft.connect(buyer).permit(
        buyer.address,
        constants.one,
        ethers.constants.MaxUint256,
        sig
      )).to.be.revertedWith('ERC721Permit: unauthorized');
    });

    it("rejects permit to current owner", async () => {
      const sig = await getSig(Nft, artist, buyer.address, chainId);
      await expect(Nft.connect(artist).permit(
        artist.address,
        constants.one,
        ethers.constants.MaxUint256,
        sig
      )).to.be.revertedWith('ERC721Permit: approval to current owner');
    });

    it("rejects other signature", async () => {
      await expect(permit(Nft, buyer, buyer, chainId))
        .to.be.revertedWith("ERC721Permit: unauthorized");
    });

    it("rejects expired permit", async () => {
      const { timestamp } = await ethers.provider.getBlock("latest");
      const deadline = ethers.BigNumber.from(timestamp.toString());

      const sig = await getSig(Nft, artist, buyer.address, chainId);

      await expect(Nft.connect(artist).permit(
        buyer.address,
        constants.one,
        deadline,
        sig
      )).to.be.revertedWith('Permit expired');
    });

    it("can perform a one-tx permit/transfer", async () => {
      const deadline = ethers.constants.MaxUint256;
      const sig = await getSig(Nft, artist, buyer.address, chainId);

      expect(await Nft.ownerOf(constants.one))
        .to.equal(artist.address);
      expect(await Nft.getApproved(constants.one))
        .to.equal(ethers.constants.AddressZero);
      await Nft.connect(buyer)['transferWithPermit(address,address,uint256,uint256,bytes)'](
        artist.address,
        buyer.address,
        constants.one,
        deadline,
        sig
      );
      expect(await Nft.ownerOf(constants.one))
        .to.equal(buyer.address);
    });
  })

  describe("interface tests", () => {
    it("returns true for EIP721", async () => {
      let interface721 = hexlify(0x80ac58cd);
      expect(await Nft.supportsInterface(interface721))
        .to.be.true;
    });

    it("returns true for EIP721Metadata", async () => {
      let interface721Metadata = hexlify(0x5b5e139f);
      expect(await Nft.supportsInterface(interface721Metadata))
        .to.be.true;
    });

    it("returns true for EIP2981", async () => {
      let interface2981 = hexlify(0x2a55205a);
      expect(await Nft.supportsInterface(interface2981))
        .to.be.true;
    });

    it("returns true for EIP165", async () => {
      let interface165 = hexlify(0x01ffc9a7);
      expect(await Nft.supportsInterface(interface165))
        .to.be.true;
    });
  })

  describe("event tests", () => {
    it("Transfer emitted properly (transfer)", async () => {
      await mintSingleNft(Nft, artist);

      await expect(Nft.connect(artist)['safeTransferFrom(address,address,uint256,bytes)'](
        artist.address,
        buyer.address,
        constants.one,
        "0x"
      )).to.emit(Nft, 'Transfer')
        .withArgs(
          artist.address, 
          buyer.address, 
          constants.one
        );
    });

    it("Transfer emitted properly (mint)", async () => {
      await expect(Nft.connect(owner).mintWithUriAutoTokenId(
        artist.address,
        constants.nft.uri2
      )).to.emit(Nft, 'Transfer')
        .withArgs(
          ethers.constants.AddressZero, 
          artist.address, 
          constants.one
        );
    });

    it("Approval emitted properly", async () => {
      await mintSingleNft(Nft, artist);
      await expect(Nft.connect(artist).approve(buyer.address, constants.one))
        .to.emit(Nft, 'Approval')
        .withArgs(artist.address, buyer.address, constants.one);
    });

    it("ApprovalForAll emitted properly", async () => {
      expect(await Nft.isApprovedForAll(artist.address, buyer.address))
        .to.be.false;

      await expect(Nft.connect(artist).setApprovalForAll(buyer.address, true))
        .to.emit(Nft, "ApprovalForAll")
        .withArgs(artist.address, buyer.address, true);

      expect(await Nft.isApprovedForAll(artist.address, buyer.address))
        .to.be.true;
    });

    it("TokenURI emitted properly", async () => {
      await expect(Nft.connect(artist).mintWithUriAutoTokenId(
        artist.address,
        constants.nft.uri2
      )).to.emit(Nft, 'TokenURI')
        .withArgs(constants.one, constants.nft.uri2);
    });

    it("RoyaltyRateSet emitted properly", async () => {
      await expect(Nft.connect(owner).setRoyaltyRate(
        ethers.BigNumber.from("200"),
        ethers.BigNumber.from("1000")
      )).to.emit(Nft, "RoyaltyRateSet")
        .withArgs(ethers.BigNumber.from("200"), ethers.BigNumber.from("1000"));
    });
  });
});