// SPDX-License-Identifier: MIT
pragma solidity 0.8.4;

contract Owner {
    address owner;

    constructor(address _owner) {
        owner = _owner;
    }

    modifier isOwner() {
        require(owner == msg.sender);
        _;
    }

    function changeOwner(address _to) public isOwner {
        owner = _to;
    }
}
