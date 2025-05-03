const axios = require('axios');

const BUNQ_BASE = 'https://public-api.sandbox.bunq.com/v1';
const YOUR_API_URL = process.env.MY_API_URL || 'https://your-api-url/items'; // update as needed

async function fetchAndStoreAccounts(userId) {
    const headers = {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        'User-Agent': 'YourAppName/1.0',
        'X-Bunq-Language': 'en_US',
        'X-Bunq-Region': 'nl_NL',
        'X-Bunq-Geolocation': '0 0 0 0 000',
        'X-Bunq-Client-Authentication': process.env.BUNQ_SESSION_TOKEN
    };

    try {
        // 1. Fetch user info
        const userResponse = await axios.get(`${BUNQ_BASE}/user/${userId}`, { headers });
        const company = userResponse.data.Response?.[0]?.UserCompany;
        const companyName = company?.display_name || 'Unknown';

        // 2. Fetch monetary account banks
        const accountResponse = await axios.get(`${BUNQ_BASE}/user/${userId}/monetary-account-bank`, { headers });
        const accounts = accountResponse.data.Response.map(r => r.MonetaryAccountBank);

        if (!accounts.length) {
            console.log('No bank accounts found.');
            return;
        }

        // 3. Loop through and POST to your own API
        for (const acc of accounts) {
            const ibanAlias = acc.alias.find(a => a.type === 'IBAN');
            const item = {
                user_id: Number(userId),
                account_id: acc.id,
                company_name: companyName,
                status: acc.status,
                iban: ibanAlias?.value || null,
                balance: acc.balance?.value || '0.00',
                currency: acc.balance?.currency || 'EUR',
                createdAt: acc.created
            };

            await axios.post(YOUR_API_URL, item);
            console.log(`✅ Saved account ${acc.id} (${item.iban})`);
        }
    } catch (error) {
        console.error('❌ Error:', error.response?.data || error.message);
    }
}

module.exports = { fetchAndStoreAccounts };
