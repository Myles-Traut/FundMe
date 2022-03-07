// SPDX-License-Identifier: MIT
pragma solidity ^0.8.6;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/introspection/ERC165Storage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import '@openzeppelin/contracts/utils/cryptography/SignatureChecker.sol';
import '@openzeppelin/contracts/utils/cryptography/ECDSA.sol';
import "@openzeppelin/contracts/utils/Counters.sol";

import "./extensions/ERC2981.sol";
import "./interfaces/IERC4494.sol";

// already imported in SignatureChecker, here for reference
// interface IERC1271 {
//   function isValidSignature(bytes32 hash, bytes memory signature) external view returns (bytes4 magicValue);
// }

contract MockERC721 is ERC721, ERC2981, ERC165Storage, Ownable, IERC4494 {
  using Counters for Counters.Counter;

  /// @dev Value is equal to keccak256("Permit(address spender,uint256 tokenId,uint256 nonce,uint256 deadline)");
  bytes32 public constant PERMIT_TYPEHASH = 0x49ecf333e5b8c95c40fdafc95c1ad136e8914a8fb55e9dc8bb01eaa83a2df9ad;
  bytes32 internal immutable nameHash;
  bytes32 internal immutable versionHash;

  Counters.Counter private _tokenIds;
  mapping(uint256 => string) private _tokenURIs;
  mapping(uint256 => uint256) private _nonces;

  event TokenURI(uint256 indexed tokenId, string indexed tokenUri);

  constructor(string memory name, string memory symbol, string memory version) 
    ERC721(name, symbol) {
      nameHash = keccak256(bytes(name));
      versionHash = keccak256(bytes(version));
      
    ERC165Storage._registerInterface(type(IERC2981).interfaceId);
    ERC165Storage._registerInterface(type(IERC721).interfaceId);
    ERC165Storage._registerInterface(type(IERC721Metadata).interfaceId);
    ERC165Storage._registerInterface(type(IERC4494).interfaceId);
  }

  // depending on the version of mint being used, this may need to be edited
  /// @inheritdoc ERC721
  function tokenURI(uint256 tokenId) public override view returns (string memory) {
    require(_exists(tokenId), "ERC721Metadata: URI query for nonexistent token");
    return _tokenURIs[tokenId];
  }

  /// @inheritdoc ERC2981
  function getCreator(uint256 tokenId) public override view returns(address) {
    require(ERC721._exists(tokenId), "getCreator: nonexistent token");
    return ERC2981.getCreator(tokenId);
  }

  // uses an owner and global rates
  // can also use tokenID-specific rates and restrict to creator
  /// @notice Sets the global variables relating to royalties
  /// @dev made internal to allow for access control in child contract
  /// @param _rate the amount, that when adjusted with the scale, represents the royalty rate
  /// @param _scale the amount of decimal places to scale the rate when applying
  /// example: given an 18-decimal currency, a rate of 3000 with a scale of 1e5 would be 3%
  /// since this is 0.05 to an 18-decimal currency
  function setRoyaltyRate(uint256 _rate, uint256 _scale) external onlyOwner {
    _setRoyaltyRate(_rate, _scale);
  }

  function mint(address to, uint256 tokenId) public {
    _safeMint(to, tokenId);
    // if using ERC2981, uncomment
    // also might not want msg.sender
    // depending on setup, may want additional "address artist" arg
    // _creators[tokenId] = msg.sender;
  }

  function mintWithAutoTokenId(address to) public {
    _tokenIds.increment();
    uint256 tokenId = _tokenIds.current();
    _safeMint(to, tokenId);
    // if using ERC2981, uncomment
    // also might not want msg.sender
    // depending on setup, may want additional "address artist" arg
    // _creators[tokenId] = msg.sender;
  }

  function mintWithUri(address to, uint256 tokenId, string memory tokenUri) public {
    _safeMint(to, tokenId);
    _setTokenURI(tokenId, tokenUri);
    // if using ERC2981, uncomment
    // also might not want msg.sender
    // depending on setup, may want additional "address artist" arg
    // _creators[tokenId] = msg.sender;
  }

  /// @notice mints nft using internal counter for tokenId and sets URI
  /// @param to address to mint the NFT to
  /// @param tokenUri the string URI of the NFT
  function mintWithUriAutoTokenId(address to, string memory tokenUri) public {
    _tokenIds.increment();
    uint256 tokenId = _tokenIds.current();
    _safeMint(to, tokenId);
    _setTokenURI(tokenId, tokenUri);
    // if using ERC2981, uncomment
    // also might not want msg.sender
    // depending on setup, may want additional "address artist" arg
    _creators[tokenId] = msg.sender;
  }

  //TODO: Batch/Duplicate mint functions?

  function transferWithPermit(
    address from,
    address to,
    uint256 tokenId,
    uint256 deadline,
    bytes memory sig
  ) external {
    transferWithPermit(from, to, tokenId, deadline, sig, "");
  }

  function transferWithPermit(
    address from,
    address to,
    uint256 tokenId,
    uint256 deadline,
    bytes memory sig,
    bytes memory data
  ) public {
    permit(msg.sender, tokenId, deadline, sig);
    _safeTransfer(from, to, tokenId, data);
  }

  function _setTokenURI(uint256 tokenId, string memory tokenUri) internal {
    _tokenURIs[tokenId] = tokenUri;
    emit TokenURI(tokenId, tokenUri);
  }

  // permit stuff

  /// @inheritdoc IERC4494
  function nonces(uint256 tokenId) external view returns(uint256) {
    require(_exists(tokenId), 'nonces: query for nonexistent token');
    return _nonce(tokenId);
  }

  /// @inheritdoc IERC4494
  function DOMAIN_SEPARATOR() public view returns (bytes32) {
    return keccak256(
        abi.encode(
          keccak256('EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)'),
          nameHash,
          versionHash,
          block.chainid,
          address(this)
        )
      );
  }

  /// @inheritdoc IERC4494
  function permit(
        address spender,
        uint256 tokenId,
        uint256 deadline,
        bytes memory sig
    ) public override {
      require(block.timestamp <= deadline, 'Permit expired');

      bytes32 digest =
        ECDSA.toTypedDataHash(
          DOMAIN_SEPARATOR(),
          keccak256(
            abi.encode(
              PERMIT_TYPEHASH,
              spender,
              tokenId,
              _nonces[tokenId],
              deadline
            )
          )
        );

      (address recoveredAddress,) = ECDSA.tryRecover(digest, sig);
      address owner = ownerOf(tokenId);

      require(recoveredAddress != address(0), 'Invalid signature');
      require(spender != owner, 'ERC721Permit: approval to current owner');
      if(owner != recoveredAddress){
        require(
          // checks for both EIP2098 sigs and EIP1271 approvals
          SignatureChecker.isValidSignatureNow(
            owner,
            digest,
            sig
          ),
          "ERC721Permit: unauthorized"
        );
      }

      _approve(spender, tokenId);
    }

    /// @notice override for the _transfer function
    /// @dev this is needed to increment the nonce on transfer for ERC-4494
    function _transfer(address from, address to, uint256 tokenId) internal override {
      super._transfer(from, to, tokenId);
      if(from != address(0)) {
        _nonces[tokenId]++;
      }
    }

    function _nonce(uint256 tokenId) internal view returns(uint256) {
      return _nonces[tokenId];
    }

    /// @inheritdoc IERC165
    function supportsInterface(bytes4 interfaceId) 
      public 
      view 
      override(ERC165Storage, IERC165, ERC721)
      returns(bool){
      return ERC165Storage.supportsInterface(interfaceId);
    }
}