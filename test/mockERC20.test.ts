import { expect } from "chai";
import { ethers } from 'hardhat';
import { BigNumber, Contract, Wallet } from 'ethers';
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { constants } from "./constants.test";
import { MockERC20, MockERC20__factory } from "../typechain-types";

describe("ERC20 tests",() => {

  let owner: SignerWithAddress;
  let alice: SignerWithAddress;
  let bob: SignerWithAddress;

  let TokenArtifacts: MockERC20__factory;
  let Token: MockERC20;

  beforeEach(async () => {
    [owner, alice, bob] = await ethers.getSigners();
    TokenArtifacts = await ethers.getContractFactory("MockERC20");
    Token = await TokenArtifacts.deploy();

    await Token.connect(owner).mint(owner.address, constants.ERC20.tokenSupply);
  });

  describe("Initial Mint", () => {

    it("Deployment should assign the total supply of tokens to the owner", async () =>  {
      const ownerBalance = await Token.balanceOf(owner.address);
      expect(await Token.totalSupply()).to.equal(ownerBalance);
    });
  
    it("Deployment create correct amount of tokens", async () =>  {
      const totalSupply = await Token.totalSupply();
      expect(constants.ERC20.tokenSupply).to.equal(totalSupply);
    });

    it("Should revert when the reciever is the zero address", async () => {
      await expect(Token.connect(owner).mint(ethers.constants.AddressZero, constants.ERC20.transfer)
      ).to.be.revertedWith("ERC20: mint to the zero address");
    });

    it("Should emit transfer event", async () => {
      await expect(Token.connect(owner).mint(alice.address, constants.ERC20.transfer)
      ).to.emit(Token, 'Transfer').withArgs(ethers.constants.AddressZero, alice.address, constants.ERC20.transfer);
    });

  })

  describe("Transactions", () => {

    it("Should transfer tokens between accounts", async () => {

      const originalBalanceOfOwner = await Token.balanceOf(owner.address);
      await Token.connect(owner).transfer(alice.address, constants.ERC20.transfer);
  
      // Assert
      expect(await Token.balanceOf(alice.address)).to.equal(constants.ERC20.transfer);
      expect(await Token.balanceOf(owner.address)).to.equal(originalBalanceOfOwner.sub(constants.ERC20.transfer));
  
      // Act
      await Token.connect(alice).transfer(bob.address, constants.ERC20.transfer);
  
      // Assert
      expect(await Token.balanceOf(alice.address)).to.equal(0);
      expect(await Token.balanceOf(bob.address)).to.equal(constants.ERC20.transfer);
    });

    it("Should revert when the sender does not have enough balance", async () => {
      await expect(Token.connect(alice).transfer(
        bob.address, constants.ERC20.tooMuch)
      ).to.be.revertedWith("ERC20: transfer amount exceeds balance");
    });

    it("Should revert when recipient is the zero address", async () => {
      const recipient = ethers.constants.AddressZero;

      await Token.connect(owner).transfer(alice.address, constants.ERC20.transfer);

      await expect(Token.connect(alice).transfer(
        recipient, constants.ERC20.transfer)
      ).to.be.revertedWith("ERC20: transfer to the zero address");
    });

    it("Should emit transfer event", async () => {
      await expect(Token.connect(owner).transfer(
        alice.address, constants.ERC20.transfer)
      ).to.emit(Token, 'Transfer').withArgs(owner.address, alice.address, constants.ERC20.transfer);
    });

  });

  describe("Burn", () => {

    it("Should decrease total supply", async () => {
      const expectedSupply = await Token.totalSupply();
      await Token.connect(owner).burn(owner.address, constants.ERC20.transfer);
      expect(await Token.totalSupply()).to.equal(expectedSupply.sub(constants.ERC20.transfer));
    });

    it("Should decrease holders supply", async () => {
      const originalBalance = await Token.balanceOf(owner.address);
      await Token.connect(owner).burn(owner.address, constants.ERC20.transfer);
      expect(await Token.balanceOf(owner.address)).to.equal(originalBalance.sub(constants.ERC20.transfer));
    });

    it("Should revert when the burner is the zero address", async () => {
      await expect(Token.burn(
        ethers.constants.AddressZero, constants.ERC20.transfer)
      ).to.be.revertedWith("ERC20: burn from the zero address");
    });

    it("Should revert when the burner has insufficient funds", async () => {
      await expect(Token.connect(bob).burn(
        bob.address, constants.ERC20.tooMuch)
      ).to.be.revertedWith("ERC20: burn amount exceeds balance");
    });

    it("Should emit transfer event", async () => {
      await expect(Token.connect(owner).burn(
        owner.address, constants.ERC20.transfer)
      ).to.emit(Token, 'Transfer').withArgs(owner.address, ethers.constants.AddressZero, constants.ERC20.transfer);
    });

  });

  describe("Decreasing the allowance", () => {

    it("Should revert if spender allowance is less than subtracting value", async () => {
      await expect(Token.connect(owner).decreaseAllowance(alice.address, constants.ERC20.transfer)).to.be.revertedWith("ERC20: decreased allowance below zero");
    });

    it("Should decrease spenders allowance", async () => {

      await Token.connect(owner).increaseAllowance(alice.address, constants.ERC20.transfer);

      const originalAliceAllowance = await Token.allowance(owner.address, alice.address);

      await Token.connect(owner).decreaseAllowance(alice.address, constants.ERC20.smallTransfer);

      expect(await Token.allowance(owner.address, alice.address)).to.equal(originalAliceAllowance.sub(constants.ERC20.smallTransfer));

    });

    it("Should set allowance to zero when all the allowance is removed", async () => {

      await Token.connect(owner).increaseAllowance(alice.address, constants.ERC20.transfer);

      await Token.connect(owner).decreaseAllowance(alice.address, constants.ERC20.transfer);

      expect(await Token.allowance(owner.address, alice.address)).to.equal(0);

    });

    it("Should emit approval event", async () => {

      await Token.connect(owner).increaseAllowance(alice.address, constants.ERC20.transfer);
 
      await expect(Token.connect(owner).decreaseAllowance(alice.address, constants.ERC20.smallTransfer)
      ).to.emit(Token, 'Approval').withArgs(owner.address, alice.address, (constants.ERC20.transfer).sub(constants.ERC20.smallTransfer));

    });

  });

  describe("Increasing the allowance", () => {
    
    it("Should increase the spenders allowance", async () => {
      const originalAliceAllowance = await Token.allowance(owner.address, alice.address);

      await Token.connect(owner).increaseAllowance(alice.address, constants.ERC20.transfer);

      expect(await Token.allowance(owner.address, alice.address)).to.equal(originalAliceAllowance.add(constants.ERC20.transfer));
    });

    it("Should revert if spender is the zero-address", async () => {
      await expect(Token.connect(owner).increaseAllowance(ethers.constants.AddressZero, constants.ERC20.transfer)).to.be.revertedWith("ERC20: approve to the zero address");
    });

    it("Should emit approval event", async () => {
 
      await expect(Token.connect(owner).increaseAllowance(alice.address, constants.ERC20.transfer)
      ).to.emit(Token, 'Approval').withArgs(owner.address, alice.address, constants.ERC20.transfer);

    });

  });

  it("Should allocate allowances correctly", async () => {
    
    await Token.connect(owner).approve(alice.address, constants.ERC20.transfer);

    const aliceBal = await Token.allowance(owner.address, alice.address);

    expect(await Token.allowance(owner.address, alice.address)).to.equal(constants.ERC20.transfer);

    await Token.connect(alice).transferFrom(owner.address, bob.address, constants.ERC20.transfer);

    expect(await Token.allowance(owner.address, alice.address)).to.equal(ethers.utils.parseEther("0"));

    await Token.connect(owner).approve(bob.address, constants.ERC20.transfer);

    const bobBalance = await Token.balanceOf(bob.address);

    expect(bobBalance).to.equal(constants.ERC20.transfer);

  });
  
  it("Should have the correct name", async () => {
    expect(await Token.name()).to.equal(constants.ERC20.name);
  });

  it("Should have the correct symbol", async () => {
    expect(await Token.symbol()).to.equal(constants.ERC20.symbol);
  });

  it("Should have 18 decimals", async function () {
    expect(await Token.decimals()).to.equal(18);
  });
});