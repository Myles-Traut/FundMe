import { Contract } from "@ethersproject/contracts";
import { MockERC1155 } from "../typechain-types";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { hre, ethers, expect, constants } from "./constants.test";
import { 
  deployNft,
  mintSingleNft,
  mintBatch
 } from "./helpers1155.test";
import { BytesLike } from "ethers";
import { formatBytes32String, hexlify, parseBytes32String } from "ethers/lib/utils";


describe("ERC1155 tests", () => {
  let owner: SignerWithAddress, artist: SignerWithAddress, buyer: SignerWithAddress;
  let Nft: MockERC1155;

  beforeEach(async () => {
    // Put logic that will be needed before every test
    [owner, artist, buyer] = await ethers.getSigners();

    Nft = await deployNft(owner);
  });

  describe("general view functions", () => {
    it("displays uri properly", async () => {
      await mintSingleNft(Nft, artist);

      expect(await Nft.uri(constants.one))
        .to.equal(constants.nft.uri);
    });
  })

  describe("whitelist and mint tests", () => {
    it("mint", async () => {
      expect(await Nft.balanceOf(buyer.address, "1")).to.equal(ethers.constants.Zero);
      await Nft.connect(artist).mintWithUriAutoTokenId(buyer.address, "1", constants.nft.uri);
      expect(await Nft.balanceOf(buyer.address, "1")).to.equal(constants.one);
    });

    it("batch mint", async () => {
      expect(await Nft.balanceOf(buyer.address, "1")).to.equal(ethers.constants.Zero);
      await Nft.connect(artist).mintBatchWithAutoTokenIdAndUri(
        buyer.address, 
        [constants.one],
        [constants.nft.uri], 
      );
      expect(await Nft.balanceOf(buyer.address, "1")).to.equal(constants.one);
    });
  });

  describe("approval and transfer tests", () => {
    it("can approve operator on all NFTs", async () => {
      expect(await Nft.isApprovedForAll(artist.address, buyer.address))
        .to.be.false;

      await Nft.connect(artist).setApprovalForAll(buyer.address, true);

      expect(await Nft.isApprovedForAll(artist.address, buyer.address))
        .to.be.true;
    });

    it("approved can transfer NFTs", async () => {
      await mintSingleNft(Nft, artist);

      expect(await Nft.isApprovedForAll(artist.address, buyer.address))
        .to.be.false;

      await Nft.connect(artist).setApprovalForAll(buyer.address, true);

      expect(await Nft.isApprovedForAll(artist.address, buyer.address))
        .to.be.true;
      expect(await Nft.balanceOf(buyer.address, constants.one))
        .to.equal(ethers.constants.Zero);

      await Nft.connect(buyer).safeTransferFrom(
        artist.address,
        buyer.address,
        constants.one,
        constants.one,
        "0x"
      );

      expect(await Nft.balanceOf(buyer.address, constants.one))
        .to.equal(constants.one);
    });

    it("safeTransferFrom works properly", async () => {
      await mintSingleNft(Nft, artist);

      expect(await Nft.balanceOf(artist.address, constants.one))
        .to.equal(constants.one);
      expect(await Nft.balanceOf(buyer.address, constants.one))
        .to.equal(ethers.constants.Zero);

      await Nft.connect(artist).safeTransferFrom(
        artist.address,
        buyer.address,
        constants.one,
        constants.one,
        "0x"
      );

      expect(await Nft.balanceOf(artist.address, constants.one))
        .to.equal(ethers.constants.Zero);
      expect(await Nft.balanceOf(buyer.address, constants.one))
        .to.equal(constants.one);
    });

    it("safeBatchTransferFrom works properly", async () => {
      await mintBatch(Nft, owner, artist);

      expect(await Nft.balanceOf(artist.address, constants.one))
        .to.equal(constants.one);
      expect(await Nft.balanceOf(buyer.address, constants.one))
        .to.equal(ethers.constants.Zero);
      expect(await Nft.balanceOf(artist.address, ethers.BigNumber.from("2")))
        .to.equal(constants.one);
      expect(await Nft.balanceOf(buyer.address, ethers.BigNumber.from("2")))
        .to.equal(ethers.constants.Zero);

      await Nft.connect(artist).safeBatchTransferFrom(
        artist.address,
        buyer.address,
        [constants.one, ethers.BigNumber.from("2")],
        [constants.one, constants.one],
        "0x"
      );

      expect(await Nft.balanceOf(artist.address, constants.one))
        .to.equal(ethers.constants.Zero);
      expect(await Nft.balanceOf(buyer.address, constants.one))
        .to.equal(constants.one);
      expect(await Nft.balanceOf(artist.address, ethers.BigNumber.from("2")))
        .to.equal(ethers.constants.Zero);
      expect(await Nft.balanceOf(buyer.address, ethers.BigNumber.from("2")))
        .to.equal(constants.one);
    });
  });
  

  describe("royalty information", () => {
    beforeEach(async () => {
      await mintSingleNft(Nft, artist);
    });

    it("displays royalty information properly", async () => {
      const royaltyInfo = await Nft.royaltyInfo(constants.one, ethers.utils.parseEther("100"));
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

    // it("non-owner cannot set royalty rate", async () => {
    //   await expect(Nft.connect(artist).setRoyaltyRate(ethers.BigNumber.from("200"), ethers.BigNumber.from("1000")))
    //     .to.be.revertedWith("Ownable: caller is not the owner");
    // });
  });

  describe("interface tests", () => {
    it("returns true for EIP1155", async () => {
      let interface1155: BytesLike = hexlify(0xd9b67a26);
      expect(await Nft.supportsInterface(interface1155))
        .to.be.true;
    });

    it("returns true for EIP1155MetadataURI", async () => {
      let interface1155Metadata: BytesLike = hexlify(0x0e89341c);
      expect(await Nft.supportsInterface(interface1155Metadata))
        .to.be.true;
    });

    it("returns true for EIP2981", async () => {
      let interface2981: BytesLike = hexlify(0x2a55205a);
      expect(await Nft.supportsInterface(interface2981))
        .to.be.true;
    });

    it("returns true for EIP165", async () => {
      let interface165: BytesLike = hexlify(0x01ffc9a7);
      expect(await Nft.supportsInterface(interface165))
        .to.be.true;
    });
  })

  describe("event tests", () => {
    it("TransferSingle emitted properly (transfer)", async () => {
      await mintSingleNft(Nft, artist);

      await expect(Nft.connect(artist).safeTransferFrom(
        artist.address,
        buyer.address,
        constants.one,
        constants.one,
        "0x"
      )).to.emit(Nft, 'TransferSingle')
        .withArgs(
          artist.address, 
          artist.address, 
          buyer.address, 
          constants.one, 
          constants.one
        );
    });

    it("TransferSingle emitted properly (mint)", async () => {
      await expect(Nft.connect(artist).mintWithUriAutoTokenId(
        artist.address,
        constants.one,
        constants.nft.uri
      )).to.emit(Nft, 'TransferSingle')
        .withArgs(
          artist.address, 
          ethers.constants.AddressZero, 
          artist.address, 
          constants.one, 
          constants.one
        );
    });

    it("TransferBatch emitted properly (transfer)", async () => {
      await mintBatch(Nft, owner, artist);

      await expect(Nft.connect(artist).safeBatchTransferFrom(
        artist.address,
        buyer.address,
        [constants.one, ethers.BigNumber.from("2")],
        [constants.one, constants.one],
        "0x"
      )).to.emit(Nft, "TransferBatch")
        .withArgs(
          artist.address,
          artist.address,
          buyer.address,
          [constants.one, ethers.BigNumber.from("2")],
          [constants.one, constants.one]
        );
    });

    // mock contract currently does not use _mintBatch
    // so this test would fail
    // it("TransferBatch emitted properly (mint)", async () => {
    //   await expect(Nft.connect(artist).mintBatchWithAutoTokenIdAndUri(
    //     artist.address,
    //     [constants.one, constants.one],
    //     [constants.nft.uri, constants.nft.uri2]
    //   )).to.emit(Nft, "TransferBatch")
    //     .withArgs(
    //       artist.address,
    //       ethers.constants.AddressZero,
    //       artist.address,
    //       [constants.one, ethers.BigNumber.from("2")],
    //       [constants.one, constants.one]
    //     );
    // });

    it("ApprovalForAll emitted properly", async () => {
      expect(await Nft.isApprovedForAll(artist.address, buyer.address))
        .to.be.false;

      await expect(Nft.connect(artist).setApprovalForAll(buyer.address, true))
        .to.emit(Nft, "ApprovalForAll")
        .withArgs(artist.address, buyer.address, true);

      expect(await Nft.isApprovedForAll(artist.address, buyer.address))
        .to.be.true;
    });

    it("RoyaltyRateSet emitted properly", async () => {
      await expect(Nft.connect(owner).setRoyaltyRate(
        ethers.BigNumber.from("20"),
        ethers.BigNumber.from("1000")
      )).to.emit(Nft, "RoyaltyRateSet")
        .withArgs(ethers.BigNumber.from("20"), ethers.BigNumber.from("1000"));
    });


    it("URI emitted properly", async () => {
      await expect(Nft.connect(artist).mintWithUriAutoTokenId(
        artist.address,
        constants.one,
        constants.nft.uri
      )).to.emit(Nft, "URI")
        .withArgs(constants.nft.uri, constants.one);
    });
  });
});