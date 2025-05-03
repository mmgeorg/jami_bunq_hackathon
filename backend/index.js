const {DynamoDBClient} = require('@aws-sdk/client-dynamodb');
const {
    DynamoDBDocumentClient,
    PutCommand,
    GetCommand,
    DeleteCommand,
    UpdateCommand,
    ScanCommand,
    QueryCommand
} = require('@aws-sdk/lib-dynamodb');

const {v4: uuidv4} = require('uuid');
const {goalOverview} = require("./goal-finantial-prediction");

const api = require('lambda-api')({
    version: 'v1',
    base: '/',
    cors: true
});

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);
const TABLE_NAME = process.env.TABLE_NAME;

// Get user info
api.get('/user/:id/goals', async (req, res) => {
    try {
        const params = {
            TableName: TABLE_NAME,
            Key: {
                userId: req.params.id
            }
        };

        const result = await docClient.send(new GetCommand(params));
        return res.status(200).json(result.Item || {});
    } catch (error) {
        console.error('Error getting user goals:', error);
        return res.status(500).json({
            message: 'Error getting user goals',
            error: error.message
        });
    }
});

api.get('/user/:id/goals/:name', async (req, res) => {
    try {
        const params = {
            TableName: TABLE_NAME,
            Key: {
                userId: req.params.id
            }
        };

        const {Item} = await docClient.send(new GetCommand(params));
        const result = await goalOverview(Item, req.params.name)
        return res.status(200).json(result || {});
    } catch (error) {
        console.error('Error getting user goals:', error);
        return res.status(500).json({
            message: 'Error getting user goals',
            error: error.message
        });
    }
});


api.get('/user/:id/dashboard', async (req, res) => {
    try {
        const params = {
            TableName: TABLE_NAME,
            Key: {
                userId: req.params.id
            }
        };

        const {Item: data} = await docClient.send(new GetCommand(params));

        const monthlyTotal = Object.entries(data.summary.monthlyTotals)
            .sort((a, b) => new Date(a[0]) - new Date(b[0]))

        const savingPairs = Object.entries(data.monthlyBudget.spend);
        const latestMonth = monthlyTotal.at(-1)[1]
        const previousMonth = monthlyTotal.at(-2)[1]
        const mainGoal = Object.keys(data.goals)[0]
        const result = {
            // Basic financial metrics
            monthlySavings: Math.round(latestMonth.savings) ,
            savingsChange:  Math.round(latestMonth.savings - previousMonth.savings)|| 902,
            totalSpending: Math.round(latestMonth.expenses) || 903,
            spendingChangePercent: Math.round(latestMonth.expenses / previousMonth.expenses * 100) - 100 || 904,
            goalProgressPercent: Math.round(latestMonth.balance / data.goals[mainGoal].target_amount  * 100),
            goalLabel: mainGoal,
            portfolioValue: 6300,
            portfolioGrowthPercent: 7,

            // Chart data for spending categories
            spendingBarData: {
                labels: savingPairs.map((pair) => pair[0]) || [],
                datasets: {
                    label: "Spending",
                    data: savingPairs
                        .map((pair) => Object.entries(pair[1]))
                        .sort((a, b) => new Date(a[0]) - new Date(b[0]))
                        .map((array) => array.at(-1)[1])
                        .map(n => Math.round(n))

                }
            },

            savingsLineData: {
                labels: monthlyTotal.slice(-6).map((pair) => pair[0]) || [],
                datasets: {
                    label: "Monthly Savings",
                    data: monthlyTotal.slice(-6)
                        .map(sum => sum[1].savings)
                        .map(n => Math.round(n))
                }
            },
        };


        return res.status(200).json(result || {});
    } catch (error) {
        console.error('Error getting user goals:', error);
        return res.status(500).json({
            message: 'Error getting user goals',
            error: error.message
        });
    }
});


// Create a new item
api.post('/user/:id/goals', async (req, res) => {
    try {
        const data = req.body;
        const userId = req.params.id;

        // Generate a UUID for the goal
        const item = {
            userId: userId,
            ...data,
            createdAt: new Date().toISOString()
        };

        const params = {
            TableName: TABLE_NAME,
            Item: item
        };

        await docClient.send(new PutCommand(params));
        return res.status(201).json(item);
    } catch (error) {
        console.error('Error creating item:', error);
        return res.status(500).json({
            message: 'Error creating item',
            error: error.message
        });
    }
});

// Lambda handler
exports.handler = async (event, context) => {
    console.log('Event:', JSON.stringify(event, null, 2));
    // Process the API request
    return await api.run(event, context);
};
