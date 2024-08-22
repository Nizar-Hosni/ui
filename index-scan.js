const bip39 = require("bip39");
const ethers = require("ethers");
const fetch = require("node-fetch"); // Ensure you have node-fetch installed

const apiKey = "5YWAIQ2QAII1U19HNV5PADU53IX3SVIAKI"; // Replace with your Etherscan API key

async function getBalance(address) {
  const url = `https://api.etherscan.io/api?module=account&action=balance&address=${address}&tag=latest&apikey=${apiKey}`;
  
  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.status === "1") {
      const balanceInWei = data.result;
      const balanceInEther = parseFloat(balanceInWei) / 10 ** 18;
      return balanceInEther;
    } else {
      console.error(`Error: ${data.message}`);
      return 0;
    }
  } catch (error) {
    console.error("Error fetching data:", error);
    return 0;
  }
}

async function generateRandomSeedPhrase() {
  // Generate a random seed phrase
  const mnemonic = bip39.generateMnemonic();
  const wallet = ethers.Wallet.fromPhrase(mnemonic);

  // Generate the private key and address from the seed phrase
  const privateKey = wallet.privateKey;
  const address = wallet.address;

  console.log(`Generated Seed Phrase: ${mnemonic}`);
  console.log(`Private Key: ${privateKey}`);
  console.log(`Address: ${address}`);

  // Fetch ETH balance for the generated address
  const balanceInEther = await getBalance(address);
  console.log(`Ether Balance: ${balanceInEther} ETH`);

  if (balanceInEther > 0) {
    console.log("Balance is greater than 0");

    // Stop the script if balance is greater than 0
    process.exit(0);
  }

  return mnemonic;
}

function executeWithCooldown() {
  generateRandomSeedPhrase();
  setTimeout(executeWithCooldown, 300);
}

executeWithCooldown();
