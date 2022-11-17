pragma solidity >=0.4.24;

import "./Deed.sol";

interface Registrar {

    enum Mode { Open, Auction, Owned, Forbidden, Reveal, NotYetAvailable }

    event AuctionStarted(bytes32 indexed hash, uint registrationDate);
    event NewBid(bytes32 indexed hash, address indexed bidder, uint deposit);
    event BidRevealed(bytes32 indexed hash, address indexed owner, uint value, uint8 status);
    event HashRegistered(bytes32 indexed hash, address indexed owner, uint value, uint registrationDate);
    event HashReleased(bytes32 indexed hash, uint value);
    event HashInvalidated(bytes32 indexed hash, string indexed name, uint value, uint registrationDate);

    function state(bytes32 _hash) external virtual view returns (Mode);
    function startAuction(bytes32 _hash) external virtual;
    function startAuctions(bytes32[] calldata _hashes) external virtual;
    function newBid(bytes32 sealedBid) external virtual payable;
    function startAuctionsAndBid(bytes32[] calldata hashes, bytes32 sealedBid) external virtual payable;
    function unsealBid(bytes32 _hash, uint _value, bytes32 _salt) external virtual;
    function cancelBid(address bidder, bytes32 seal) external virtual;
    function finalizeAuction(bytes32 _hash) external virtual;
    function transfer(bytes32 _hash, address payable newOwner) external virtual;
    function releaseDeed(bytes32 _hash) external virtual;
    function invalidateName(string calldata unhashedName) external virtual;
    function eraseNode(bytes32[] calldata labels) external virtual;
    function transferRegistrars(bytes32 _hash) external virtual;
    function acceptRegistrarTransfer(bytes32 hash, Deed deed, uint registrationDate) external virtual;
    function entries(bytes32 _hash) external virtual view returns (Mode, address, uint, uint, uint);
}
