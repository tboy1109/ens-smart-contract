const hre = require("hardhat");
const namehash = require('eth-ens-namehash');
const packet = require('dns-packet');
const jsonData = require('../reservation.json');
const crypto = require('crypto')
const ethers = hre.ethers;
const utils = ethers.utils;
const labelhash = (label) => utils.keccak256(utils.toUtf8Bytes(label))
const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
const ZERO_HASH = "0x0000000000000000000000000000000000000000000000000000000000000000";

const delay = async (ms) => new Promise(resolve => setTimeout(resolve, ms))

async function main() {
  console.log('Deploy Start')
  const ENSRegistry = await ethers.getContractFactory("FNSRegistry")
  const FIFSRegistrar = await ethers.getContractFactory("FIFSRegistrar")
  const ReverseRegistrar = await ethers.getContractFactory("ReverseRegistrar")
  const HashRegistrar = await ethers.getContractFactory("HashRegistrar")
  const BaseRegistrar = await ethers.getContractFactory("BaseRegistrarImplementation")
  const OwnedResolver = await ethers.getContractFactory("OwnedResolver")
  const PublicResolver = await ethers.getContractFactory("PublicResolver")
  const PriceOracle = await ethers.getContractFactory("StablePriceOracle")
  const ETHRegistrarController = await ethers.getContractFactory("FTMRegistrarController")
  const BulkRenewal = await ethers.getContractFactory("BulkRenewal")
  const NameWrapper = await ethers.getContractFactory("NameWrapper")
  const StaticMetadataService = await ethers.getContractFactory("StaticMetadataService")

  const signers = await ethers.getSigners();
  const accounts = signers.map(s => s.address)

  //console.log('ftm_namehash',namehash.hash("ftm"))	

  //ENS - Core
  const ens = await ENSRegistry.deploy();
  await ens.deployed()
  console.log(`address FNSRegistry (tx:${ens.address})...`);

  const resolver = await OwnedResolver.deploy();
  await resolver.deployed()
  console.log(`address OwnedResolver (tx:${resolver.address})...`);

  //Permanent Registrar
  const baseregistrar = await BaseRegistrar.deploy(ens.address, namehash.hash("ftm"));
  await baseregistrar.deployed()
  console.log(`address BaseRegistrar (tx:${baseregistrar.address})...`);

  await ens.setSubnodeRecord(ZERO_HASH, labelhash("ftm"), baseregistrar.address, resolver.address, 0);

  //set Metadata
  const metadataHost = 'metadata.fantomdomains.io'
  const metadataUrl = `https://${metadataHost}/name/0x{id}`

  const metadata = await StaticMetadataService.deploy(metadataUrl)
  await metadata.deployed()
  console.log("Metadata address:", metadata.address)

  const wrapper = await NameWrapper.deploy(ens.address, baseregistrar.address, metadata.address)
  await wrapper.deployed()
  console.log("Wrapper address:", wrapper.address)

  //Public Resolver

  const publicresolver = await PublicResolver.deploy(ens.address, wrapper.address); // ZERO_ADDRESS);
  await publicresolver.deployed()
  console.log(`address PublicResolver (tx:${publicresolver.address})...`);

  //Controller
  const priceoracle = await PriceOracle.deploy("0x8A753747A1Fa494EC906cE90E9f37563A8AF630e", ["100000000000000", "10000000000000", "1000000000000", "100000000000"]);
  await priceoracle.deployed()
  console.log(`address oracle (tx:${priceoracle.address})...`);


  const ethregistrarcontroller = await ETHRegistrarController.deploy(baseregistrar.address, priceoracle.address, 60, 604800);
  await ethregistrarcontroller.deployed()
  console.log(`address FTMRegistrarController (tx:${ethregistrarcontroller.address})...`);

  await baseregistrar.addController(ethregistrarcontroller.address);
  console.log(`address BaseRegistrar (set controller..`);

  const bulkrenewal = await BulkRenewal.deploy(ens.address);
  await bulkrenewal.deployed()
  console.log(`address BulkRenewal (tx:${bulkrenewal.address})...`);

  const hashregisgrar = await HashRegistrar.deploy(ens.address, namehash.hash("ftm"), 0);
  await hashregisgrar.deployed()
  console.log(`address HashRegistrar (tx:${hashregisgrar.address})...`);

  await resolver.setInterface(namehash.hash("ftm"), '0x6ccb2df4', baseregistrar.address);
  await resolver.setInterface(namehash.hash("ftm"), '0x018fac06', ethregistrarcontroller.address);
  await resolver.setInterface(namehash.hash("ftm"), '0x3150bfba', bulkrenewal.address);
  await resolver.setInterface(namehash.hash("ftm"), '0x7ba18ba1', hashregisgrar.address);
  console.log(`Fixing interface...`);

  await setupPublicResolver(ens, publicresolver, accounts);

  const fifsregistrar = await FIFSRegistrar.deploy(ens.address, namehash.hash("test"));
  await fifsregistrar.deployed()
  console.log(`address FIFSRegistrar(TEST) (tx:${fifsregistrar.address})...`);
  await setupRegistrar(ens, fifsregistrar);

  //const reverseRegistrar = await ReverseRegistrar.deploy(ens.address, resolver.address);
  const reverseRegistrar = await ReverseRegistrar.deploy(ens.address, publicresolver.address);
  await reverseRegistrar.deployed()
  console.log(`address ReverseRegistrar (tx:${reverseRegistrar.address})...`);
  await setupReverseRegistrar(ens, reverseRegistrar, accounts);

  //set approve for metadata
  await (await baseregistrar.setApprovalForAll(wrapper.address, true)).wait()
  await (await ens.setApprovalForAll(wrapper.address, true)).wait()

  //dns-set

  const RSASHA1Algorithm = await ethers.getContractFactory("RSASHA1Algorithm")
  const RSASHA256Algorithm = await ethers.getContractFactory("RSASHA256Algorithm")
  const P256SHA256Algorithm = await ethers.getContractFactory("P256SHA256Algorithm")
  const SHA1Digest = await ethers.getContractFactory("SHA1Digest")
  const SHA256Digest = await ethers.getContractFactory("SHA256Digest")
  const SHA1NSEC3Digest = await ethers.getContractFactory("SHA1NSEC3Digest")
  const DNSSECImpl = await ethers.getContractFactory("DNSSECImpl")
  const TLDPublicSuffixList = await ethers.getContractFactory("TLDPublicSuffixList")
  const DNSRegistrar = await ethers.getContractFactory("DNSRegistrar")

  const rsasha1algorithm = await RSASHA1Algorithm.deploy();
  await rsasha1algorithm.deployed()
  console.log(`address RSASHA1Algorithm (tx:${rsasha1algorithm.address})...`);
  const rsasha256algorithm = await RSASHA256Algorithm.deploy();
  await rsasha256algorithm.deployed()
  console.log(`address RSASHA256Algorithm (tx:${rsasha256algorithm.address})...`);
  const p256sha256algorithm = await P256SHA256Algorithm.deploy();
  await p256sha256algorithm.deployed()
  console.log(`address P256SHA256Algorithm (tx:${p256sha256algorithm.address})...`);
  const sha1digest = await SHA1Digest.deploy();
  await sha1digest.deployed()
  console.log(`address SHA1Digest (tx:${sha1digest.address})...`);
  const sha256digest = await SHA256Digest.deploy();
  await sha256digest.deployed()
  console.log(`address SHA256Digest (tx:${sha256digest.address})...`);
  const sha1nsec3digest = await SHA1NSEC3Digest.deploy();
  await sha1nsec3digest.deployed()
  console.log(`address SHA1NSEC3Digest (tx:${sha1nsec3digest.address})...`);

  const anchors = realAnchors.slice();
  const algorithms = {
    5: rsasha1algorithm,
    7: rsasha1algorithm,
    8: rsasha256algorithm,
    13: p256sha256algorithm,
  };
  const digests = {
    1: sha1digest,
    2: sha256digest,
  };
  const nsec_digests = {
    1: sha1nsec3digest,
  };

  const dnssecimpl = await DNSSECImpl.deploy(encodeAnchors(anchors));
  await dnssecimpl.deployed();
  console.log(`address DNSSECImpl (tx:${dnssecimpl.address})...`);

  const transactions = [];
  for (const [id, alg] of Object.entries(algorithms)) {
    const address = alg.address;
    if (address != await dnssecimpl.algorithms(id)) {
      transactions.push(await dnssecimpl.setAlgorithm(id, address));
    }
  }

  for (const [id, digest] of Object.entries(digests)) {
    const address = digest.address;
    if (address != await dnssecimpl.digests(id)) {
      transactions.push(await dnssecimpl.setDigest(id, address));
    }
  }

  for (const [id, digest] of Object.entries(nsec_digests)) {
    const address = digest.address;
    if (address != await dnssecimpl.nsec3Digests(id)) {
      transactions.push(await dnssecimpl.setNSEC3Digest(id, address));
    }
  }

  console.log(`Waiting on ${transactions.length} transactions setting DNSSEC parameters`);
  await Promise.all(transactions.map((tx) => tx.wait()));
  console.log(`Done on ${transactions.length} transactions setting DNSSEC parameters`);

  const tldpublicsuffixlist = await TLDPublicSuffixList.deploy();
  await tldpublicsuffixlist.deployed()
  console.log(`address TLDPublicSuffixList (tx:${tldpublicsuffixlist.address})...`);

  const dnsregistrar = await DNSRegistrar.deploy(dnssecimpl.address, tldpublicsuffixlist.address, ens.address);
  await dnsregistrar.deployed()
  console.log(`address DNSRegistrar (tx:${dnsregistrar.address})...`);

  //tld-set

  const registry = await ethers.getContractAt('FNSRegistry', ens.address);
  await registry.setSubnodeOwner(ZERO_HASH, labelhash("futbol"), dnsregistrar.address);
  console.log('Set Tld', registry.address)

  //test
  // const transactions_commit = [];
  // const transactions_register = [];
  // const duration = 31556952
  // const resolverAddr = "0x6F85Dbf9607567862F8A8cC5E3406b34E2acc36a"
  // await Promise.all(jsonData.map(async (tx)=>{
  // console.log(`Generating commit for (account:${tx.account}, fns:${tx.fns}.ftm)...`);
  // const commitment = await ethregistrarcontroller.makeCommitmentWithConfig(tx.fns,tx.account,web3StringToBytes32(''),resolverAddr,tx.account);
  // await ethregistrarcontroller.commit(commitment)
  // console.log('commitment',commitment)

  // }))



  //await delay(60000)

  // await Promise.all(jsonData.map(async (tx)=>{
  // const commitment = await ethregistrarcontroller.makeCommitmentWithConfig(tx.fns,tx.account,web3StringToBytes32(''),resolverAddr,tx.account);
  // const timestamp = await ethregistrarcontroller.commitments(commitment)
  // if(timestamp){
  // const secret = '0x' + crypto.randomBytes(32).toString('hex');
  // const price = await ethregistrarcontroller.rentPrice(tx.fns, duration)
  // const bufferprice = price.mul(110).div(100)
  // const gasLimitHex = await ethregistrarcontroller.estimateGas.registerWithConfig(tx.fns,tx.account,web3StringToBytes32(secret),resolverAddr,tx.account,{ value: bufferprice})
  // const gasLimit = gasLimitHex.toNumber()
  // await ethregistrarcontroller.registerWithConfig(tx.fns,tx.account,web3StringToBytes32(secret),resolverAddr,tx.account,{ value: bufferprice, gasLimit });
  // console.log(`Registered for (account:${tx.account}, fns:${tx.fns}.ftm)...`);
  // }

  // }))

};

function web3StringToBytes32(text) {
  var result = ethers.utils.hexlify(ethers.utils.toUtf8Bytes(text));
  while (result.length < 66) { result += '0'; }
  if (result.length !== 66) { throw new Error("invalid web3 implicit bytes32"); }
  return result;
}

async function setupPublicResolver(ens, resolver, accounts) {

  await ens.setSubnodeOwner(ZERO_HASH, labelhash("resolver"), accounts[0]);
  //await ens.setSubnodeRecord(namehash.hash("ftm"), labelhash("resolver"), accounts[0], resolver.address, 0 );
  await ens.setResolver(namehash.hash("resolver"), resolver.address);
  await resolver['setAddr(bytes32,address)'](namehash.hash("resolver"), resolver.address);
}

async function setupRegistrar(ens, registrar) {
  await ens.setSubnodeOwner(ZERO_HASH, labelhash("test"), registrar.address);
}

async function setupReverseRegistrar(ens, reverseRegistrar, accounts) {
  await ens.setSubnodeOwner(ZERO_HASH, labelhash("reverse"), accounts[0]);
  await ens.setSubnodeOwner(namehash.hash("reverse"), labelhash("addr"), reverseRegistrar.address);
}

const realAnchors = [
  {
    name: '.',
    type: 'DS',
    class: 'IN',
    ttl: 3600,
    data: {
      keyTag: 19036,
      algorithm: 8,
      digestType: 2,
      digest: new Buffer(
        '49AAC11D7B6F6446702E54A1607371607A1A41855200FD2CE1CDDE32F24E8FB5',
        'hex'
      )
    }
  },
  {
    name: '.',
    type: 'DS',
    klass: 'IN',
    ttl: 3600,
    data: {
      keyTag: 20326,
      algorithm: 8,
      digestType: 2,
      digest: new Buffer(
        'E06D44B80B8F1D39A95C0B0D7C65D08458E880409BBC683457104237C7F8EC8D',
        'hex'
      )
    }
  }
];

const dummyAnchor = {
  name: '.',
  type: 'DS',
  class: 'IN',
  ttl: 3600,
  data: {
    keyTag: 1278, // Empty body, flags == 0x0101, algorithm = 253, body = 0x0000
    algorithm: 253,
    digestType: 253,
    digest: new Buffer('', 'hex')
  }
};

function encodeAnchors(anchors) {
  return (
    '0x' +
    anchors
      .map(anchor => {
        return packet.answer.encode(anchor).toString('hex');
      })
      .join('')
  );
};
// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });