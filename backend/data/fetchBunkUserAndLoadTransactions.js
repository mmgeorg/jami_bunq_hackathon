const axios = require('axios');
const fs = require('fs');
require('dotenv').config();


const fetch = require('node-fetch');

async function fetchUserData() {
    const url = 'https://public-api.sandbox.bunq.com/v1/user/1879742';
    const headers = {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        'User-Agent': 'postman',
        'X-Bunq-Language': 'en_US',
        'X-Bunq-Region': 'nl_NL',
        'X-Bunq-Client-Request-Id': 'Qt47AYjletpXW21BErxr',
        'X-Bunq-Geolocation': '0 0 0 0 000',
        'X-Bunq-Client-Authentication': '677026e1cd5b8b1513c5783a5db1591eabf79ffe488f543105589ac73b7dfb74',
        'X-Bunq-Client-Signature': 'U+GL4nzI1PXm3w5hNyZn13uPPQ99BKnn9b4h4ao1og0IVVYlUyoCA68cQd47zjc28UxrCWxvZzbU0uLym6vSUcmGvPrjSEje3UWwhOnlROYnJMZutZZjFzF5lim9D6d0juKf/CouvCsLUjFi9dltZU1+/denQyUYhwMTNF1aVKXAsViOiCwSExZ7TONsM4YxUQYs8RPE/UJ7scnVKO/2qIMxYAsvdMTcAYjtZ/QPHQLjQvimd81ynRSsmTko8jFBzrO5vIFZpel3nk0F+ueug+mjy2uSUnTanChL6hOHLkCsNvUx6osOQYJTShWUtbvxLOK7eZwDMxA9M7Ho5G7fcw=='
    };

    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: headers
        });

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        const combinedData = JSON.parse(fs.readFileSync('combined.json', 'utf8'));

        const finalData = {
            user: userData,
            transactions: combinedData
        };
        console.log(data);

        fs.writeFileSync('final_combined.json', JSON.stringify(finalData, null, 2));
        console.log('Combined user and transaction data saved to final_combined.json');
    } catch (error) {
        console.error('Error fetching user data:', error);
    }
}

fetchUserData();

