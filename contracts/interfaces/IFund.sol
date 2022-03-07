// SPDX-License-Identifier: MIT

pragma solidity >=0.8.0;

interface IFund {

    function fund()
    external
    payable;

    function withdraw()
    external
    payable;
}