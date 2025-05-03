// sendSignedPayment.js
require('dotenv').config();
const axios = require('axios');
const crypto = require('crypto');

// Load RSA private key from .env (ensure escaped \n)
const privateKey = process.env.BUNQ_PRIVATE_KEY.replace(/\\n/g, '\n');
console.log(privateKey);
if (!privateKey) {
    throw new Error('BUNQ_PRIVATE_KEY not found or improperly formatted.');
}

// Constants from environment
const BUNQ_API = 'https://public-api.sandbox.bunq.com/v1';
const USER_ID = process.env.BUNQ_USER_ID;
const ACCOUNT_ID = process.env.BUNQ_ACCOUNT_ID;
const AUTH_TOKEN = process.env.BUNQ_SESSION_TOKEN;

/**
 * Sign the request body using RSA SHA256 and private key
 */
function signRequest(dataToSign) {
    const signer = crypto.createSign('RSA-SHA256');
    signer.update(dataToSign);
    signer.end();
    return signer.sign(privateKey, 'base64');
}

/**
 * Send a signed payment request to the Bunq API
 * @param {string|number} amountValue - e.g. "10.00"
 * @param {string} description - e.g. "Dinner"
 * @param {object} counterparty - optional, default is "Sugar Daddy" alias
 */
async function sendSignedPayment(
    amountValue,
    description,
    counterparty = {
        type: 'EMAIL',
        value: 'sugardaddy@bunq.com',
        name: 'Sugar Daddy'
    }
) {
    const payload = {
        amount: {
            value: parseFloat(amountValue).toFixed(2),
            currency: 'EUR'
        },
        counterparty_alias: counterparty,
        description
    };

    const bodyStr = JSON.stringify(payload);
    const signature = signRequest(bodyStr);

    const headers = {
        'Content-Type': 'application/json',
        'X-Bunq-Client-Authentication': AUTH_TOKEN,
        'X-Bunq-Client-Signature': signature,
        'X-Bunq-Client-Request-Id': `bunq-${Date.now()}`,
        'X-Bunq-Language': 'en_US',
        'X-Bunq-Region': 'nl_NL',
        'X-Bunq-Geolocation': '0 0 0 0 000'
    };

    const url = `${BUNQ_API}/user/${USER_ID}/monetary-account/${ACCOUNT_ID}/payment`;

    try {
        const response = await axios.post(url, bodyStr, { headers });
        console.log(`✅ Payment success: €${amountValue} - ${description}`);
        return response.data;
    } catch (err) {
        console.error(`❌ Payment failed: ${description}`);
        console.error(err.response?.data || err.message);
    }
}

module.exports = { sendSignedPayment };
