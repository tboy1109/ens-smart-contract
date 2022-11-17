const hre = require("hardhat");
const namehash = require('eth-ens-namehash');
const packet = require('dns-packet');
const BigNumber = require('bignumber.js')
const crypto = require('crypto')
const Promise = require('bluebird')
const ethers = hre.ethers;
const utils = ethers.utils;
const fs = require('fs')
const labelhash = (label) => utils.keccak256(utils.toUtf8Bytes(label))
const jsonData = require('../reservation.json');
const envfile = require('envfile')
const parsedFile = envfile.parse(fs.readFileSync('./.env'))


const delay = async (ms) => new Promise(resolve => setTimeout(resolve, ms))

function web3StringToBytes32(text) {
	var result = ethers.utils.hexlify(ethers.utils.toUtf8Bytes(text));
	while (result.length < 66) { result += '0'; }
	if (result.length !== 66) { throw new Error("invalid web3 implicit bytes32"); }
	return result;
}
//1032997336489032
async function main() {
	// console.log('secret result:', web3StringToBytes32(secret))
	// console.log("parsedFile",parsedFile["FTMRegistrarController_ADDRESS"])
	// const ENSRegistry = await ethers.getContractAt("FNSRegistry","0xC000f5161A12f0a300B2c7FB6F562a6226C0DDa6")
	// const PublicResolver = await ethers.getContractAt("PublicResolver","0x6F85Dbf9607567862F8A8cC5E3406b34E2acc36a")
	// const ReverseRegistrar = await ethers.getContractAt("ReverseRegistrar","0x80daFB85B37b767bF62eDd24dd9B592d1d2Beb43")
	// const BaseRegistrar = await ethers.getContractAt("BaseRegistrarImplementation","0xE8F09aF00435BC821f86A70098a9907240fb9978")olver_ADDRESS"])
	const ETHRegistrarController = await ethers.getContractAt("FTMRegistrarController", parsedFile["FTMRegistrarController_ADDRESS"])

	let accounts = await hre.ethers.getSigners();
	/*
		const bufferprice = BigNumber('0x03ab816f4b9c48')
		console.log('registering with config:', 'retics', accounts[0].address, 31556952, '0x85eb403dcd2f3f80728eab89aef2057e9804c22d1afc964ba3321dd5e2ab5797', '0x6Bf9bceAe05B7e0751A51938229e87125748DF8F', accounts[0].address, { from: accounts[0].address, value: '1032997336489032' })
		await (await ETHRegistrarController.connect(accounts[0]).registerWithConfig('retics', accounts[0].address, 31556952, '0x85eb403dcd2f3f80728eab89aef2057e9804c22d1afc964ba3321dd5e2ab5797', '0x6Bf9bceAe05B7e0751A51938229e87125748DF8F', accounts[0].address, { from: accounts[0].address, value: '1032997336489032' })).wait()
		console.log(`Registered for (account:${tx.account}, fns:${tx.fns}.ftm)...`);
	*/
	const duration = 31556952

	const transactions_commit = [];
	const transactions_register = [];
	const resolverAddr = parsedFile["PublicResolver_ADDRESS"]
	await Promise.map(jsonData, async (tx) => {
		console.log(`Generating commit for (account:${tx.account}, fns:${tx.fns}.ftm)...`);
		const commitment = await ETHRegistrarController.makeCommitmentWithConfig(tx.fns, tx.account, web3StringToBytes32(''), resolverAddr, tx.account);
		console.log('commitment', commitment)
		await (await ETHRegistrarController.commit(commitment)).wait()
	}, { concurrency: 1 })

	// jsonData.map(async (tx)=>{
	// console.log(`Generating commit for (account:${tx.account}, fns:${tx.fns}.ftm)...`);
	// const commitment = await ETHRegistrarController.makeCommitmentWithConfig(tx.fns,tx.account,'',resolverAddr,tx.account);
	// await ETHRegistrarController.commit(commitment)
	// })
	console.log('delaying')
	// await delay(120000)
	console.log('delay ended')


	await Promise.map(jsonData, async (tx) => {
		console.log('making commitment')
		const commitment = await ETHRegistrarController.makeCommitmentWithConfig(tx.fns, tx.account, web3StringToBytes32(''), resolverAddr, tx.account);
		console.log('commitments', commitment)
		const timestamp = await ETHRegistrarController.commitments(commitment)
		if (timestamp) {
			const secret = '0x' + crypto.randomBytes(32).toString('hex');
			console.log('renting price estimating gas')
			/*
			let gasLimitHex = await ETHRegistrarController.estimateGas.rentPrice(tx.fns, duration)
			let gasLimit = gasLimitHex.toNumber()\
			, { gasLimit: 4700000 }
			*/
			console.log('renting price')
			const price = await ETHRegistrarController.rentPrice(tx.fns, duration)
			/*
			gasLimitHex = await ETHRegistrarController.estimateGas.registerWithConfig(tx.fns, tx.account, web3StringToBytes32(secret), resolverAddr, tx.account, { value: bufferprice })
			gasLimit = gasLimitHex.toNumber()
			*/
			console.log('registring with config:', secret)
			// await ETHRegistrarController.registerWithConfig(tx.fns, tx.account, web3StringToBytes32(secret), resolverAddr, tx.account, { value: bufferprice, gasLimit });
			console.log('registering with config:', tx.fns, tx.account, duration, secret, resolverAddr, tx.account, price.toString())
			// await (await ETHRegistrarController.connect(accounts[0]).registerWithConfig(tx.fns, tx.account, duration, secret, resolverAddr, tx.account, { from: accounts[0].address, value: price.toString() })).wait()
			console.log(`Registered for (account:${tx.account}, fns:${tx.fns}.ftm)...`);
		}
	}, { concurrency: 1 })

	// jsonData.map(async (tx)=>{
	// const commitment = await ETHRegistrarController.makeCommitmentWithConfig(tx.fns,tx.account,'',resolverAddr,tx.account);
	// const timestamp = await ETHRegistrarController.commitments(commitment)
	// if(timestamp){
	// const secret = '0x' + crypto.randomBytes(32).toString('hex');
	// const price = await ETHRegistrarController.getRentPrice(label, duration)
	// const bufferprice = price.mul(110).div(100)
	// const gasLimitHex = await ETHRegistrarController.estimateGas.registerWithConfig(name,owner,secret,resolverAddr,account,{ value: bufferprice})
	// const gasLimit = gasLimitHex.toNumber()
	// await ETHRegistrarController.registerWithConfig(name,owner,secret,resolverAddr,account,{ value: bufferprice, gasLimit });
	// console.log(`Registered for (account:${tx.account}, fns:${tx.fns}.ftm)...`);
	// }
	// })

};

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error);
		process.exit(1);
	});