import fs from "fs";
import csv from "csv-parser";

import {v4 as uuidv4} from "uuid";

import dayjs from "dayjs";

const INPUT_CSV = 'revolut.csv';
const OUTPUT_JSON = 'preprocessed.json';

const transactions = [];
const months = new Set();

fs.createReadStream(INPUT_CSV)
    .pipe(csv({
        headers: ['type', 'account', 'started_at', 'completed_at', 'description', 'amount', 'fee', 'currency', 'state', 'balance_after'],
        skipLines: 1
    }))
    .on('data', (row) => {
        if (!row.amount || row.type === 'TOPUP') return;

        const amount = parseFloat(row.amount);
        const date = row.completed_at || row.started_at;
        const formattedDate = dayjs(date).toISOString();
        const monthKey = dayjs(date).format('YYYY-MM');

        transactions.push({
            id: uuidv4(),
            date: formattedDate,
            amount,
            description: row.description || 'No description',
            source: 'CSV'
        });

        months.add(monthKey);
    })
    .on('end', () => {
        // Add synthetic salary & mortgage entries
        for (const month of months) {
            const date = dayjs(`${month}-01`).toISOString();

            transactions.push({
                id: uuidv4(),
                date,
                amount: 4000,
                description: `Salary for ${month}`,
                source: 'Synthetic'
            });

            transactions.push({
                id: uuidv4(),
                date,
                amount: -1800,
                description: `Mortgage for ${month}`,
                source: 'Synthetic'
            });
        }

        fs.writeFileSync(OUTPUT_JSON, JSON.stringify(transactions, null, 2));
        console.log(`Preprocessed ${transactions.length} records to ${OUTPUT_JSON}`);
    });
