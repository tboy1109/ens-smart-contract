pragma solidity >=0.8.4;
pragma experimental ABIEncoderV2;

import "../registry/FNS.sol";
import "./FTMRegistrarController.sol";
import "../resolvers/Resolver.sol";

contract BulkRenewal {
    bytes32 constant private FTM_NAMEHASH = 0xef0d8150af51886892faa1bf5f9cb425c4c2194294fbea6519ce2a9cff9fb4d8;
    bytes4 constant private REGISTRAR_CONTROLLER_ID = 0x018fac06;
    bytes4 constant private INTERFACE_META_ID = bytes4(keccak256("supportsInterface(bytes4)"));
    bytes4 constant public BULK_RENEWAL_ID = bytes4(
        keccak256("rentPrice(string[],uint)") ^
        keccak256("renewAll(string[],uint")
    );

    FNS public fns;

    constructor(FNS _fns) public {
        fns = _fns;
    }

    function getController() internal view returns(FTMRegistrarController) {
        Resolver r = Resolver(fns.resolver(FTM_NAMEHASH));
        return FTMRegistrarController(r.interfaceImplementer(FTM_NAMEHASH, REGISTRAR_CONTROLLER_ID));
    }

    function rentPrice(string[] calldata names, uint duration) external view returns(uint total) {
        FTMRegistrarController controller = getController();
        for(uint i = 0; i < names.length; i++) {
            total += controller.rentPrice(names[i], duration);
        }
    }

    function renewAll(string[] calldata names, uint duration) external payable {
        FTMRegistrarController controller = getController();
        for(uint i = 0; i < names.length; i++) {
            uint cost = controller.rentPrice(names[i], duration);
            controller.renew{value:cost}(names[i], duration);
        }
        // Send any excess funds back
        payable(msg.sender).transfer(address(this).balance);
    }

    function supportsInterface(bytes4 interfaceID) external pure returns (bool) {
         return interfaceID == INTERFACE_META_ID || interfaceID == BULK_RENEWAL_ID;
    }
}
