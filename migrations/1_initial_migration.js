const Migrations = artifacts.require("Migrations");
const MarketPlace = artifacts.require("MarketPlace");
const CreateNFT = artifacts.require("CreateNFT");
const Curie = artifacts.require('Curie');

module.exports = async function (deployer, network) {
  const accounts = await web3.eth.getAccounts();

  await deployer.deploy(Migrations);

  if(network == 'development') {
      const market = await deployer.deploy(MarketPlace);
      
      await deployer.deploy(
        CreateNFT, 
        'Market Place Token', 
        'MPT', 
        'https://ipfs.infura.io/ipfs/Qme41RPVkLFB4KMSfs76cG8yZaB8Rvi25d7GquR2Ex1HJQ',
        market.address,
        accounts[0]
      )

      await deployer.deploy(Curie)
  } else {
    await deployer.deploy(MarketPlace);
  }
};
