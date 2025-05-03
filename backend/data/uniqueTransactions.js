const fs = require('fs');
const path = require('path');
const { parse } = require('json2csv');

const transactions = require('./preprocessed.json'); // assume JSON file

const uniqueDescriptions = new Set();

// Collect unique descriptions
for (const tx of transactions) {
    if (tx.description) {
        uniqueDescriptions.add(tx.description.trim());
    }
}

const output = Array.from(uniqueDescriptions).map(desc => ({ description: desc }));

const fields = ['description'];
const csv = parse(output, { fields });

const outputPath = path.join(__dirname, 'unique_descriptions.csv');
fs.writeFileSync(outputPath, csv);

console.log(`Saved ${output.length} unique descriptions to unique_descriptions.csv`);
