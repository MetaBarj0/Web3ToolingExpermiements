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

contract Prime is ERC20 {
    string public symbol;
    string public name;
    uint8 public decimal;

    constructor() {
        _creator = msg.sender;

        symbol = "PRI";
        name = "Prime";
        //        Prime!
        //        vv
        decimal = 17;

        //                       Prime!
        //             Prime!    vvvvvvvvvvvvvvvvvvvvvv
        //             vvvvvvvvv|
        _totalSupply = 1_000_003_100_000_000_020_653_83;

        _balances[_creator] = _totalSupply;
        emit Transfer(address(0), _creator, _totalSupply);
    }

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(
        address indexed owner,
        address indexed spender,
        uint256 value
    );

    function totalSupply() public view override returns (uint256) {
        return _totalSupply;
    }

    function balanceOf(
        address owner
    ) public view override returns (uint256 balance) {
        return _balances[owner];
    }

    function transfer(
        address to,
        uint256 value
    ) public override returns (bool success) {
        if (_balances[msg.sender] < value) return false;

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
        address owner,
        address spender
    ) public view override returns (uint256 remaining) {
        return _allowances[owner][spender];
    }

    address private _creator;
    uint256 private _totalSupply;

    mapping(address owner => uint256 amount) private _balances;
    mapping(address owner => mapping(address spender => uint256 amount))
        private _allowances;
}
