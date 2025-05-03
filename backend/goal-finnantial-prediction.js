const {QueryCommand, DynamoDBDocumentClient} = require("@aws-sdk/lib-dynamodb");
const {DynamoDBClient} = require("@aws-sdk/client-dynamodb");

module.exports = {
    getSpendingDataPoints
};


const MS_PER_DAY = 24 * 60 * 60 * 1000;
const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);
const TABLE_TRANSACTIONS = process.env.TABLE_TRANSACTIONS;



/**
 * should return data point based on transaction history
 * @param startFrom transactions from time.
 * @param summary_interval number in days for aggregation.
 * @return {
 *     summary:{}
 *
 *     data:{
 *     interval: 10
 *     points: [
 *         {0 :{credit: 123
 *         debit: 11},
 *         {1 :{credit: 11
 *         debit: 10}}}
 *     ]}
 * }
 */
const getSpendingDataPoints = async (userId, startFrom, summary_interval) => {
    if (!userId || !startFrom) {
        throw new Error('Missing required parameters');
    }

    try {
        const result = await docClient.send(new QueryCommand({
            TableName: TABLE_TRANSACTIONS,
            KeyConditionExpression: "userId = :userId",
            FilterExpression: "createdAt >= :startDate",
            ExpressionAttributeValues: {
                ":userId": userId,
                ":startDate": startFrom.toISOString()
            }
        })) || [];
        const dataPoitns = mapTransactionToDataPoints(result, startFrom, summary_interval);

        return {
            interval: summary_interval,
            dataPoitns
        };
    } catch (error) {
        console.error('Error getting spending data points:', error);
        throw new Error('Failed to retrieve spending data points');
    }
};

function mapTransactionToDataPoints(transactions, startFrom, summary_interval) {

    const intervalMap = transactions.reduce((acc, transaction) => {
        const txDate = new Date(transaction.createdAt);
        const intervalIndex = Math.floor((txDate - startFrom) / (MS_PER_DAY * summary_interval));

        if (!acc[intervalIndex]) {
            acc[intervalIndex] = {credit: 0, debit: 0};
        }

        if (transaction.amount > 0) {
            acc[intervalIndex].credit += transaction.amount;
        } else {
            acc[intervalIndex].debit += Math.abs(transaction.amount);
        }

        return acc;
    }, {});

    const dataPoints = Object.keys(intervalMap).sort((a, b) => a - b)
        .map(index => ({[index]: intervalMap[index]}));
    return dataPoints;
}
