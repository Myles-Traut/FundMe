// SPDX-License-Identifier: MIT

pragma solidity 0.8.9;

import "../contracts/interfaces/IFund.sol";

contract FundMe is IFund {

    /*----------------
        Events
    ----------------*/

    event Withdrawn();
    event Deposited();

    /*----------------
        Storage
    ----------------*/

    address public owner;
    mapping(address => uint256) public addressToAmountFunded;
    address [] public funders;
    uint256 public minAmount = 0.004 ether;

    constructor(){
        owner = msg.sender;
    }
    /*-----------------------------
        State Changing Functions
    -------------------------------*/

    // minimum donation is $0.004 ether. Roughly 10 dollars
    function fund() public payable {
        require(msg.value >= minAmount, "Please fund more eth");
        addressToAmountFunded[msg.sender] += msg.value;
        funders.push(msg.sender);
        emit Deposited();
    }

    function withdraw() public OnlyOwner {
        payable(msg.sender).transfer(address(this).balance);
        emit Withdrawn();
    }

    /*----------------------
        View Functions
    ----------------------*/
    
    // Returns total amount of donations in the fund.
    function viewFundsAvailable() public view returns(uint256) {
        return address(this).balance;
    }

    function viewAmountDonatedByFunder(address funder) public view returns(uint256) {
        return addressToAmountFunded[funder];
    }

    /*--------------------
        Modifiers
    --------------------*/

    modifier OnlyOwner {
        require(msg.sender == owner, "Unauthorised");
        _;
    }
}