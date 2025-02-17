// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract Prime is ERC20 {
    address private owner_;

    error Unauthorized();

    constructor() ERC20("Prime", "PRI") {
        owner_ = _msgSender();
    }

    function owner() public view returns (address) {
        return owner_;
    }

    function decimals() public pure override returns (uint8) {
        return 17;
    }

    function mintFor(address to, uint256 amount) external {
        require(_msgSender() == owner_, Unauthorized());

        _mint(to, amount);
    }
}
