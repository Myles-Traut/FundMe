// eslint-disable-next-line node/no-extraneous-import
import { Contract } from "@ethersproject/contracts";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { parseEther } from "ethers/lib/utils";
// eslint-disable-next-line node/no-missing-import
import { ethers, expect } from "./constants.test";
// eslint-disable-next-line node/no-missing-import
import { deployFundMe } from "./helpersTemplate.test";

describe("tests", () => {
  let owner: SignerWithAddress,
    funder: SignerWithAddress,
    funder2: SignerWithAddress;

  // this var name should be changed to something more descriptive
  let FundMe: Contract;

  beforeEach(async () => {
    // Put logic that will be needed before every test
    [owner, funder, funder2] = await ethers.getSigners();
    FundMe = await deployFundMe(owner);
  });

  describe("FundMe tests", () => {
    it("initialises properly", async () => {
      // console.log(await FundMe.getPrice());
      expect(await FundMe.owner()).to.equal(owner.address);
      const fundersArrayLen = await FundMe.funders.length;
      expect(fundersArrayLen).to.equal(0);
      expect(
        await FundMe.addressToAmountFunded(ethers.constants.AddressZero)
      ).to.equal(0);
    });
  });

  // there can easily be more than one section for this
  // this is just a loose category, things like minting, royalties, and more
  //   are commonly split into their own describe blocks
  describe("state-changing functions", () => {
    it("fund accepts donation", async () => {
      await FundMe.connect(funder).fund({
        value: parseEther("0.005"),
      });
      const funderAddress = await FundMe.funders(0);
      expect(funderAddress).to.equal(funder.address);
      const fundedAmount = await FundMe.addressToAmountFunded(funderAddress);
      expect(fundedAmount).to.equal(parseEther("0.005"));
    });

    it("fund accepts multiple donations", async () => {
      await FundMe.connect(funder).fund({
        value: parseEther("0.005"),
      });
      await FundMe.connect(funder2).fund({
        value: parseEther("1"),
      });
      const funder1Address = await FundMe.funders(0);
      const funder2Address = await FundMe.funders(1);
      const fundedAmount1 = await FundMe.addressToAmountFunded(funder1Address);
      const fundedAmount2 = await FundMe.addressToAmountFunded(funder2Address);
      const totalAmountFunded = fundedAmount1.add(fundedAmount2);
      expect(totalAmountFunded).to.equal(parseEther("1.005"));
    });

    it("Owner can withdraw funds", async () => {
      await FundMe.connect(funder).fund({
        value: parseEther("1"),
      });
      await FundMe.connect(owner).withdraw();
      const balance = await ethers.provider.getBalance(FundMe.address);
      // console.log(balanceBefore, balanceAfter);
      expect(balance).to.equal(0);
    });
  });

  describe("error tests", () => {
    it("Only owner can withdraw funds", async () => {
      await FundMe.connect(funder).fund({
        value: parseEther("1"),
      });
      await expect(FundMe.connect(funder).withdraw()).to.be.revertedWith(
        "Unauthorised"
      );
    });

    it("fund reverts when insufficient amount is funded", async () => {
      await expect(
        FundMe.connect(funder).fund({
          value: parseEther("0.00001"),
        })
      ).to.be.revertedWith("Please fund more eth");
    });
  });

  describe("view tests", () => {
    it("can view amount available", async () => {
      await FundMe.connect(funder).fund({
        value: parseEther("1"),
      });
      await FundMe.connect(funder2).fund({
        value: parseEther("1"),
      });
      const total = await FundMe.viewFundsAvailable();

      await expect(total).to.equal(parseEther("2"));
    });
  });
});