import { uploadToIPFS } from '../../../lib/ipfs.js';

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file) {
      return Response.json({ error: 'No file provided' }, { status: 400 });
    }

    const result = await uploadToIPFS(file);

    if (result.success) {
      return Response.json({
        ipfsHash: result.ipfsHash,
        pinataUrl: result.pinataUrl,
        timestamp: result.timestamp
      });
    } else {
      return Response.json({ error: result.error }, { status: 500 });
    }
  } catch (error) {
    console.error('Upload error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}