const {QueryCommand, DynamoDBDocumentClient} = require("@aws-sdk/lib-dynamodb");
const {DynamoDBClient} = require("@aws-sdk/client-dynamodb");
const dayjs = require("dayjs");
const { prompt } = require('./openai');

const NUMBER_MONTH_PAST = 5;
const NUMBER_MONTH_FUTURE = 3;
const SUMMARY_INTERVAL = 20;

function generatePrompt(data, goalName, time_months, goalAmount) {
    const userPrompt = {
        goal: goalName,
        goal_amount: goalAmount,
        target_date: time_months,
        budget: data.budget,
        balance: data.balance,
        investments: data.investments
    };

    return `
Given the following data:

\`\`\`json
${JSON.stringify(userPrompt, null, 2)}
\`\`\`

Suggest:
1. Two budget categories to reduce to meet the savings goal in the given time.
2. If applicable, suggest how investing some or all of the balance could help reach the goal faster.

Return the output as JSON with these keys:
- "monthly_saving_needed"
- "budget_deductions" (two items, with "category" and "monthly_reduction")
- "investment_suggestion" (include "suggested_amount", "target_instrument", "estimated_return")

Respond only with raw JSON, not as a string or with escape characters. Use valid numbers. Do not format it as code or include extra characters like backticks.

`;
}


const getMonthLabels = () => {
    const labels = [];
    const currentDate = dayjs();

    for (let i = NUMBER_MONTH_PAST - 1; i >= -NUMBER_MONTH_FUTURE; i--) {
        labels.push(currentDate.subtract(i, 'month').format('MMM-YYYY'));
    }
    return labels;
};

const goalOverview = async (userInfo, goalName) => {
    const transactions = userInfo.transactions;
    const currentDate = dayjs();

    const gptPrompt = generatePrompt(
        userInfo.summary,
        goalName,
        userInfo.goals[goalName].target_date,
        userInfo.goals[goalName].target_amount
    );

    const gptResponse = await prompt(gptPrompt);
    const pastDataPoints = mapTransactionToDataPoints(
        transactions,
        currentDate.subtract(NUMBER_MONTH_PAST - 1, "month")
    ).map((value) => Math.round(value * 100) / 100);

    pastDataPoints.push(null, null, null); // match future length

    const futurePoints = new Array(NUMBER_MONTH_FUTURE + NUMBER_MONTH_PAST).fill(null);
    futurePoints[NUMBER_MONTH_PAST - 1] = pastDataPoints[NUMBER_MONTH_PAST - 1];

    // Parse GPT response
    let parsedResponse;
    if (typeof gptResponse === "string") {
        parsedResponse = JSON.parse(gptResponse);
    } else {
        parsedResponse = gptResponse;
    }

    const { monthly_saving_needed, budget_deductions, investment_suggestion } = parsedResponse;
    const colors = ["#43a047", "#fb8c00", "#8e24aa"];

    const projections = {};

    // Add budget deduction-based projections
    budget_deductions.forEach((deduction, index) => {
        const futureProjection = [...futurePoints];
        for (let i = NUMBER_MONTH_PAST; i < futureProjection.length; i++) {
            if (futureProjection[i - 1] !== null) {
                futureProjection[i] = futureProjection[i - 1] + deduction.monthly_reduction;
            }
        }

        projections[index] = {
            label: deduction.category,
            color: colors[index % colors.length],
            past: pastDataPoints,
            future: futureProjection.map((value) => Math.round(value * 100) / 100),
        };
    });

    // Add investment suggestion
    const investmentFutureProjection = [...futurePoints];
    for (let i = NUMBER_MONTH_PAST; i < investmentFutureProjection.length; i++) {
        if (investmentFutureProjection[i - 1] !== null) {
            investmentFutureProjection[i] = investmentFutureProjection[i - 1] + monthly_saving_needed;
        }
    }

    const nextKey = Object.keys(projections).length.toString();
    projections[nextKey] = {
        label: investment_suggestion.target_instrument,
        color: colors[2],
        past: pastDataPoints,
        future: investmentFutureProjection,
    };

    return {
        goal: goalName,
        amountSaved: 4000,
        targetAmount: userInfo.goals[goalName].target_amount,
        labels: [...getMonthLabels()],
        current: {
            label: "Current Projection",
            color: "#1e88e5",
            past: pastDataPoints,
            future: futurePoints,
        },
        projections,
    };
};



function mapTransactionToDataPoints(transactions, startFrom) {
    let balance = 0;
    let result = transactions
        .reduce((acc, transaction) => {
            const txDate = dayjs(transaction.date);
            const monthDiff = txDate.diff(startFrom, 'month');
            if (dayjs(transaction.date).isBefore(startFrom)) {
                balance += transaction.amount;
                return acc || [];
            }

            if (!acc[monthDiff]) {
                acc[monthDiff] = 0;
            }

            acc[monthDiff] += transaction.amount;
            return acc;
        }, []);

    result = [balance || 0, ...result];
    for (let i = 1; i < result.length; i++) {
        result[i] = result[i] + result[i - 1];
    }
    return result;
}


module.exports = {
    goalOverview
};
