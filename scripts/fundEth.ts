// helper script for funding mainnet fork accounts with Dai for testing
import hre, { ethers } from "hardhat";

const main = async () => {
  const signers = await ethers.getSigners();

  await hre.network.provider.request({
    method: "hardhat_impersonateAccount",
    params: ["0x000000000000000000000000000000000000dEaD"]
  });

  const deadSigner = await ethers.getSigner("0x000000000000000000000000000000000000dEaD");

  for (let i = 0; i < signers.length; i++) {
    await deadSigner.sendTransaction({ to: `${signers[i]}`, value: `${ethers.utils.parseEther("10000")}`});  
  }

  await hre.network.provider.request({
    method: "hardhat_stopImpersonateAccount",
    params: ["0x000000000000000000000000000000000000dEaD"]
  });
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    // tslint:disable-next-line: no-console
    console.error(error);
    process.exit(1);
  });
