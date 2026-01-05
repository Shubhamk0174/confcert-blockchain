// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title CertificateRegistry
 * @dev Smart contract for managing blockchain-based certificates
 * @notice This contract stores certificate metadata on-chain while actual certificate files are stored on IPFS
 */
contract CertificateRegistry {
    
    // Structure to store certificate details
    struct Certificate {
        uint256 id;                 // Unique certificate ID
        string studentName;         // Name of the certificate recipient
        string ipfsHash;           // IPFS hash (CID) where certificate image is stored
        address issuer;            // Address of the coordinator who issued the certificate
        uint256 timestamp;         // Timestamp when certificate was issued
        bool exists;               // Flag to check if certificate exists
    }
    
    // State variables
    uint256 private certificateCounter;  // Counter for generating unique IDs (starts from 1001)
    address public owner;                 // Contract owner (main coordinator)
    
    // Mappings
    mapping(uint256 => Certificate) public certificates;  // certificateId => Certificate
    mapping(address => bool) public authorizedIssuers;    // Addresses allowed to issue certificates
    
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
    
    /**
     * @dev Constructor - initializes contract with owner and sets starting certificate ID
     */
    constructor() {
        owner = msg.sender;
        authorizedIssuers[msg.sender] = true;
        certificateCounter = 1000;  // First certificate will be 1001
    }
    
    /**
     * @dev Issue a new certificate
     * @param _studentName Name of the student receiving the certificate
     * @param _ipfsHash IPFS hash (CID) of the certificate image
     * @return certificateId The unique ID assigned to this certificate
     */
    function issueCertificate(
        string memory _studentName,
        string memory _ipfsHash
    ) public onlyAuthorized returns (uint256) {
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
    
    /**
     * @dev Issue multiple certificates in a single transaction (bulk issuance)
     * @param _studentNames Array of student names
     * @param _ipfsHashes Array of IPFS hashes corresponding to each certificate
     * @return certificateIds Array of generated certificate IDs
     */
    function bulkIssueCertificates(
        string[] memory _studentNames,
        string[] memory _ipfsHashes
    ) public onlyAuthorized returns (uint256[] memory) {
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
    
    /**
     * @dev Verify and retrieve certificate details by ID
     * @param _certificateId The unique certificate ID to look up
     * @return id Certificate ID
     * @return studentName Name on the certificate
     * @return ipfsHash IPFS hash of the certificate
     * @return issuer Address that issued the certificate
     * @return timestamp When the certificate was issued
     * @return exists Whether the certificate exists
     */
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
    
    /**
     * @dev Check if a certificate exists
     * @param _certificateId The certificate ID to check
     * @return bool True if certificate exists
     */
    function verifyCertificate(uint256 _certificateId) public view returns (bool) {
        return certificates[_certificateId].exists;
    }
    
    /**
     * @dev Get all certificates issued by a specific address
     * @param _issuer Address of the issuer
     * @return certificateIds Array of certificate IDs issued by this address
     */
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
    
    /**
     * @dev Get the current certificate counter value
     * @return uint256 The last issued certificate ID
     */
    function getCurrentCounter() public view returns (uint256) {
        return certificateCounter;
    }
    
    /**
     * @dev Authorize a new address to issue certificates
     * @param _issuer Address to authorize
     */
    function authorizeIssuer(address _issuer) public onlyOwner {
        require(_issuer != address(0), "Invalid address");
        authorizedIssuers[_issuer] = true;
        emit IssuerAuthorized(_issuer);
    }
    
    /**
     * @dev Revoke authorization from an issuer
     * @param _issuer Address to revoke
     */
    function revokeIssuer(address _issuer) public onlyOwner {
        require(_issuer != owner, "Cannot revoke owner");
        authorizedIssuers[_issuer] = false;
        emit IssuerRevoked(_issuer);
    }
    
    /**
     * @dev Check if an address is authorized to issue certificates
     * @param _issuer Address to check
     * @return bool True if authorized
     */
    function isAuthorized(address _issuer) public view returns (bool) {
        return authorizedIssuers[_issuer] || _issuer == owner;
    }
}
