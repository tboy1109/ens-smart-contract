pragma solidity >=0.8.0;

interface Deed {

    function setOwner(address payable newOwner) external virtual;
    function setRegistrar(address newRegistrar) external virtual;
    function setBalance(uint newValue, bool throwOnFailure) external virtual;
    function closeDeed(uint refundRatio) external virtual;
    function destroyDeed() external virtual;

    function owner() external virtual view returns (address);
    function previousOwner() external virtual view returns (address);
    function value() external virtual view returns (uint);
    function creationDate() external virtual view returns (uint);

}
