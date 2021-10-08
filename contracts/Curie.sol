// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract Curie is ERC20 {
    constructor() ERC20('curie', 'cur') {
        uint256 _totalSupply = 10000000000000000000;

        super.approve(address(this), _totalSupply);
    }
}