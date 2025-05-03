const fs = require('fs');
const path = require('path');
const { parse } = require('json2csv');

// Load the JSON data from the file
const dataPath = path.join(__dirname, 'combined.json');
const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

// Load and parse the category enum
const categoryEnumPath = path.join(__dirname, 'categoryEnum.txt');
const categoryEnumContent = fs.readFileSync(categoryEnumPath, 'utf8');
const categoryEnum = eval(`(${categoryEnumContent})`);

// Helper function to calculate days since last purchase for a category
function daysSinceLastPurchase(transactions, category, currentDate) {
    const lastTransaction = transactions
        .filter(t => t.category === category && new Date(t.date) < currentDate)
        .sort((a, b) => new Date(b.date) - new Date(a.date))[0];

    if (!lastTransaction) return null;

    const lastDate = new Date(lastTransaction.date);
    const diffTime = Math.abs(currentDate - lastDate);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

// Helper function to calculate total spend for a category in the last 30 days
function totalSpendLast30Days(transactions, category, currentDate) {
    const thirtyDaysAgo = new Date(currentDate);
    thirtyDaysAgo.setDate(currentDate.getDate() - 30);

    return transactions
        .filter(t => t.category === category && new Date(t.date) >= thirtyDaysAgo && new Date(t.date) < currentDate)
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);
}

// Extract features for each transaction
function extractFeaturesForTransactions(transactions) {
    return transactions.map((transaction, index) => {
        const currentDate = new Date(transaction.date);

        const daysSinceLastTransport = daysSinceLastPurchase(transactions.slice(0, index), 'Transport', currentDate);
        const daysSinceLastGrocery = daysSinceLastPurchase(transactions.slice(0, index), 'Groceries', currentDate);
        const totalUberSpend = totalSpendLast30Days(transactions.slice(0, index), 'Uber', currentDate);
        const totalGrocerySpend = totalSpendLast30Days(transactions.slice(0, index), 'Groceries', currentDate);

        // Placeholder for overspend risk calculation
        const overspendRisk = calculateOverspendRisk(transactions.slice(0, index), currentDate);

        // Transaction type indicators
        const transactionTypeUber = transaction.description.includes('Uber') ? 1 : 0;
        const transactionTypeGrocery = transaction.category === 'Groceries' ? 1 : 0;
        const transactionTypeRestaurant = transaction.category === 'Restaurants' ? 1 : 0;

        // Placeholder for spending shift calculation
        const spendingShift = calculateSpendingShift(transactions.slice(0, index), currentDate);

        // Encode category
        const encodedCategory = categoryEnum[transaction.category] !== undefined ? categoryEnum[transaction.category] : -1;

        return {
            amount: transaction.amount,
            time: currentDate.getTime(), // Convert to epoch time
            encodedCategory,
            daysSinceLastTransport,
            daysSinceLastGrocery,
            totalUberSpend,
            totalGrocerySpend,
            overspendRisk,
            transactionTypeUber,
            transactionTypeGrocery,
            transactionTypeRestaurant,
            spendingShift
        };
    });
}

// Placeholder functions for overspend risk and spending shift
function calculateOverspendRisk(transactions, currentDate) {
    // Implement logic to calculate overspend risk
    return 0; // Placeholder value
}

function calculateSpendingShift(transactions, currentDate) {
    // Implement logic to calculate spending shift
    return 0; // Placeholder value
}

// Extract transactions from the data
const transactions = data.transactions;

// Extract features for each transaction
const features = extractFeaturesForTransactions(transactions);

// Convert features to CSV
const csvFields = [
    'amount',
    'time',
    'encodedCategory',
    'daysSinceLastTransport',
    'daysSinceLastGrocery',
    'totalUberSpend',
    'totalGrocerySpend',
    'overspendRisk',
    'transactionTypeUber',
    'transactionTypeGrocery',
    'transactionTypeRestaurant',
    'spendingShift'
];
const csv = parse(features, { fields: csvFields });

// Write CSV to file
const outputCsvPath = path.join(__dirname, 'transaction_features.csv');
fs.writeFileSync(outputCsvPath, csv);

console.log('CSV file successfully created with extracted features.');
