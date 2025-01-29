// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

interface ERC20 {
    function totalSupply() external view returns (uint256);

    function balanceOf(address owner) external view returns (uint256 balance);

    function transfer(
        address to,
        uint256 value
    ) external returns (bool success);

    function transferFrom(
        address from,
        address to,
        uint256 value
    ) external returns (bool success);

    function approve(
        address spender,
        uint256 value
    ) external returns (bool success);

    function allowance(
        address owner,
        address spender
    ) external view returns (uint256 remaining);
}

import "hardhat/console.sol";

/// @title A unuseful ERC20 contract
/// @author M374Crypto
/// @notice Fun ERC20 token emphasizing the power of Prime!
/// @dev Don't use this buddy in production
contract Prime is ERC20 {
    string public symbol;
    string public name;
    uint8 public decimal;

    constructor() {
        owner = msg.sender;

        symbol = "PRI";
        name = "Prime";
        //        Prime!
        //        vv
        decimal = 17;

        //                       Prime!
        //             Prime!    vvvvvvvvvvvvvvvvvvvvvv
        //             vvvvvvvvv|
        _totalSupply = 1_000_003_100_000_000_020_653_83;

        _balances[owner] = _totalSupply;
        emit Transfer(address(0), owner, _totalSupply);

        console.log("Optimus Prime!");
    }

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(
        address indexed owner,
        address indexed spender,
        uint256 value
    );

    error NotEnoughToken();

    function totalSupply() public view override returns (uint256) {
        return _totalSupply;
    }

    function balanceOf(
        address _owner
    ) public view override returns (uint256 balance) {
        return _balances[_owner];
    }

    function transfer(
        address to,
        uint256 value
    ) public override returns (bool success) {
        if (_balances[msg.sender] < value) revert NotEnoughToken();

        _balances[msg.sender] -= value;
        _balances[to] += value;
        emit Transfer(msg.sender, to, value);

        return true;
    }

    function transferFrom(
        address from,
        address to,
        uint256 value
    ) public override returns (bool success) {
        if (_allowances[from][msg.sender] < value) return false;

        _balances[from] -= value;
        _allowances[from][msg.sender] -= value;
        _balances[to] += value;

        emit Transfer(from, to, value);

        return true;
    }

    function approve(
        address spender,
        uint256 value
    ) public override returns (bool success) {
        if (_balances[msg.sender] < value) return false;

        _allowances[msg.sender][spender] = value;

        return true;
    }

    function allowance(
        address _owner,
        address spender
    ) public view override returns (uint256 remaining) {
        return _allowances[_owner][spender];
    }

    address public owner;
    uint256 private _totalSupply;

    mapping(address owner => uint256 amount) private _balances;
    mapping(address owner => mapping(address spender => uint256 amount))
        private _allowances;

    function hof(
        function(uint256) internal returns (uint256) f,
        uint256 a
    ) internal returns (uint256) {
        return f(a);
    }
}
