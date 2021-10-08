// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./CreateNFT.sol";

interface ICreateNFT {
    function royaltyInfo(uint256 tokenId) external view returns (address creator, bool isExcluded, uint256 amount);
    
    function approve(address to, uint256 tokenId) external;
    
    function safeTransferFrom(address from, address to, uint256 tokenId) external;
    
    function setApprovalForAll(address operator, bool approved) external;

    function ownerOf(uint256 tokenId) external view returns (address);
}

contract MarketPlace {
    CreateNFT nft;
    
    address public owner;
    address public mptAddress;
    struct MarketItemData {
        bool isSold;
        address contractAddress;
        uint256 price;
        uint256 tokenId;
        string currency;
        uint8 royalty;
        address seller;
        address buyer;
        uint256 itemId;
    }
    mapping(uint256 => MarketItemData) public marketItems;
    mapping(string => address) public currencies;
    
    struct RoyaltyDetails {
        address creator;
        bool isExcluded;
        uint256 amount;
    }

    using Counters for Counters.Counter;
    Counters.Counter private index;
    
    event CollectionCreated(
        address indexed creator, 
        string name, 
        address indexed nftAddress, 
        string contractImage
    );

    event MarketItemCreated(
        address indexed contractAddress, 
        uint256 tokenId, 
        uint256 price, 
        string currency,
        uint256 itemId
    );
    
    event CurrencySet(string symbol, address indexed contractAddress);
    event Sold(
        string symbol, 
        address indexed buyer, 
        address indexed seller, 
        uint256 itemId, 
        address indexed contractAddress, 
        uint256 tokenId
    );
    
    constructor ( ) {
        nft = new CreateNFT(
            'Market Place Token', 
            'MPT', 
            'https://ipfs.infura.io/ipfs/Qme41RPVkLFB4KMSfs76cG8yZaB8Rvi25d7GquR2Ex1HJQ',
            address(this),
            address(this)
        );

        mptAddress = address(nft);

        emit CollectionCreated(
            address(this),
            'Market Place Token', 
            mptAddress,
            'https://ipfs.infura.io/ipfs/Qme41RPVkLFB4KMSfs76cG8yZaB8Rvi25d7GquR2Ex1HJQ'
        );
        
        owner = msg.sender;
    }

    function createCollection (
        string memory name, 
        string memory symbol, 
        string memory contractImageUrl
    ) public {
        nft = new CreateNFT(
            name, 
            symbol, 
            contractImageUrl,
            address(this),
            msg.sender
        );

        emit CollectionCreated(msg.sender, name, address(nft), contractImageUrl);
    }

    function createMarketPlaceItem(
        address contractAddress, 
        uint256 tokenId, 
        uint256 price, 
        string memory currency
    ) public {
        index.increment();
        uint256 itemId = index.current();

        ICreateNFT iCreateNFT = ICreateNFT(contractAddress);
        address tokenOwner = iCreateNFT.ownerOf(tokenId);
        
        require(tokenOwner == msg.sender, 'Not NFT owner');
        
        MarketItemData storage marketItemData = marketItems[itemId];
        
        marketItemData.contractAddress = contractAddress;
        marketItemData.price = price;
        marketItemData.tokenId = tokenId;
        marketItemData.currency = currency;
        marketItemData.seller = msg.sender;
        marketItemData.itemId = itemId;
        
        emit MarketItemCreated(contractAddress, tokenId, price, currency, itemId);
    }

    function buyItem(uint256 _itemId) public payable {
        MarketItemData storage marketItem = marketItems[_itemId];

        require(marketItem.isSold == false, 'NFT sold');
        require(msg.value >= marketItem.price, 'Insufficient fund');

        ICreateNFT iCreateNFT = ICreateNFT(marketItem.contractAddress);
        (address creator, bool isExcluded, uint256 amount) = iCreateNFT.royaltyInfo(marketItem.tokenId);
        
        if(creator != marketItem.seller) {
            if(!isExcluded) {
                uint256 royaltyFee = (marketItem.price * amount) / 100;
                payable(creator).transfer(royaltyFee);
                payable(marketItem.seller).transfer(marketItem.price - royaltyFee);    
            } else {
                payable(marketItem.seller).transfer(marketItem.price);                    
            }
        } else {
            payable(marketItem.seller).transfer(marketItem.price);
        }
        
        iCreateNFT.safeTransferFrom(
            marketItem.seller,
            msg.sender,
            marketItem.tokenId
        );
        
        marketItem.buyer = msg.sender;
        marketItem.isSold = true;
        
        emit Sold(
            marketItem.currency, 
            marketItem.buyer, 
            marketItem.seller, 
            marketItem.itemId, 
            marketItem.contractAddress, 
            marketItem.tokenId
        );
    }
    
    function buyItem(uint256 _itemId, uint256 _amount) public {
        MarketItemData storage marketItem = marketItems[_itemId];

        require(marketItem.isSold == false, 'NFT sold');
        require(marketItem.price <= _amount, 'Insufficient fund');

        ICreateNFT iCreateNFT = ICreateNFT(marketItem.contractAddress);
        (address creator, bool isExcluded, uint256 royaltyAmount) = iCreateNFT.royaltyInfo(marketItem.tokenId);
        
        if(creator != marketItem.seller) {
            if(!isExcluded) {
                uint256 royaltyFee = (marketItem.price * royaltyAmount) / 100;
                IERC20(currencies[marketItem.currency]).transferFrom(msg.sender, creator, royaltyFee);
                IERC20(currencies[marketItem.currency]).transferFrom(msg.sender, marketItem.seller, marketItem.price - royaltyFee);
            } else {
                IERC20(currencies[marketItem.currency]).transferFrom(msg.sender, marketItem.seller, marketItem.price);
            }
        } else {
            IERC20(currencies[marketItem.currency]).transferFrom(msg.sender, marketItem.seller, marketItem.price);
        }
        
        iCreateNFT.safeTransferFrom(
            marketItem.seller,
            msg.sender,
            marketItem.tokenId
        );
        
        marketItem.buyer = msg.sender;
        marketItem.isSold = true;
        
        emit Sold(
            marketItem.currency, 
            marketItem.buyer, 
            marketItem.seller, 
            marketItem.itemId, 
            marketItem.contractAddress, 
            marketItem.tokenId
        );
    }
    
    function setCurrency(string memory _symbol, address _contractAddress) public {
        require(owner == msg.sender, 'Only owner allowed.');
        
        currencies[_symbol] = _contractAddress;
        
        emit CurrencySet(_symbol, _contractAddress);
    }
}
