import { ApiGatewayManagementApiClient, PostToConnectionCommand } from "@aws-sdk/client-apigatewaymanagementapi";

export const handler = async (event) => {
    const { connectionId, domainName, stage } = event.requestContext;

    const endpoint = "https://yf1ofdl8u0.execute-api.eu-central-1.amazonaws.com/production";
    const client = new ApiGatewayManagementApiClient({ endpoint });

    const message = {
        message: "Hello from Lambda!"
    };

    try {
        const command = new PostToConnectionCommand({
            ConnectionId: connectionId,
            Data: Buffer.from(JSON.stringify(message))
        });

        await client.send(command);
    } catch (err) {
        console.error("Failed to send:", err);
        return { statusCode: 500 };
    }

    return { statusCode: 200 };
};
