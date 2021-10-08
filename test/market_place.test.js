const truffleAssert = require('truffle-assertions')
const BN = require('bn.js');
const createNft = artifacts.require('CreateNFT')
let marketPlace = artifacts.require('MarketPlace')
let marketContract
let nftContract
let zeroAddress = '0x0000000000000000000000000000000000000000'
let imageURI = 'https://ipfs.infura.io/ipfs/Qme41RPVkLFB4KMSfs76cG8yZaB8Rvi25d7GquR2Ex1HJQ'
let contractName = 'cure'

contract('MarketPlace', accounts => {
    beforeEach(async() => {
        marketContract = await marketPlace.deployed();
        nftContract = await createNft.deployed();
    })

    it('creates collection on deploymeent', async() => {

        nftContractAddress =  await marketContract.mptAddress.call()

        assert.notEqual(zeroAddress, nftContractAddress)
    })

    it('collection can be created', async() => {
        nftContract =  await marketContract.createCollection(
            contractName, 'cur', imageURI, {from: accounts[0]}
        )

        await truffleAssert.eventEmitted(nftContract, 'CollectionCreated', (ev) => {
            return ev.creator == accounts[0] && ev.name == contractName && ev.contractImage == imageURI
        })
    })

    it('can create a marketplace item', async() => {
        let token = await nftContract.mint('hello', 21, {
            from: accounts[0]
        });
        
        let marketItem = await marketContract.createMarketPlaceItem(
            nftContract.address,
            Number(token.logs[0].args.tokenId.toString()),
            1000,
            'eth',
            {from: accounts[0]}
        )

        await truffleAssert.eventEmitted(marketItem, 'MarketItemCreated', (ev) => {
            return ev.contractAddress == nftContract.address && 
                ev.tokenId == Number(token.logs[0].args.tokenId.toString()) && 
                ev.price.toString() == Number(1000).toString() &&
                ev.currency == 'eth' &&
                ev.itemId.toString() == Number(1).toString()
        })
    })

    it('breaks when a non nft owner tries to create a marketplace item', async() => {
        let token = await nftContract.mint('hello', 21, {
            from: accounts[0]
        });
        
        await truffleAssert.reverts(marketContract.createMarketPlaceItem(
            nftContract.address,
            Number(token.logs[0].args.tokenId.toString()),
            1000,
            'eth',
            {from: accounts[1]}
            ), 'Not NFT owner'
        )
    })

    it('should be able to sell an NFT', async() => {
        let buyerOldBalance = new BN(await web3.eth.getBalance(accounts[1]))
        let price = new BN(web3.utils.toWei('0.000001', 'ether'))

        let token = await nftContract.mint('hello', 21, {
            from: accounts[0]
        });
        
        let marketItem = await marketContract.createMarketPlaceItem(
            nftContract.address,
            Number(token.logs[0].args.tokenId.toString()),
            price,
            'eth',
            {from: accounts[0]}
        )

        let sellerOldBalance = new BN(await web3.eth.getBalance(accounts[0]))

        let boughtItem = await marketContract.methods['buyItem(uint256)'](
            Number(marketItem.logs[0].args.itemId.toString()), 
            {'value': price, 'from': accounts[1]}
        )

        let sellerNewBalance = new BN(await web3.eth.getBalance(accounts[0]))
        let buyerNewBalance = new BN(await web3.eth.getBalance(accounts[1]))

        await truffleAssert.eventEmitted(boughtItem, 'Sold', (ev) => {
            return ev.buyer == accounts[1] && 
                ev.seller == accounts[0] && 
                ev.contractAddress == nftContract.address && 
                ev.tokenId.toString() == token.logs[0].args.tokenId.toString() &&
                ev.itemId.toString() == marketItem.logs[0].args.itemId.toString()
        })

        assert.equal(true, buyerNewBalance.lt(buyerOldBalance))
        assert.equal(true, sellerNewBalance.gt(sellerOldBalance))
        assert.equal(true, sellerNewBalance.eq(sellerOldBalance.add(price)))
    })

    it('should revert if amount is less than selling price', async() => {
        let price = new BN(web3.utils.toWei('0.000001', 'ether'))

        let token = await nftContract.mint('hello', 21, {
            from: accounts[0]
        });
        
        let marketItem = await marketContract.createMarketPlaceItem(
            nftContract.address,
            Number(token.logs[0].args.tokenId.toString()),
            price,
            'eth',
            {from: accounts[0]}
        )

        await truffleAssert.reverts(marketContract.methods['buyItem(uint256)'](
            Number(marketItem.logs[0].args.itemId.toString()), 
            {'value': web3.utils.toWei('0.00000001', 'ether'), 'from': accounts[1]}
            ), 'Insufficient fund')  
    })

    it('should revert if market item has been sold', async() => {
        let price = new BN(web3.utils.toWei('0.000001', 'ether'))

        let token = await nftContract.mint('hello', 21, {
            from: accounts[0]
        });
        
        let marketItem = await marketContract.createMarketPlaceItem(
            nftContract.address,
            Number(token.logs[0].args.tokenId.toString()),
            price,
            'eth',
            {from: accounts[0]}
        )

        await marketContract.methods['buyItem(uint256)'](
            Number(marketItem.logs[0].args.itemId.toString()), 
            {'value': price, 'from': accounts[1]}
        )

        await truffleAssert.reverts(marketContract.methods['buyItem(uint256)'](
            Number(marketItem.logs[0].args.itemId.toString()), 
            {'value': price, 'from': accounts[2]}
        ), 'NFT sold')
    })
})