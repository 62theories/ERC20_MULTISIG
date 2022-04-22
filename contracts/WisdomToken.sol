//SPDX-License-Identifier: MIT
pragma solidity 0.8.4;

import "./MintableToken.sol";

contract WisdomToken is MintableToken {
    constructor(
        string memory _name,
        string memory _symbol,
        address _owner
    ) MintableToken(_name, _symbol, _owner) {}
}
