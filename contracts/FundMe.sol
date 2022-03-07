// SPDX-License-Identifier: MIT

pragma solidity >=0.8.0;

import "../contracts/interfaces/IFund.sol";

contract FundMe is IFund {

    // Storage
    address immutable public owner = msg.sender;
    mapping(address => uint256) public addressToAmountFunded;
    address [] public funders;

    /*-----------------------------
        State Changing FUnctions
    -------------------------------*/

    // minimum donation is $0.004 ether. Roughly 10 dollars
    function fund() override public payable {
        uint256 minAmount = 0.004 ether;
        require(msg.value >= minAmount, "Please fund more eth");
        addressToAmountFunded[msg.sender] = msg.value;
        funders.push(msg.sender);
    }

    function withdraw() override public payable {
        _withdraw();
    }
    
    /*----------------------
        Internal Functions
    ----------------------*/

    function _withdraw() internal {
        require(msg.sender == owner, "Unauthorised");
        payable(msg.sender).transfer(address(this).balance);
    }

    /*----------------------
        View Functions
    ----------------------*/
    
    // Returns total amount of donations in the fund.
    function viewFundsAvailable() public view returns(uint256) {
        uint256 totalAmount;        
        
        for (uint256 i = 0; i < funders.length; i++){
            totalAmount += addressToAmountFunded[funders[i]];
        }

        return totalAmount;
    }
}