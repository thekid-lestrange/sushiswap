// SPDX-License-Identifier: MIT

pragma solidity 0.6.12;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";

// PolyCityHall is the coolest bar in town. You come in with some Pichi, and leave with more! The longer you stay, the more Pichi you get.
//
// This contract handles swapping to and from xPichi, PolyCityDex's staking token.
contract PolyCityHall is ERC20("PolyCityHall", "xPICHI"){
    using SafeMath for uint256;
    IERC20 public pichi;

    // Define the Pichi token contract
    constructor(IERC20 _pichi) public {
        pichi = _pichi;
    }

    // Enter the bar. Pay some PICHIs. Earn some shares.
    // Locks Pichi and mints xPichi
    function enter(uint256 _amount) public {
        // Gets the amount of Pichi locked in the contract
        uint256 totalPichi = pichi.balanceOf(address(this));
        // Gets the amount of xPichi in existence
        uint256 totalShares = totalSupply();
        // If no xPichi exists, mint it 1:1 to the amount put in
        if (totalShares == 0 || totalPichi == 0) {
            _mint(msg.sender, _amount);
        } 
        // Calculate and mint the amount of xPichi the Pichi is worth. The ratio will change overtime, as xPichi is burned/minted and Pichi deposited + gained from fees / withdrawn.
        else {
            uint256 what = _amount.mul(totalShares).div(totalPichi);
            _mint(msg.sender, what);
        }
        // Lock the Pichi in the contract
        pichi.transferFrom(msg.sender, address(this), _amount);
    }

    // Leave the bar. Claim back your PICHIs.
    // Unlocks the staked + gained Pichi and burns xPichi
    function leave(uint256 _share) public {
        // Gets the amount of xPichi in existence
        uint256 totalShares = totalSupply();
        // Calculates the amount of Pichi the xPichi is worth
        uint256 what = _share.mul(pichi.balanceOf(address(this))).div(totalShares);
        _burn(msg.sender, _share);
        pichi.transfer(msg.sender, what);
    }
}
