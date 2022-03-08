// SPDX-License-Identifier: MIT

pragma solidity 0.8.9;

import "../contracts/interfaces/IFund.sol";

contract FundMe is IFund {

    /*----------------
        Events
    ----------------*/

    event Withdrawn(uint256 amount);
    event Deposited(uint256 amount);

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
        uint256 amount = msg.value;
        addressToAmountFunded[msg.sender] += amount;
        funders.push(msg.sender);
        emit Deposited(amount);
    }

    function withdraw() public OnlyOwner {
        uint256 amount = address(this).balance;
        (bool sent, bytes memory data) = msg.sender.call{ value: amount }("");
        require(sent, "Failed to send Ether");
        emit Withdrawn(amount);
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