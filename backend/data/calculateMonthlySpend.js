const fs = require('fs');
const path = require('path');

// Load the JSON data from the file
const dataPath = path.join(__dirname, 'combined.json');
const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

// Function to calculate monthly spend and income
function calculateMonthlyBudget(transactions) {
    const monthlySpend = {};
    const monthlyIncome = {};
    transactions.forEach(transaction => {
        const date = new Date(transaction.date);
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const amount = transaction.amount;
        const budgetGroup = transaction.budget_group || 'Income';

        if (!monthlySpend[budgetGroup]) monthlySpend[budgetGroup] = {};
        if (!monthlyIncome['Income']) monthlyIncome['Income'] = {};

        const monthKey = `${year}-${month}`;

        if (amount < 0) {
            monthlySpend[budgetGroup][monthKey] = (monthlySpend[budgetGroup][monthKey] || 0) + Math.abs(amount);
        } else {
            monthlyIncome['Income'][monthKey] = (monthlyIncome['Income'][monthKey] || 0) + amount;
        }
    });

    return { monthlySpend, monthlyIncome };
}

// Function to calculate budget summary
function calculateBudgetSplit(result) {
    let spendData = result.monthlySpend;
    const budget = {};
    const allMonths = new Set();

    for (const category in spendData) {
        if (category !== 'Income') {
            const entries = Object.values(spendData[category]);
            const total = entries.reduce((sum, val) => sum + val, 0);
            const average = total / entries.length;
            budget[category] = parseFloat(average.toFixed(2));
            Object.keys(spendData[category]).forEach(month => allMonths.add(month));
        }
    }

    Object.keys(result.monthlyIncome).forEach(month => allMonths.add(month));
    const sortedMonths = Array.from(allMonths).sort();

    const report = {};
    let balance = 0;

    for (const month of sortedMonths) {
        let totalSpend = 0;

        for (const category in spendData) {
            if (category !== 'Income') {
                totalSpend += spendData[category][month] || 0;
            }
        }

        const currentIncome = result.monthlyIncome.Income[month] || 0;
        const savings = currentIncome - totalSpend;
        balance += savings;

        report[month] = {
            income: +currentIncome.toFixed(2),
            expenses: +totalSpend.toFixed(2),
            savings: +savings.toFixed(2),
            balance: +balance.toFixed(2)
        };
    }

    return {
        budget: budget,
        balance: balance,
        monthlyTotals: report
    };
}

// Extract transactions from the data
const transactions = data.transactions;

// Step 1: Initial calculation (before adding fake transactions)
const result = calculateMonthlyBudget(transactions);
const budgetSplit = calculateBudgetSplit(result);

// Step 2: Evenly distribute €11,000 in fake spending
const allMonthsSorted = Object.keys(budgetSplit.monthlyTotals).sort();
const totalFakeSpending = 11000;
const amountPerMonth = +(totalFakeSpending / allMonthsSorted.length).toFixed(2);

allMonthsSorted.forEach(month => {
    if(month != 'Income')
    {
        const [year, rawMonth] = month.split('-');
        const monthNum = rawMonth.toString().padStart(2, '0');
        const date = `${year}-${monthNum}-15`;

        console.log(rawMonth)
        const fakeTransaction = {
            date,
            description: 'Trading 212',
            amount: -amountPerMonth,
            budget_group: 'MISC',
            category: 'Transfer',
        };

        data.transactions.push(fakeTransaction);
    }
});

// Step 3: Recalculate everything with new data
const resultAfterFake = calculateMonthlyBudget(data.transactions);
const budgetSplitAfterFake = calculateBudgetSplit(resultAfterFake);

// Step 4: Add updated results to data and write to file
data.monthlyBudget = {
    spend: resultAfterFake.monthlySpend,
    income: resultAfterFake.monthlyIncome,
    summary: budgetSplitAfterFake
};

fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
console.log('Fake spending of €11,000 injected and budget recalculated.');

console.log(JSON.stringify(data, null, 2));
