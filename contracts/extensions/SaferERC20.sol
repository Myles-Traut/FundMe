// SPDX-License-Identifier: MIT
pragma solidity ^0.8.6;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "../interfaces/IERC20Receiver.sol";
import "../interfaces/ISaferERC20.sol";

contract SaferERC20 is ERC20, ReentrancyGuard {
  using Address for address;

  constructor(string memory _name, string memory _symbol) ERC20(_name, _symbol) {}

  /// @notice transfers tokens with an additional safety check
  /// @dev checks that receiving contract signals that they are an ERC20Receiver
  /// @custom:warning this function has a callback, make sure that it is amply secured
  /// @param to the address to transfer the tokens to
  /// @param amount the uint256 amount of tokens to transfer
  /// @return bool indicating success
  function safeTransfer(address to, uint256 amount) external returns(bool){
    return safeTransfer(to, amount, "");
  }

  /// @notice transfers tokens with an additional safety check
  /// @dev checks that receiving contract signals that they are an ERC20Receiver
  /// @custom:warning this function has a callback, make sure that it is amply secured
  /// @param to the address to transfer the tokens to
  /// @param amount the uint256 amount of tokens to transfer
  /// @param data arbitrary data field
  /// @return bool indicating success
  function safeTransfer(address to, uint256 amount, bytes memory data) public returns(bool) {
    require(_checkOnERC20Received(msg.sender, to, amount, data), "ERC20: non ERC20Receiver");
    _transfer(msg.sender, to, amount);

    return true;
  }

  /// @notice allows approved user to transfer tokens with an additional safety check
  /// @dev checks that receiving contract signals that they are an ERC20Receiver
  /// @custom:warning this function has a callback, make sure that it is amply secured
  /// @param to the address to transfer the tokens to
  /// @param amount the uint256 amount of tokens to transfer
  /// @return bool indicating success
  function safeTransferFrom(address from, address to, uint256 amount) external returns(bool){
    return safeTransferFrom(from, to, amount, "");
  }

  /// @notice allows approved user to transfer tokens with an additional safety check
  /// @dev checks that receiving contract signals that they are an ERC20Receiver
  /// @custom:warning this function has a callback, make sure that it is amply secured
  /// @param to the address to transfer the tokens to
  /// @param amount the uint256 amount of tokens to transfer
  /// @param data arbitrary data field
  /// @return bool indicating success
  function safeTransferFrom(address from, address to, uint256 amount, bytes memory data) public returns(bool){
    require(_checkOnERC20Received(from, to, amount, data), "ERC20: non ERC20Receiver");
    ERC20.transferFrom(from, to, amount);

    return true;
  }

  /// @notice if receiving contract is a contract, checks that they signal that they are an ERC20Receiver
  /// @custom:warning this function uses a callback
  /// @param from the address the tokens are being transferred from
  /// @param to the address the tokens are being transferred to
  /// @param amount the uint256 amount of tokens being transferred
  /// @param data arbitrary data field
  function _checkOnERC20Received(
    address from,
    address to,
    uint256 amount,
    bytes memory data
  ) internal nonReentrant returns(bool) {
    if(to.isContract()) {
      try IERC20Receiver(to).onERC20Received(msg.sender, from, amount, data) returns(bytes4 retval) {
        return retval == IERC20Receiver.onERC20Received.selector;
      } catch (bytes memory reason) {
        if(reason.length == 0) {
          revert("ERC20: non ERC20Receiver");
        } else {
          assembly {
            revert(add(32, reason), mload(reason))
          }
        }
      } 
    } else {
      return true;
    }
  }

  function supportsInterface(bytes4 interfaceId) public view returns(bool) {
    return interfaceId == type(IERC165).interfaceId ||
          interfaceId == type(ISaferERC20).interfaceId;
  }
}