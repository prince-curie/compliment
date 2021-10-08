const truffleAssert = require('truffle-assertions')
const createNft = artifacts.require('CreateNFT')
let marketPlace = artifacts.require('MarketPlace')
let marketContract
let nftContract

contract('CreateNFT', accounts => {
    beforeEach(async() => {
        marketContract =  await marketPlace.deployed();
        
        nftContract = await createNft.deployed();
    })

    it('should mint', async() => {
        let transaction = await nftContract.mint('hello', 21, {
            from: accounts[0]
        });

        let tokenOwner = await nftContract.ownerOf.call(Number(transaction.logs[0].args.tokenId.toString()))
        
        truffleAssert.eventEmitted(transaction, 'Transfer',(ev) => { 
            return ev.to === accounts[0] && ev.tokenId.toString() === Number(1).toString() 
        });
        truffleAssert.eventEmitted(transaction, 'ApprovalForAll', (ev) => { 
            return ev.owner === accounts[0] && ev.operator === marketContract.address &&
            ev.approved === true 
        });

        assert.equal(accounts[0], tokenOwner);
    })

    it('should set tokenURI with hardcoded base URI', async() => {
        let baseURI = "https://ipfs.infura.io/ipfs/";

        let {logs} = await nftContract.mint('hello', 21, {
            from: accounts[0]
        });

        let tokenURI = await nftContract.tokenURI.call(Number(logs[0].args.tokenId.toString()))

        assert.equal(baseURI, tokenURI.substring(0, baseURI.length))
    })

    it('sets royalty while minting', async() => {
        let royaltyAmount = 21
        let isExcluded = royaltyAmount === 0 ? true : false;
        let transaction = await nftContract.mint('hello', royaltyAmount, {
            from: accounts[0]
        });

        let royalty = await nftContract.royaltyInfo.call(Number(transaction.logs[0].args.tokenId.toString()))
        
        assert.equal(accounts[0], royalty.creator)
        assert.equal(isExcluded, royalty.isExcluded)
        assert.equal(Number(royaltyAmount).toString(), royalty.amount.toString())
    })

    it('should return error for royalty above threshold', async() => {
        await truffleAssert.fails(nftContract.mint('hello', 51, {
            from: accounts[0]
        }), truffleAssert.ErrorType.REVERT, 'Royalty above threshold');
    })

    it('should return error if neither operator nor owner tries to mint token', async() => {
        await truffleAssert.fails(nftContract.mint('hello', 51, {
            from: accounts[1]
        }), truffleAssert.ErrorType.REVERT, 'User Not Allowed');
    })

    it('should exclude token from royalty', async() => {
        let {logs} = await nftContract.mint('hello', 21, {
            from: accounts[0]
        });

        let exclude = await nftContract.setExcluded(true, Number(logs[0].args.tokenId.toString()), {
            from: accounts[0]
        })
        let royalty = await nftContract.royaltyInfo.call(Number(logs[0].args.tokenId.toString()))
        
        await truffleAssert.eventEmitted(exclude, 'Excluded', (ev) => { 
            return ev.owner === accounts[0] && ev.tokenId.toString() === Number(logs[0].args.tokenId).toString()
        });
        assert.equal(true, royalty.isExcluded)
    })

    it('should stop non token owner from excluding token from royalty', async() => {
        let {logs} = await nftContract.mint('hello', 21, {
            from: accounts[0]
        });

        await truffleAssert.reverts(nftContract.setExcluded(true, Number(logs[0].args.tokenId.toString()), {
            from: accounts[1]
            }), 'Token not yours'
        )
    })

    it('should stop royalty exclusion if royalty not set', async() => {
        let {logs} = await nftContract.mint('hello', 0, {
            from: accounts[0]
        });

        await truffleAssert.reverts(nftContract.setExcluded(true, Number(logs[0].args.tokenId.toString()), {
            from: accounts[0]
            }), 'Royalty not set for token'
        )
    })

    it('should revert if you try to burn a token not yours', async() => {
        let {logs} = await nftContract.mint('hello', 0, {
            from: accounts[0]
        });

        await truffleAssert.reverts(nftContract.burn(Number(logs[0].args.tokenId.toString()), {
            from: accounts[1]
            }), 'Not authorised to burn.'
        )
    })

    it('should burn a token', async() => {
        let {logs} = await nftContract.mint('hello', 10, {
            from: accounts[0]
        });

        let burn = await nftContract.burn(Number(logs[0].args.tokenId.toString()));

        await truffleAssert.reverts(
            nftContract.ownerOf.call(Number(logs[0].args.tokenId.toString())), 
            'ERC721: owner query for nonexistent token'
        )
        await truffleAssert.eventEmitted(burn, 'Transfer');
    })
})