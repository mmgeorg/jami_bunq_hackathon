// bunqTopUp.js
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const dayjs = require('dayjs');
require('dotenv').config();

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
const userId = process.env.BUNQ_USER_ID;
const accountId = process.env.BUNQ_ACCOUNT_ID;

const headers = {
    'Content-Type': 'application/json',
    'X-Bunq-Client-Authentication': process.env.BUNQ_SESSION_TOKEN,
    'X-Bunq-Client-Request-Id': `bunq-${Date.now()}`,
    'X-Bunq-Language': 'en_US',
    'X-Bunq-Region': 'nl_NL',
    'X-Bunq-Geolocation': '0 0 0 0 000'
};

async function requestTopUp(amountEur, forMonth = null) {
    const maxPerRequest = 500;
    const totalRounds = Math.ceil(amountEur / maxPerRequest);
    const baseDate = forMonth ? dayjs(forMonth + '-01') : dayjs();
    const descriptionBase = `Salary for ${baseDate.format('YYYY-MM')} (${baseDate.format('YYYY-MM-DD')} 00:00:00)`;

    for (let i = 0; i < totalRounds; i++) {
        const amountThisRound = Math.min(maxPerRequest, amountEur - i * maxPerRequest);
        const body = {
            amount_inquired: {
                value: amountThisRound.toFixed(2),
                currency: 'EUR'
            },
            counterparty_alias: {
                type: 'EMAIL',
                value: 'sugardaddy@bunq.com',
                name: 'Sugar Daddy'
            },
            description: `${descriptionBase} [part ${i + 1}/${totalRounds}]`,
            allow_bunqme: false
        };

        try {
            const url = `https://public-api.sandbox.bunq.com/v1/user/${userId}/monetary-account/${accountId}/request-inquiry`;
            const res = await axios.post(url, body, {
                headers: {
                    ...headers,
                    'X-Bunq-Client-Request-Id': uuidv4(),
                    'Content-Type': 'application/json'
                }
            });
            console.log(`✅ Requested €${amountThisRound} from Sugar Daddy (Top-up ${i + 1}/${totalRounds})`);
        } catch (err) {
            console.error(`❌ Failed top-up ${i + 1}:`, err.response?.data || err.message);
            break;
        }

        await sleep(1000);
    }

    console.log('🎉 Top-up requests completed.');
}

module.exports = { requestTopUp };
