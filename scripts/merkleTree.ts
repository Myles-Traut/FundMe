import hre, { ethers } from "hardhat";
import chalk from "chalk";
import { MerkleTree } from "merkletreejs";
// need to use require since they don't use an ES module
const KECCAK256 = require("keccak256");

// for creating a tree and returning the merkle root
// can pass in an array of addresses from the command line
// or paste in directly
// NOTE: this tree works for address-only trees, and will need
// to be modified for trees with more args in them
const createTree = async (_addresses?: string[]) => {
  // if you are putting the list of addresses in the file directly,
  // put them in an array here (as "addresses")
  const addresses: string[] = _addresses && _addresses.length > 0 ? _addresses : [];
  const hashedAddresses = addresses.map(addr => ethers.utils.keccak256(addr));

  const merkleTree = new MerkleTree(
    hashedAddresses,
    KECCAK256,
    { sortPairs: true }
  );

  const merkleRoot = merkleTree.getHexRoot();

  chalk.blue("Merkle Tree: ");
  chalk.white(`${merkleTree}`);
  
  chalk.blue("Merkle Root: ");
  chalk.bgCyan(`${merkleRoot}`);

  return { merkleRoot, merkleTree }
}

// given an address and a merkle tree (not just the root), 
// generates a proof - this will be needed for claiming an airdrop, etc
// NOTE: this proof will only work for an address-based tree
const getProof = async (address: string, merkleTree: MerkleTree) => {
  const merkleProof = merkleTree.getHexProof(ethers.utils.keccak256(address));

  chalk.blue("Merkle Proof: ");
  chalk.bgGreen(`${merkleProof}`);

  return merkleProof
}