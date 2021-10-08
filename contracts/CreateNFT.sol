// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract CreateNFT is ERC721URIStorage {

    using Counters for Counters.Counter;
    Counters.Counter private index;

    string contractURI;
    address owner;
    address operator;
    struct RoyaltyDetails {
        address creator;
        bool isExcluded;
        uint256 amount;
    }
    mapping(uint256 => RoyaltyDetails) public royaltyInfo;

    event Excluded(address indexed owner, uint256 tokenId);

    constructor (
        string memory _name, 
        string memory _symbol, 
        string memory _contractUri, 
        address _operator,
        address _owner
    ) ERC721(_name, _symbol) {
        contractURI = _contractUri;
        operator = _operator;
        owner = _owner;
    }

    function _baseURI() internal pure override returns (string memory) {
        return "https://ipfs.infura.io/ipfs/";
    }

    function mint(string memory _tokenURI, uint256 royaltyAmount) public {
        if(owner != operator) {
            require(owner == msg.sender, 'User Not Allowed');
        }
        require(royaltyAmount >= 0 && royaltyAmount <= 50, 'Royalty above threshold');

        index.increment();
        uint256 tokenId = index.current();

        super._mint(msg.sender, tokenId);
        super._setTokenURI(tokenId, _tokenURI);
        super.setApprovalForAll(operator, true);

        RoyaltyDetails storage details = royaltyInfo[tokenId];
        
        details.creator = msg.sender;
        if(royaltyAmount == 0) details.isExcluded = true;  
        else details.amount = royaltyAmount;
    }

    function setExcluded(bool value, uint256 tokenId) public {
        require(royaltyInfo[tokenId].creator == msg.sender, 'Token not yours');
        require(royaltyInfo[tokenId].amount != 0, 'Royalty not set for token');

        royaltyInfo[tokenId].isExcluded = value;

        emit Excluded(msg.sender, tokenId);
    }

    function burn(uint256 tokenId) public {
        require(super.ownerOf(tokenId) == msg.sender, 'Not authorised to burn.');

        super._burn(tokenId);
    }
}
