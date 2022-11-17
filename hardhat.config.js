require("@nomiclabs/hardhat-truffle5");
require("@nomiclabs/hardhat-waffle");
require("hardhat-abi-exporter");
require("@nomiclabs/hardhat-solhint");
require("hardhat-gas-reporter");
require("hardhat-deploy");
require("hardhat-deploy-ethers");

// Load environment variables from .env file. Suppress warnings using silent
// if this file is missing. dotenv will never modify any environment variables
// that have already been set.
// https://github.com/motdotla/dotenv
require('dotenv').config({ silent: true });

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async () => {
  const accounts = await ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

real_accounts = undefined;
if (process.env.DEPLOYER_KEY && process.env.OWNER_KEY) {
  real_accounts = [process.env.DEPLOYER_KEY, process.env.OWNER_KEY];
}

console.log('accounts:', real_accounts)

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {

  networks: {
    hardhat: {
      // Required for real DNS record tests
      initialDate: "2019-03-15T14:06:45.000+13:00",
      saveDeployments: true,
      tags: ["test", "legacy", "use_root"],
    },
    localhost: {
      url: "http://127.0.0.1:9545",
      saveDeployments: false,
      tags: ["test", "legacy", "use_root"],
    },
    ropsten: {
      url: `https://ropsten.infura.io/v3/${process.env.INFURA_ID}`,
      tags: ["test", "legacy", "use_root"],
      chainId: 3,
      accounts: real_accounts,
      gas: 2100000,
      gasPrice: 8000000000
    },
    rinkeby: {
      url: `https://rinkeby.infura.io/v3/${process.env.INFURA_ID}`,
      tags: ["test", "legacy", "use_root"],
      chainId: 4,
      accounts: real_accounts,
      gas: 2100000,
      gasPrice: 8000000000
    },
    mainnet: {
      url: `https://mainnet.infura.io/v3/${process.env.INFURA_ID}`,
      tags: ["legacy", "use_root"],
      chainId: 1,
      accounts: real_accounts,
    },
    ftmtest: {
      url: `https://rpc.testnet.fantom.network/`,
      tags: ["test", "legacy", "use_root"],
      chainId: 4002,
      saveDeployments: true,
      accounts: real_accounts,
      gas: 2100000,
      gasPrice: 80000000000
    },
    fantom: {
      url: `https://rpc.ftm.tools`,
      chainId: 250,
      saveDeployments: true,
      accounts: ['f1dd42d23a1e6875cf3b2ab2a18dd928d39a468b30678df7ac4be4abd0355a25'],
      gas: 3000000,
      gasPrice: 250000000000
    }
  },
  mocha: {
  },
  abiExporter: {
    path: './build/contracts',
    clear: true,
    flat: true,
    spacing: 2
  },
  solidity: {
    compilers: [
      {
        version: "0.8.4",
        settings: {
          optimizer: {
            enabled: true,
            runs: 10000,
          }
        }
      }
    ]
  },
  namedAccounts: {
    deployer: {
      default: 0,
    },
    owner: {
      default: 1,
    },
  },
};

