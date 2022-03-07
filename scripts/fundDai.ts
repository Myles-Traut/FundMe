// helper script for funding mainnet fork accounts with Dai for testing
import hre, { ethers } from "hardhat";
import * as daiABI from '../artifacts/@openzeppelin/contracts/token/ERC20/ERC20.sol/ERC20.json';

const main = async () => {
  const signers = await ethers.getSigners();

  const daiContract = new ethers.Contract("0x6b175474e89094c44da98b954eedeac495271d0f", daiABI.abi);

  await hre.network.provider.request({
    method: "hardhat_impersonateAccount",
    params: ["0x5d3a536E4D6DbD6114cc1Ead35777bAB948E3643"]
  });

  const daiSigner = await ethers.getSigner("0x5d3a536E4D6DbD6114cc1Ead35777bAB948E3643");

  for (let i = 0; i < signers.length; i++) {
    await daiContract.connect(daiSigner).transfer(signers[i].address, ethers.utils.parseUnits("1000000"));    
  }

  await hre.network.provider.request({
    method: "hardhat_stopImpersonateAccount",
    params: ["0x5d3a536E4D6DbD6114cc1Ead35777bAB948E3643"]
  });
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    // tslint:disable-next-line: no-console
    console.error(error);
    process.exit(1);
  });
