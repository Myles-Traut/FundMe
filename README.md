# Warp Core (Chain)

Warp Core is a web3 development boilerplate built using NextJS, UseDapp, Ethers and Hardhat. This is the contract development section of the repo.

## Project Setup

### Install dependencies

If you are using the Warp Core monorepo (the root level will have an `app` and a `chain` folder), then `cd ..` to the root directory to install dependencies - the details are in the README there.

If you are using the `chain` environment as a standalone repo, then just use Yarn to install the dependencies from this directory:
```
yarn
```
### Start project

#### Quickstart

First install dependencies as detailed above.

Next, copy `.example.env` and rename it `.env`, filling in data in the relevant fields. The blockchain environment makes use of `dotenv` to protect API keys and private keys from being uploaded to the server, and the `.example.env` contains all of the fields you may need.

To start a local development chain, use `yarn chain`. There is a framework built in to Warp Core for forking chains in test environments, and is covered in greater detail below.

Running `yarn test` will run the contract test suite.

Deploying to a local Hardhat chain should work out of the box (once you have a `.env`), but in order to deploy to a network, you'll need to copy the `.example.env` file, rename it `.env`, and provide a private key for deployment along with an Alchemy api key.

The `.example.env` has fields for a different private key to be used as the deploying account for all of the supported networks. It is populated by default with the private key of the default deployer address from the Hardhat Network. THIS IS AN INSECURE ACCOUNT, and any real funds (and often even test funds) placed in it will likely be swept (stolen) as soon as they are deposited, and will be lost LIKE TEARS IN THE RAIN. It is given for convenience when deploying to local forks, but it is advisable to remove it and to use your own deployer private key even on testnets.

Note: there must be a private key in the `.env` for each network in `hardhat.config.ts` in order for it to run - you cannot leave a field empty. If for whatever reason you need to, comment out the relevant network in `hardhat.config.ts` - Hardhat looks for each network in the `network` object when it runs, and if it can't find a key for _any_ network, even if it is not the one you are currently using, it will throw an error.

After starting the chain locally and adding the deployer address you can deploy your contracts using `yarn deploy --network NETWORK` where `NETWORK` is replaced with the lowercase name of the network you wish to deploy to. (If no flag is given, the deploy will default to the local dev net.) To deploy to a network (other than the local dev net), uncomment the relevant snippet from `hardhat.config.ts` and ensure that you have added a private key and Infura API key to the `.env` file. Then run `yarn deploy` with the network flag, for example `yarn deploy --network rinkeby`. This can also be changed from inside the `hardhat.config.ts` file by changing the `defaultNetwork` parameter. Since there are some unique customizations in the deploy script, it'll be covered in more detail in a separate [README](./scripts/README.md).

## Warp Core Features:
### Deploy script

There is a customized deploy script which leverages `hardhat-etherscan` in order to provide auto-verification on deploy. There is a separate README in the [`scripts/`](./scripts/README.md) with detailed usage instructions.

### Mainnet forking

The environment provides optionality for testing in an environment forked off an existing network. This allows interacting with existing infrastructure in a "free" environment. As with traditional dev chains, you are provided with accounts prefunded with ETH. In addition you are able to transfer from other accounts, so if you need a particular token (such as DAI), you have the ability to transfer them to your account. (You have the ability to emulate any account and send txs from it.) For more details, see [Hardhat's mainnet forking docs](https://hardhat.org/hardhat-network/guides/mainnet-forking.html).

Prerequisites:
* An API key for a provider that supports mainnet forking. We have configured Warp Core to work with [Alchemy](https://alchemy.com) on any chain supported by them, though any provider can be wired up. We've configured [Moralis](https://moralis.io) for Avalanche (mainnet and Fuji testnet) and Fantom Opera (mainnet).

The following instructions are for forking Ethereum's mainnet, which is how the environment has been configured. With some customization, you can also fork other chains. This will be detailed in a later section.

#### Instructions

1. Copy the `.example.env` file and rename it `.env` if you have not done so already
2. Place your Alchemy API key in the `.env` file under `MAINNET_ALCHEMY_KEY`
3. Open a terminal inside the repo, and run `yarn fork` - the terminal should populate with 20 accounts (address, private key) prefunded with 10000 ETH

If you would like to test using MetaMask or similar, make sure that they are pointed at port 8545 locally (`chainId` should be 31337). The accounts can be added via private key if desired.

At this point you should have a functional mainnet fork on port 8545, and can test the frontend on it.

##### Switching Endpoint Providers

If you wish to use a provider other than the ones preconfigured in Warp Core, changing them is simple. Go to `hardhat.config.ts`, find the network you wish to change the provider for, and change the `url` field to reflect the endpoint you wish to use. Remember not to put API keys directly in `hardhat.config.ts`, as they will be pushed with the rest of your repo, and likely stolen. For Moralis, a `MORALIS_API` is already provided in the `.example.env`, for other providers (such as Infura) we recommend creating something similar in order to protect your keys.

For example, if you wished to change the mainnet endpoint provider to Infura, you would find the `mainnet` network object, which currently defaults to:
```typescript
mainnet: {
  url: `https://eth-mainnet.alchemyapi.io/v2/${process.env.ALCHEMY_API}`,
  accounts: [`${process.env.MAINNET_DEPLOYER_PRIV_KEY}`],
},
```
You'd want to add an `INFURA_API` to your instance of the `.env`, and add your Infura API key to it, and then change the `url` in the object above to:
```typescript
mainnet: {
  url: `https://mainnet.infura.io/v3/${process.env.INFURA_API}`,
  accounts: [`${process.env.MAINNET_DEPLOYER_PRIV_KEY}`],
},
```
If you wish to connect to a local node, simply replace the `url` value with `http://localhost:PORT_NUMBER`, oftentimes `http://localhost:8545`.
#### Helper Scripts

**Forking Scripts:**

There are convenience scripts that have been written to assist with commonly needed tasks once operating inside a forked environment:

*Funding DAI:* In order to fund the accounts with Dai, run `yarn fund:dai`, which will give each prefunded account 1 million Dai. (This is done by syphoning Dai locked in the cDai (Compound's Dai token) contract.)

*Refilling ETH:* If you run out of ETH on the accounts, they can be refilled with 10,000 ETH each by running `yarn fund:eth`. (This is done by syphoning from `0x0000...dead`).

*Resetting the fork:* You can re-fork mainnet from the latest block (resetting any state changed while previously forked) 

All of these have helper commands in the `package.json` so they can easily be run from the command line (`fund:dai`, `fund:eth`, and `reset`).

**Merkle Tree Scripts:**

`scripts/merkleTree.ts` contains two functions useful for dealing with Merkle trees being generated from an array of addresses. One is `createTree` which has an optional arg of an array of addresses, and creates a Merkle tree based on it, outputting the Merkle root and the whole tree in console, and also returning both in an object. The other is `getProof`, which given an address and a tree (not root, the whole tree), generates a proof. This is generally needed when claiming against a Merkle tree. These are currently untested and provided as-is, but based off of working code from a client project.

Note that the current functions generate a Merkle tree only based off of an address. If you would like to generate a Merkle tree based on additional parameters (most common case is probably a whitelist entitling members to a varying amount of NFTs), the script will need to modified or expanded.

A future improvement could involve enabling these to have better use from the command line, as it may be useful to be able to generate a root/tree for clients on the fly, or even give them the script so that they could. Another might be making them more modular so they can work with additional parameters (see paragraph above).

#### Forking Additional Chains

While the scripts are currently configured to fork Ethereum's mainnet, they can also be used to fork any other chain, provided access to an archive node, either through an API key or by running one. We'll focus on leveraging Alchemy to do this, as it comes configured out-of-the-box in Warp Core. Look at the `fork` script in the `package.json`. Currently it reads:
```json
"fork": "MAINNET_ALCHEMY_KEY=$(grep MAINNET_ALCHEMY_KEY .env | cut -d '=' -f2) && yarn hardhat node --fork \"https://eth-mainnet.alchemyapi.io/v2/$MAINNET_ALCHEMY_KEY\"",
```
This reads the API key from the `.env` file. As you can see, it is currently using using Alchemy's mainnet endpoint (`eth-mainnet.alchemyapi.io`). Simply switch this for the endpoint of the chain you wish to use, as long as Alchemy supports it, which is true for every chain currently supported with the exception of xDai, Avalanche, and Fantom. (The Alchemy base URLs can be found in `hardhat.config.ts` in the various network key pairs.) As of this writing, we are unaware if Moralis (Avalanche, Fantom) or Blockscout (Gnosis) support forking using their API keys.


### Project structure

The chain environment is a [Hardhat](https://hardhat.org) environment (converted to Typescript). There are extensions that are enabled out-of-the-box and additional customizations (such as the use of `.env` to obfuscate private keys), but the architecture is identical.

The `contract` folder contains the smart contracts
The `scripts` folder contains scripts, including the deploy script
The `test` folder contains files for each written contract and full coverage tests
The `typings` folder contains file for loading js modules such as dotenv
The `docs` folder contains docs on the contracts autogenerated from natspec by Primitive's dodoc Hardhat plugin

## Notes on Testing

Running `yarn test` will run the contract test suite.

Hardhat's testing framework is built on Waffle, which is built on Chai, which is built on Mocha. If you need to alter Mocha defaults, this can be done through the `mocha` object in `hardhat.config.ts`. A common example is the test timeout - Mocha defaults to 6 seconds, and tests can need longer. A commented out line appears in the `mocha` object for this. Uncommenting it will move the timeout to five minutes, which may be too long for your needs, so edit as you see fit.

The `test` directory contains a `constants` with an object of commonly used constants. By importing it you have access to them in your tests, which can save valuable time. Functions that are often used, such as deployment setups, minting, approving, and transferring have `helper` files specific to the tokens they are written for (ERC20, ERC721, or ERC1155).

## Future Improvements

This repo is a work in progress, and suggestions are welcome for how it can be improved. Some ideas are:

- provide a boilerplate for bonding curves
- add additional helper functions
- provide better output on deploy
- full coverage on contract tests
- 2981 and 4494 tests should be split out
- could use a stock pfp 721
