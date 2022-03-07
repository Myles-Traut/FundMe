import hre, { ethers } from "hardhat";
import "@nomiclabs/hardhat-etherscan";
import chalk from "chalk";
import fs from "fs";
import { Contract, ContractFactory } from "ethers";
import ProgressBar from "progress";

interface DeploymentObject {
  name: string;
  address: string;
  args: any;
  contract: Contract;
}

// custom `deploy` in order to make verifying easier
const deploy = async (contractName: string, _args: any[] = [], overrides = {}, libraries = {}) => {
  console.log(` 🛰  Deploying: ${contractName}`);

  const contractArgs: any = _args || [];
  const stringifiedArgs = JSON.stringify(contractArgs);
  const contractArtifacts = await ethers.getContractFactory(contractName,{libraries: libraries});
  const contract = await contractArtifacts.deploy(...contractArgs, overrides);
  const contractAddress = contract.address;
  fs.writeFileSync(`artifacts/${contractName}.address`, contractAddress);
  fs.writeFileSync(`artifacts/${contractName}.args`, stringifiedArgs);

  // tslint:disable-next-line: no-console
  console.log("Deploying", chalk.cyan(contractName), "contract to", chalk.magenta(contractAddress));

  await contract.deployed();

  const deployed: DeploymentObject = { name: contractName, address: contractAddress, args: contractArgs, contract };

  return deployed
}

const pause = (time: number) => new Promise(resolve => setTimeout(resolve, time));

const verifiableNetwork = ["mainnet", "ropsten", "rinkeby", "goerli", "kovan", "mumbai", "polygon", "avalanche", "fuji", "fantom", "fantom_testnet", "gnosis", "optimism", "optimism_kovan", "arbitrum", "arbitrum_rinkeby", "avalanche", "fuji"];

async function main() {
  const network = process.env.HARDHAT_NETWORK === undefined ? "localhost" : process.env.HARDHAT_NETWORK;
  const [deployer] = await ethers.getSigners();
  
  // tslint:disable-next-line: no-console
  console.log("🚀 Deploying to", chalk.magenta(network), "!");
  if(
    network === "localhost" || 
    network === "hardhat"
  ) {

    // tslint:disable-next-line: no-console
    console.log(
      chalk.cyan("deploying contracts with the account:"),
      chalk.green(deployer.address)
    );

    // tslint:disable-next-line: no-console
    console.log("Account balance:", (await deployer.getBalance()).toString());
  }

  // this array stores the data for contract verification
  let contracts: DeploymentObject[] = [];

  // See README in this directory for more detailed instructions about using this script!

  let AuctionContract: ContractFactory;
  let AuctionInstance: any;

  let RegistryContract: ContractFactory;
  let RegistryInstance: any;

  let SaleContract: ContractFactory;
  let SaleInstance: any;

  // set address for NFT contract here
  let NFTaddress: string;
  // set address for ERC20 token here
  let tokenAddress: string;

  // Deploy Registry
  RegistryContract = await ethers.getContractFactory("Registry");
  RegistryInstance = await RegistryContract.connect(deployer).deploy();
  contracts.push(RegistryInstance);

  // Deploy Auction
  AuctionContract = await ethers.getContractFactory("Auction");
  AuctionInstance = await AuctionContract.connect(deployer).deploy(
    RegistryInstance.address
  );
  contracts.push(AuctionInstance);

  // Deploy Sale
  SaleContract = await ethers.getContractFactory("Sale");
  SaleInstance = await SaleContract.connect(deployer).deploy(
    RegistryInstance.address
  );
  contracts.push(SaleInstance);

  // uncomment in order to setup an NFT contract as recognized
  // await RegistryInstance.connect(deployer).setContractStatus(
  //   NFTaddress,
  //   true
  // );
  await RegistryInstance.connect(deployer).setContractStatus(
    AuctionInstance.address,
    true
  );
  await RegistryInstance.connect(deployer).setContractStatus(
    SaleInstance.address,
    true
  );
  // uncomment to add an ERC20 as accepted payment
  // await RegistryInstance.connect(deployer).setCurrencyStatus(
  //   tokenAddress.address,
  //   true
  // );

  await RegistryInstance.connect(deployer).setSystemWallet(deployer.address);

  // verification
  if(
    verifiableNetwork.includes(network)
    ) {
      let counter = 0;
      
      // tslint:disable-next-line: no-console
      console.log("Beginning Etherscan verification process...\n", 
        chalk.yellow(`WARNING: The process will wait two minutes for Etherscan \nto update their backend before commencing, please wait \nand do not stop the terminal process...`)
      );

      const bar = new ProgressBar('Etherscan update: [:bar] :percent :etas', { 
        total: 50,
        complete: '\u2588',
        incomplete: '\u2591',
      });
      // two minute timeout to let Etherscan update
      const timer = setInterval(() => {
        bar.tick();
        if(bar.complete) {
          clearInterval(timer);
        }
      }, 2300);

      await pause(120000);

      // there may be some issues with contracts using libraries 
      // if you experience problems, refer to https://hardhat.org/plugins/nomiclabs-hardhat-etherscan.html#providing-libraries-from-a-script-or-task
      // tslint:disable-next-line: no-console
      console.log(chalk.cyan("\n🔍 Running Etherscan verification..."));
      
      await Promise.all(contracts.map(async contract => {
        // tslint:disable-next-line: no-console
        console.log(`Verifying ${contract.name}...`);
        try {
          await hre.run("verify:verify", {
            address: contract.address,
            constructorArguments: contract.args
          });
          // tslint:disable-next-line: no-console
          console.log(chalk.cyan(`✅ ${contract.name} verified!`));
        } catch (error) {
          // tslint:disable-next-line: no-console
          console.log(error);
        }
      }));

  }

  // todos: add table
  // todo: don't forget to clean up when ready
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    // tslint:disable-next-line: no-console
    console.error(error);
    process.exit(1);
  });