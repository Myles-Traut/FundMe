// helper script for resetting mainnet forks
// it will create a new fork from the current block
import hre, { ethers, network } from "hardhat";

const main = async () => {
  await network.provider.request({
    method: "hardhat_reset",
    params: [
      {
        forking: {
          jsonRpcUrl: `https://eth-mainnet.alchemyapi.io/v2/${process.env.MAINNET_ALCHEMY_KEY}`
        }
      }
    ]
  })
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    // tslint:disable-next-line: no-console
    console.error(error);
    process.exit(1);
  });
