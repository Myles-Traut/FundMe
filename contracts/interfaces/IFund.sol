// SPDX-License-Identifier: MIT

pragma solidity 0.8.9;

interface IFund {

    function fundEth()
    external
    payable;

    function withdrawEth()
    external;
}