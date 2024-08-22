const bip39 = require("bip39");
const { ethers } = require("ethers");
const fs = require("fs");
const fetch = require("node-fetch");

// Configurations
const config = {
  providers: {
    ethereum: new ethers.JsonRpcProvider("https://mainnet.infura.io/v3/959b0b5484284a1da0e141c982c56589"),
    bsc: new ethers.JsonRpcProvider("https://bsc-dataseed.binance.org/"),
    polygon: new ethers.JsonRpcProvider("https://polygon-rpc.com/"),
  },
  btcNodeUrl: "https://blockchain.info/q/addressbalance/",
  polygonApiKey: "WO26TBG8slrfEey4IqWlql63PH8DUejQ",
  bscApiKey: "3AFCMPDVEGY9P1CEWZF1GA1VETWHDABBMR",
  blockcypherApiKey: "b0c9e47f7abc4232a0aaaf12af6ad6e0",
};

// Function to dynamically import chalk
async function getChalk() {
  const { default: chalk } = await import('chalk');
  return chalk;
}

// Function to fetch balance from different blockchains
async function getBalance(address, blockchain) {
  const chalk = await getChalk();
  
  switch (blockchain) {
    case "ethereum":
    case "bsc":
    case "polygon":
      return fetchEvmBalance(address, blockchain);
    case "btc":
      return fetchBtcBalance(address);
    default:
      throw new Error("Unsupported blockchain");
  }
}

async function fetchEvmBalance(address, blockchain) {
  const provider = config.providers[blockchain];
  try {
    const balanceInWei = await provider.getBalance(address);
    return ethers.formatEther(balanceInWei);
  } catch (error) {
    const chalk = await getChalk();
    console.error(chalk.red(`Error fetching balance from ${blockchain}:`), error);
    return 0;
  }
}

async function fetchBtcBalance(address) {
  const url = `https://api.blockcypher.com/v1/btc/main/addrs/${address}/balance?token=${config.blockcypherApiKey}`;
  try {
    const response = await fetch(url);
    const data = await response.json();
    return data.balance / 1e8; // Convert from satoshis to BTC
  } catch (error) {
    const chalk = await getChalk();
    console.error(chalk.red("Error fetching Bitcoin balance:"), error);
    return 0;
  }
}

async function generateRandomSeedPhrase() {
  const chalk = await getChalk();
  const mnemonic = bip39.generateMnemonic();
  const wallet = ethers.Wallet.fromPhrase(mnemonic);
  const address = wallet.address;

  console.log(chalk.green(`Generated Seed Phrase: ${mnemonic}`));
  console.log(chalk.green(`Private Key: ${wallet.privateKey}`));
  console.log(chalk.green(`Address: ${address}`));

  const blockchains = ["ethereum", "bsc", "polygon", "btc"];
  for (const blockchain of blockchains) {
    const balance = await getBalance(address, blockchain);
    console.log(chalk.blue(`Balance on ${blockchain}: ${balance}`));
    
    if (balance > 0) {
      console.log(chalk.yellow(`Balance for Address ${address} on ${blockchain} is greater than 0`));
      saveWallet(mnemonic, balance, blockchain);
      process.exit(0);
    }
  }

  setTimeout(generateRandomSeedPhrase, 300);
}

function saveWallet(mnemonic, balance, blockchain) {
  const filePath = './wallets.json';
  let wallets = [];

  if (fs.existsSync(filePath)) {
    const data = fs.readFileSync(filePath, 'utf-8');
    wallets = JSON.parse(data);
  }

  wallets.push({
    mnemonic,
    balance,
    blockchain
  });

  fs.writeFileSync(filePath, JSON.stringify(wallets, null, 2));
  console.log(chalk.magenta(`Saved wallet with balance ${balance} on ${blockchain} to ${filePath}`));
}

generateRandomSeedPhrase();
