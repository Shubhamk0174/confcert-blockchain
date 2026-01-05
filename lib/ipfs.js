/**
 * IPFS Utility Functions
 * Handles uploading certificate images to IPFS using Pinata service
 */

/**
 * Upload a file to IPFS via Pinata
 * @param {File} file - The certificate image file to upload
 * @returns {Promise<{success: boolean, ipfsHash?: string, error?: string}>}
 */
export async function uploadToIPFS(file) {
  try {
    // Validate file
    if (!file) {
      throw new Error('No file provided');
    }

    // Check file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      throw new Error('File size exceeds 10MB limit');
    }

    // Validate file type (images only)
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/pdf'];
    if (!validTypes.includes(file.type)) {
      throw new Error('Invalid file type. Only JPEG, PNG, and PDF are allowed');
    }

    // Create FormData
    const formData = new FormData();
    formData.append('file', file);

    // Add metadata
    const metadata = JSON.stringify({
      name: file.name,
      keyvalues: {
        type: 'certificate',
        timestamp: Date.now().toString()
      }
    });
    formData.append('pinataMetadata', metadata);

    // Pinata options
    const options = JSON.stringify({
      cidVersion: 1,
    });
    formData.append('pinataOptions', options);

    // Upload to Pinata
    const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.PINATA_JWT}`
      },
      body: formData
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.log(errorData.error);
      throw new Error(errorData.error || 'Failed to upload to IPFS');
    }

    const data = await response.json();
    
    return {
      success: true,
      ipfsHash: data.IpfsHash,
      pinataUrl: `https://gateway.pinata.cloud/ipfs/${data.IpfsHash}`,
      timestamp: data.Timestamp
    };

  } catch (error) {
    console.error('IPFS Upload Error:', error);
    return {
      success: false,
      error: error.message || 'Failed to upload to IPFS'
    };
  }
}

/**
 * Get the full IPFS gateway URL for a hash
 * @param {string} ipfsHash - The IPFS hash (CID)
 * @returns {string} Full gateway URL
 */
export function getIPFSUrl(ipfsHash) {
  if (!ipfsHash) return '';
  
  // Remove ipfs:// prefix if present
  const hash = ipfsHash.replace('ipfs://', '');
  
  // Return Pinata gateway URL
  return `https://gateway.pinata.cloud/ipfs/${hash}`;
}

/**
 * Upload JSON metadata to IPFS
 * @param {object} metadata - The metadata object to upload
 * @returns {Promise<{success: boolean, ipfsHash?: string, error?: string}>}
 */
export async function uploadJSONToIPFS(metadata) {
  try {
    if (!metadata) {
      throw new Error('No metadata provided');
    }

    const response = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.PINATA_JWT}`
      },
      body: JSON.stringify({
        pinataContent: metadata,
        pinataMetadata: {
          name: 'certificate-metadata',
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.log(errorData.error);
      throw new Error(errorData.error || 'Failed to upload JSON to IPFS');
    }

    const data = await response.json();
    
    return {
      success: true,
      ipfsHash: data.IpfsHash,
      pinataUrl: `https://gateway.pinata.cloud/ipfs/${data.IpfsHash}`
    };

  } catch (error) {
    console.error('IPFS JSON Upload Error:', error);
    return {
      success: false,
      error: error.message || 'Failed to upload JSON to IPFS'
    };
  }
}

/**
 * Fetch content from IPFS
 * @param {string} ipfsHash - The IPFS hash to fetch
 * @returns {Promise<any>} The content from IPFS
 */
export async function fetchFromIPFS(ipfsHash) {
  try {
    const url = getIPFSUrl(ipfsHash);
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error('Failed to fetch from IPFS');
    }

    // Try to parse as JSON, otherwise return as text
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    }
    
    return await response.text();
    
  } catch (error) {
    console.error('IPFS Fetch Error:', error);
    throw error;
  }
}

/**
 * Alternative: Upload to local IPFS node (if running IPFS Desktop)
 * @param {File} file - The file to upload
 * @returns {Promise<{success: boolean, ipfsHash?: string, error?: string}>}
 */
export async function uploadToLocalIPFS(file) {
  try {
    // This assumes you have IPFS Desktop running with API at localhost:5001
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('http://localhost:5001/api/v0/add', {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error('Failed to upload to local IPFS node');
    }

    const data = await response.json();
    
    return {
      success: true,
      ipfsHash: data.Hash,
      localUrl: `http://localhost:8080/ipfs/${data.Hash}`
    };

  } catch (error) {
    console.error('Local IPFS Upload Error:', error);
    return {
      success: false,
      error: error.message || 'Failed to upload to local IPFS. Make sure IPFS Desktop is running.'
    };
  }
}
