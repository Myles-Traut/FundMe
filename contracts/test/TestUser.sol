// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

/**
  THIS CONTRACT ONLY FOR TESTING PURPOSES
 */

import "./Mock1155.sol";
import "../interfaces/mrkt_interfaces/ISale.sol";
import "../interfaces/mrkt_interfaces/IAuction.sol";

contract TestUser {
    function mintNFTandCreateSale(address nftContract, address saleContract)
        public
    {
        Mock1155 NFT = Mock1155(nftContract);
        NFT.mint(
            address(this),
            1,
            100
        );

        ISale Sale = ISale(saleContract);
        Sale.createSale(
            nftContract,
            1, // this should always be the first NFT
            100,
            block.timestamp,
            block.timestamp + 2629800, // + 1 month
            1 ether,
            10,
            address(0xaAaAaAaaAaAaAaaAaAAAAAAAAaaaAaAaAaaAaaAa)
        );
    }

    function mintNFTandCreateAuction(
        address nftContract,
        address auctionContract,
        address approvedContract
    ) public {
        Mock1155 NFT = Mock1155(nftContract);

        NFT.mint(
            address(this),
            1,
            100
        );

        NFT.setApprovalForAll(approvedContract, true);

        IAuction Auction = IAuction(auctionContract);
        Auction.createAuction(
            nftContract,
            1, // this should always be the first NFT
            block.timestamp,
            block.timestamp + 2629800, // + 1 month
            1 ether,
            address(0xaAaAaAaaAaAaAaaAaAAAAAAAAaaaAaAaAaaAaaAa)
        );
    }

    // should fail since not payable
    function failClaimFromSale(address saleContract) public {
        ISale Sale = ISale(saleContract);
        Sale.claimFunds(address(0xaAaAaAaaAaAaAaaAaAAAAAAAAaaaAaAaAaaAaaAa));
    }

    // should fail since not payable
    function failClaimFromAuction(address auctionContract) public {
        IAuction Auction = IAuction(auctionContract);
        Auction.claimFunds(address(0xaAaAaAaaAaAaAaaAaAAAAAAAAaaaAaAaAaaAaaAa));
    }

    function onERC1155Received(
        address,
        address,
        uint256,
        uint256,
        bytes memory
    ) public virtual returns (bytes4) {
        return this.onERC1155Received.selector;
    }
}
