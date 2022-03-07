// SPDX-License-Identifier: MIT
pragma solidity ^0.8.6;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/utils/introspection/ERC165Storage.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "./extensions/ERC2981.sol";

contract MockERC1155 is ERC1155, ERC2981, ERC165Storage {
  using Counters for Counters.Counter;

  Counters.Counter private _ids;
  mapping (uint256 => string) private _uris;

  constructor() ERC1155("") {
    ERC165Storage._registerInterface(type(IERC2981).interfaceId);
    ERC165Storage._registerInterface(type(IERC1155).interfaceId);
    ERC165Storage._registerInterface(type(IERC1155MetadataURI).interfaceId);
  }

  // only use if not using default 1155 uri scheme
  /// @dev Returns the URI for token type `id`.
  function uri(uint256 id) public view override returns(string memory) {
    return _uris[id];
  }

  // /// @inheritdoc IERC1155MetadataURI
  // function uri(uint256 id) public view override returns(string memory) {
  //   return bytes(_uri).length > 0
  //           ? string(abi.encodePacked(_uri, "/", tokenUris[id]))
  //           : tokenUris[id];
  // }

  // for use with EIP2981, delete if not using
  /// @notice Sets the global variables relating to royalties
  /// @dev made internal to allow for access control in child contract
  /// @param _rate the amount, that when adjusted with the scale, represents the royalty rate
  /// @param _scale the amount of decimal places to scale the rate when applying
  /// example: given an 18-decimal currency, a rate of 3000 with a scale of 1e5 would be 3%
  /// since this is 0.05 to an 18-decimal currency
  function setRoyaltyRate(uint256 _rate, uint256 _scale) external {
    _setRoyaltyRate(_rate, _scale);
  }

  function mint(address to, uint256 id, uint256 amount) public {
    _mint(to, id, amount, "");
  }

  function mintBatch(address[] memory to, uint256[] memory ids, uint256[] memory amounts) public {
    require(to.length == ids.length &&
      ids.length == amounts.length,
      "mint:array length mismatch"
    );
    for (uint256 i = 0; i < to.length; i++) {
      _mint(to[i], ids[i], amounts[i], "");
    }
  }

  function mintWithAutoTokenId(address to, uint256 amount) public {
    _ids.increment();
    uint256 id = _ids.current();
    _mint(to, id, amount, "");
  }

  function mintBatchWithAutoid(address[] memory to, uint256[] memory amounts) public {
    // would it be more gas efficient to use _mintBatch by populating a memory array with
    // ids in a for loop?
    for (uint256 i = 0; i < to.length; i++) {
      _ids.increment();
      uint256 id = _ids.current();
      _mint(to[i], id, amounts[i], "");
    }
  }

  function mintWithUri(address to, uint256 id, uint256 amount, string memory tokenUri) public {
    _mint(to, id, amount, "");
    _setTokenURI(id, tokenUri);
  }

  function mintBatchWithUri(
    address[] memory to, 
    uint256[] memory ids, 
    uint256[] memory amounts, 
    string[] memory uris
  ) public {
    require(to.length == ids.length &&
      ids.length == amounts.length &&
      amounts.length == uris.length,
      "mint:array length mismatch"
    );
    for (uint256 i = 0; i < to.length; i++) {
      _mint(to[i], ids[i], amounts[i], "");
      _setTokenURI(ids[i], uris[i]);
    }
  }

  /// @notice mints a single NFT id using internal counter for id and sets URI
  /// @param to address to mint the NFT to
  /// @param amount the amount of the NFT to mint
  /// @param _uri the string URI of the NFT
  function mintWithUriAutoTokenId(address to, uint256 amount, string memory _uri) public {
    _ids.increment();
    uint256 id = _ids.current();
    _mint(to, id, amount, "");
    // next line is for EIP2981, take out if not using
    _creators[id] = msg.sender;
    _setTokenURI(id, _uri);
  }

  /// @notice mints multiple consecutive NFT ids using an internal counter and sets URI for each
  /// @dev all NFTs must be sent to the same address
  /// @param to the address to send the NFTs to
  /// @param amounts an array of amounts to mint of each NFT
  /// @param uris an array of the URI strings for each NFT
  function mintBatchWithAutoTokenIdAndUri(
    address to, 
    uint256[] memory amounts, 
    string[] memory uris
  ) public {
    require(amounts.length == uris.length, "arrays must have equal length");
    uint256[] memory ids = new uint256[](amounts.length);
    for (uint256 i = 0; i < amounts.length; i++) {
      _ids.increment();
      uint256 id = _ids.current();
      ids[i] = id;
    }
    _mintBatch(to, ids, amounts, "");
    for (uint256 i = 0; i < amounts.length; i++) {
      // next line is for EIP2981, take out if not using
    _creators[ids[i]] = msg.sender;
      _setTokenURI(ids[i], uris[i]);
    }
  }

  function _setTokenURI(uint256 id, string memory tokenUri) internal {
    _uris[id] = tokenUri;
    emit URI(tokenUri, id);
  }

  /// @inheritdoc IERC165
  function supportsInterface(bytes4 interfaceId) 
    public 
    view 
    override(ERC165Storage, IERC165, ERC1155)
    returns(bool)
  {
    return ERC165Storage.supportsInterface(interfaceId);
  }
}