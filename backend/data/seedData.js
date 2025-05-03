require('dotenv').config();
const fs = require('fs');
const csv = require('csv-parser');
const dayjs = require('dayjs');
const { sendSignedPayment } = require('./sendSignedPayment');
const { requestTopUp } = require('./requestTopUp');

const csvFile = 'revolut.csv';
const months = new Set();
const transactions = [];

/**
 * Sleep helper
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Reads the CSV and prepares transaction entries
 */
function readCsv() {
    return new Promise((resolve, reject) => {
        fs.createReadStream(csvFile)
            .pipe(csv({
                headers: [
                    'type', 'account', 'started_at', 'completed_at', 'description',
                    'amount', 'fee', 'currency', 'state', 'balance_after'
                ],
                skipLines: 1
            }))
            .on('data', (row) => {
                if (!row.amount || row.type === 'TOPUP') return;

                const date = row.completed_at || row.started_at;
                const formattedDate = dayjs(date).format('YYYY-MM-DD HH:mm:ss');
                const monthKey = dayjs(date).format('YYYY-MM');

                transactions.push({
                    amount: parseFloat(row.amount),
                    description: `${row.description} (${formattedDate})`,
                    date: formattedDate,
                    month: monthKey
                });

                months.add(monthKey);
            })
            .on('end', resolve)
            .on('error', reject);
    });
}

/**
 * Main seeding logic
 */
async function seedAll() {
    await readCsv();

    // Step 1: Top-up and mortgage per month
    for (const month of [...months].sort()) {
        const mortgageDesc = `Mortgage for ${month} (${month}-01 00:00:00)`;
        console.log(`🏦 Processing salary and mortgage for ${month}...`);

        await requestTopUp(4000, month);
        await sleep(1000);
        await sendSignedPayment(1800, mortgageDesc);
        await sleep(1000);
    }

    // Step 2: Send expense transactions
    for (const tx of transactions) {
        if (tx.amount < 0) {
            await sendSignedPayment(Math.abs(tx.amount), tx.description);
            await sleep(1000);
        }
    }

    console.log('✅ All transactions seeded to Bunq Sandbox!');
}

// Run
seedAll();
