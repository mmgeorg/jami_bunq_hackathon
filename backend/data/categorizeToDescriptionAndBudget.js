require('dotenv').config();
const fs = require('fs');
const csv = require('csv-parser');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const {OpenAI } = require('openai');

const inputFile = 'unique_descriptions.csv';
const outputFile = 'categorized_descriptions.csv';
const outputFileJson = 'categorized_descriptions.json';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});
const descriptions = [];

function readCsv() {
    return new Promise((resolve, reject) => {
        fs.createReadStream(inputFile)
            .pipe(csv())
            .on('data', (row) => {
                if (row.description) descriptions.push(row.description.trim());
            })
            .on('end', resolve)
            .on('error', reject);
    });
}

async function classifyDescription(description) {
    const prompt = `
Classify the following transaction description into:
1. A short category (like Groceries, Transport, Restaurants, Subscription, Shopping, Utilities, Travel, Healthcare, etc.)
2. A broader budget group (Groceries & Essentials, Transport, Restaurants, Subscription, Health, Travel, Shopping, Utilities, Misc)

Return JSON like:
{
  "category": "...",
  "budget_group": "..."
}

Description: "${description}"
`;

    const response = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
            { role: 'system', content: 'You are a finance categorization assistant.' },
            { role: 'user', content: prompt }
        ],
        temperature: 0.2
    });

    console.log(response.choices[0]);

    const text = response.choices[0].message.content;

    try {
        const parsed = JSON.parse(text);
        return {
            description,
            category: parsed.category || 'Uncategorized',
            budget_group: parsed.budget_group || 'Misc'
        };
    } catch (err) {
        console.error('Failed to parse response for:', description, text);
        return {
            description,
            category: 'Uncategorized',
            budget_group: 'Misc'
        };
    }
}

async function classifyAll() {
    await readCsv();
    const results = [];

    for (const desc of descriptions) {
        console.log(`🔍 Classifying: ${desc}`);
        const result = await classifyDescription(desc);
        results.push(result);

        // Optional sleep to avoid rate limiting (e.g., 1s)
        await new Promise((res) => setTimeout(res, 1000));
    }

    const csvWriter = createCsvWriter({
        path: outputFile,
        header: [
            { id: 'description', title: 'description' },
            { id: 'category', title: 'category' },
            { id: 'budget_group', title: 'budget_group' }
        ]
    });

    await csvWriter.writeRecords(results);
    fs.writeFileSync(outputFileJson, JSON.stringify(results, null, 2));

    console.log(`✅ Saved to ${outputFile}`);
}

classifyAll();
