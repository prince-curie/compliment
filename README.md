# NFT MARKETPLACE

 An Ethereum smart contract written in solidity for buying and selling NFTs. It allows the user to deploy their personal NFT smart contract with royalty percentage enabled per NFT token minted. The marketplace smart contract allows for payments to be made using ERC 20 tokens or Ether. Integration with a backend using Node.js and frontend using React coming soon.

## Installation
### Install locally on your machine
- Ensure you have installed on your machine:
  - Ganache
  - Truffle
  - Node.js

#### Clone this repo

```git
$ git clone https://github.com/prince-curie/compliment.git
$ cd compliment
```

#### Install dependencies

```node
$ npm install
```

#### Compile the Smart Contract

```bash
$ truffle compile
```

#### Deploy Smart Contract to Local Network
  - Start running ganache
  - Create a workspace
  - Add the project to the workspace
  - Ensure ganache port is set to 8545 abd set it if not
  - Run the command `truffle migrate` on the terminal

## Test
- To run test
```bash
$ truffle test 
```

