// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract CertificateRegistry {
    
    // Structure to store certificate details
    struct Certificate {
        uint256 id;                 
        string studentName;         
        string ipfsHash;           
        address issuer;            
        uint256 timestamp;        
        bool exists;               
    }
    
    // State variables
    uint256 private certificateCounter;  
    address public owner;                
    
    // Mappings
    mapping(uint256 => Certificate) public certificates;  
    mapping(address => bool) public authorizedIssuers;   
    
    // Events
    event CertificateIssued(
        uint256 indexed certificateId,
        string studentName,
        string ipfsHash,
        address indexed issuer,
        uint256 timestamp
    );
    
    event IssuerAuthorized(address indexed issuer);
    event IssuerRevoked(address indexed issuer);
    
    // Modifiers
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can perform this action");
        _;
    }
    
    modifier onlyAuthorized() {
        require(
            authorizedIssuers[msg.sender] || msg.sender == owner,
            "Not authorized to issue certificates"
        );
        _;
    }
    

    constructor() {
        owner = msg.sender;
        authorizedIssuers[msg.sender] = true;
        certificateCounter = 1000;  // First certificate will be 1001
    }
    

    function issueCertificate(
        string memory _studentName,
        string memory _ipfsHash
    ) public returns (uint256) {
        require(bytes(_studentName).length > 0, "Student name cannot be empty");
        require(bytes(_ipfsHash).length > 0, "IPFS hash cannot be empty");
        
        // Increment counter and generate new ID
        certificateCounter++;
        uint256 newCertificateId = certificateCounter;
        
        // Create certificate record
        certificates[newCertificateId] = Certificate({
            id: newCertificateId,
            studentName: _studentName,
            ipfsHash: _ipfsHash,
            issuer: msg.sender,
            timestamp: block.timestamp,
            exists: true
        });
        
        // Emit event
        emit CertificateIssued(
            newCertificateId,
            _studentName,
            _ipfsHash,
            msg.sender,
            block.timestamp
        );
        
        return newCertificateId;
    }
    

    function bulkIssueCertificates(
        string[] memory _studentNames,
        string[] memory _ipfsHashes
    ) public returns (uint256[] memory) {
        require(_studentNames.length > 0, "Must provide at least one certificate");
        require(_studentNames.length == _ipfsHashes.length, "Arrays length mismatch");
        require(_studentNames.length <= 100, "Cannot issue more than 100 certificates at once");
        
        uint256[] memory certificateIds = new uint256[](_studentNames.length);
        
        for (uint256 i = 0; i < _studentNames.length; i++) {
            require(bytes(_studentNames[i]).length > 0, "Student name cannot be empty");
            require(bytes(_ipfsHashes[i]).length > 0, "IPFS hash cannot be empty");
            
            // Increment counter and generate new ID
            certificateCounter++;
            uint256 newCertificateId = certificateCounter;
            certificateIds[i] = newCertificateId;
            
            // Create certificate record
            certificates[newCertificateId] = Certificate({
                id: newCertificateId,
                studentName: _studentNames[i],
                ipfsHash: _ipfsHashes[i],
                issuer: msg.sender,
                timestamp: block.timestamp,
                exists: true
            });
            
            // Emit event for each certificate
            emit CertificateIssued(
                newCertificateId,
                _studentNames[i],
                _ipfsHashes[i],
                msg.sender,
                block.timestamp
            );
        }
        
        return certificateIds;
    }
    

    function getCertificate(uint256 _certificateId) 
        public 
        view 
        returns (
            uint256 id,
            string memory studentName,
            string memory ipfsHash,
            address issuer,
            uint256 timestamp,
            bool exists
        ) 
    {
        Certificate memory cert = certificates[_certificateId];
        return (
            cert.id,
            cert.studentName,
            cert.ipfsHash,
            cert.issuer,
            cert.timestamp,
            cert.exists
        );
    }
    

    function verifyCertificate(uint256 _certificateId) public view returns (bool) {
        return certificates[_certificateId].exists;
    }
    

    function getCertificatesByIssuer(address _issuer) 
        public 
        view 
        returns (uint256[] memory) 
    {
        // First, count how many certificates this issuer has
        uint256 count = 0;
        for (uint256 i = 1001; i <= certificateCounter; i++) {
            if (certificates[i].exists && certificates[i].issuer == _issuer) {
                count++;
            }
        }
        
        // Create array and populate it
        uint256[] memory result = new uint256[](count);
        uint256 index = 0;
        for (uint256 i = 1001; i <= certificateCounter; i++) {
            if (certificates[i].exists && certificates[i].issuer == _issuer) {
                result[index] = i;
                index++;
            }
        }
        
        return result;
    }
    

    function getCurrentCounter() public view returns (uint256) {
        return certificateCounter;
    }

    function authorizeIssuer(address _issuer) public onlyOwner {
        require(_issuer != address(0), "Invalid address");
        authorizedIssuers[_issuer] = true;
        emit IssuerAuthorized(_issuer);
    }
    

    function revokeIssuer(address _issuer) public onlyOwner {
        require(_issuer != owner, "Cannot revoke owner");
        authorizedIssuers[_issuer] = false;
        emit IssuerRevoked(_issuer);
    }
    

    function isAuthorized(address _issuer) public view returns (bool) {
        return authorizedIssuers[_issuer] || _issuer == owner;
    }
}
