import nodemailer from 'nodemailer';
import { NextResponse } from 'next/server';

/**
 * ✅ CORRECT Gmail SMTP configuration
 * - Uses STARTTLS
 * - Avoids SMTPS (465)
 * - Fixes TLS negotiation failed error
 */
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,          // ✅ IMPORTANT
  secure: false,      // ✅ MUST be false for STARTTLS
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS, // App Password
  },
  tls: {
    minVersion: 'TLSv1.2', // Gmail requires this
  },
});

// ✅ Verify SMTP on startup (optional but recommended)
transporter.verify((error, success) => {
  if (error) {
    console.error('SMTP verification failed:', error);
  } else {
    console.log('SMTP server ready');
  }
});

async function sendCertificateEmail({
  to,
  studentName,
  certificateId,
  ipfsHash,
  issuerAddress,
  transactionHash,
}) {
  try {
    const verificationLink =
      `${process.env.NEXT_PUBLIC_BASE_URL}/verify?certificateid=${certificateId}`;

    const certificateLink = `https://ipfs.io/ipfs/${ipfsHash}`;

    // Fetch certificate image (optional)
    let attachments = [];
    try {
      const response = await fetch(certificateLink);
      if (response.ok) {
        const buffer = await response.arrayBuffer();
        attachments.push({
          filename: 'certificate.png',
          content: Buffer.from(buffer),
          cid: 'certificateImage',
        });
      }
    } catch (err) {
      console.warn('Could not attach certificate image:', err.message);
    }

    const mailOptions = {
      from: `"ConfCert" <${process.env.EMAIL_USER}>`, // ✅ strong sender
      to,
      subject: `Certificate Issued: ${studentName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
          <h2>🎓 Certificate Issued</h2>

          <p>Dear <strong>${studentName}</strong>,</p>

          <p>Your certificate has been successfully issued on the blockchain.</p>

          <ul>
            <li><strong>Certificate ID:</strong> ${certificateId}</li>
            <li><strong>Issuer:</strong> ${issuerAddress}</li>
            <li>
              <strong>Transaction:</strong>
              <a href="https://sepolia.etherscan.io/tx/${transactionHash}" target="_blank">
                View on Etherscan
              </a>
            </li>
          </ul>

          <p>
            <strong>View Certificate:</strong>
            <a href="${certificateLink}" target="_blank">Open on IPFS</a>
          </p>

          ${
            attachments.length
              ? `<img src="cid:certificateImage" style="max-width:100%; margin-top:10px;" />`
              : ''
          }

          <p>
            <strong>Verify Certificate:</strong>
            <a href="${verificationLink}" target="_blank">Verify here</a>
          </p>

          <p style="margin-top:20px;">
            Regards,<br/>
            <strong>ConfCert Team</strong>
          </p>
        </div>
      `,
      attachments,
    };

    const info = await transporter.sendMail(mailOptions);

    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Email send failed:', error);
    return { success: false, error: error.message };
  }
}

export async function POST(request) {
  try {
    const body = await request.json();

    const {
      to,
      studentName,
      certificateId,
      ipfsHash,
      issuerAddress,
      transactionHash,
    } = body;

    if (
      !to ||
      !studentName ||
      !certificateId ||
      !ipfsHash ||
      !issuerAddress ||
      !transactionHash
    ) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // 🚫 Prevent Gmail self-send block
    if (to === process.env.EMAIL_USER) {
      return NextResponse.json(
        { error: 'Recipient email must be different from sender' },
        { status: 400 }
      );
    }

    const result = await sendCertificateEmail({
      to,
      studentName,
      certificateId,
      ipfsHash,
      issuerAddress,
      transactionHash,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      messageId: result.messageId,
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
