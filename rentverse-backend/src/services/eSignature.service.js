const axios = require('axios');
const QRCode = require('qrcode');

// Simple service to get QR code from e-signature endpoint
async function getSignatureQRCode(userData) {
  try {
    const apiUrl = process.env.E_SIGNATURE_API_URL;

    // If no API URL configured, generate a placeholder QR code
    if (!apiUrl) {
      console.log('📝 Generating placeholder QR code for:', userData.name);
      const qrData = `E-SIGNATURE\nName: ${userData.name}\nRole: ${userData.role}\nLease ID: ${userData.leaseId}\nTimestamp: ${userData.timestamp}`;
      return await QRCode.toDataURL(qrData);
    }

    // Send data as required by your endpoint structure
    const requestData = {
      data: {
        name: userData.name,
        timestamp: userData.timestamp || new Date().toISOString(),
      },
    };

    const response = await axios.post(apiUrl, requestData, {
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Return QR code from your endpoint response
    return response.data.qrCode;
  } catch (error) {
    console.error('E-signature API error:', error.message);

    // Fallback to placeholder QR code if API call fails
    console.log('📝 Falling back to placeholder QR code for:', userData.name);
    const qrData = `E-SIGNATURE\nName: ${userData.name}\nRole: ${userData.role}\nLease ID: ${userData.leaseId}\nTimestamp: ${userData.timestamp}`;
    return await QRCode.toDataURL(qrData);
  }
}

module.exports = { getSignatureQRCode };
