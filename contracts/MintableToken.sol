//SPDX-License-Identifier: MIT
pragma solidity 0.8.4;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "./Owner.sol";

contract MintableToken is ERC20, Owner {
    constructor(
        string memory _name,
        string memory _symbol,
        address _owner
    ) ERC20(_name, _symbol) Owner(_owner) {}

    function mint(address account, uint256 amount) public virtual isOwner {
        _mint(account, amount);
    }

    function burn(address account, uint256 amount) public virtual isOwner {
        _burn(account, amount);
    }
}
