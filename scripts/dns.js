const hre = require("hardhat");
const namehash = require('eth-ens-namehash');
const packet = require('dns-packet');

const ethers = hre.ethers;
const utils = ethers.utils;
const labelhash = (label) => utils.keccak256(utils.toUtf8Bytes(label))
const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
const ZERO_HASH = "0x0000000000000000000000000000000000000000000000000000000000000000";
async function main() {
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
    for(const [id, alg] of Object.entries(algorithms)) {
      const address = alg.address;
      if(address != await dnssecimpl.algorithms(id)) {
        transactions.push(await dnssecimpl.setAlgorithm(id, address));
      }
    }

    for(const [id, digest] of Object.entries(digests)) {
      const address = digest.address;
      if(address != await dnssecimpl.digests(id)) {
        transactions.push(await dnssecimpl.setDigest(id, address));
      }
    }

    for(const [id, digest] of Object.entries(nsec_digests)) {
      const address = digest.address;
      if(address != await dnssecimpl.nsec3Digests(id)) {
        transactions.push(await dnssecimpl.setNSEC3Digest(id, address));
      }
    }

    console.log(`Waiting on ${transactions.length} transactions setting DNSSEC parameters`);
    await Promise.all(transactions.map((tx) => tx.wait()));   
	console.log(`Done on ${transactions.length} transactions setting DNSSEC parameters`);
	
	const tldpublicsuffixlist = await TLDPublicSuffixList.deploy();
    await tldpublicsuffixlist.deployed()
    console.log(`address TLDPublicSuffixList (tx:${tldpublicsuffixlist.address})...`);
	const ENS_address = "0xC000f5161A12f0a300B2c7FB6F562a6226C0DDa6";
	const dnsregistrar = await DNSRegistrar.deploy(dnssecimpl.address, tldpublicsuffixlist.address, ENS_address);
    await dnsregistrar.deployed()
    console.log(`address DNSRegistrar (tx:${dnsregistrar.address})...`);
	
	//tld-set
	const labelhash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes('futbol'));
	console.log('labelhash',labelhash)
	
	const registry = await ethers.getContractAt('ENSRegistry',ENS_address);
	await registry.setSubnodeOwner(ZERO_HASH, labelhash, dnsregistrar.address);
	console.log('Set Tld',registry.address)
	
	
  

};

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