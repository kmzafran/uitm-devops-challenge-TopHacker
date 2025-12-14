const axios = require('axios');

// Simple service to get QR code from e-signature endpoint
async function getSignatureQRCode(userData) {
  try {
    const apiUrl = process.env.E_SIGNATURE_API_URL;

    if (!apiUrl) {
      throw new Error('E_SIGNATURE_API_URL not configured');
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
    throw error;
  }
}

module.exports = { getSignatureQRCode };
