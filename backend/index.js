const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { 
  DynamoDBDocumentClient, 
  PutCommand, 
  GetCommand, 
  DeleteCommand, 
  UpdateCommand, 
  ScanCommand,
  QueryCommand
} = require('@aws-sdk/lib-dynamodb');

const { v4: uuidv4 } = require('uuid');

const api = require('lambda-api')({
  version: 'v1',
  base: '/',
  cors: true
});

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);
const TABLE_NAME = process.env.TABLE_NAME;

// Get all goals for a specific user
api.get('/user/:id/goals', async (req, res) => {
  try {
    const userId = req.params.id;
    
    const params = {
      TableName: TABLE_NAME,
      KeyConditionExpression: "userId = :userId",
      ExpressionAttributeValues: {
        ":userId": userId
      }
    };
    
    const result = await docClient.send(new QueryCommand(params));
    return res.status(200).json(result);
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
