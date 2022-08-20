import {
  APIGatewayProxyHandler,
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
} from "aws-lambda";
import * as AWS from "aws-sdk";

const docClient = new AWS.DynamoDB.DocumentClient();

const connectionTable = process.env.CONNECTION_TABLES;

export const handler: APIGatewayProxyHandler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  console.log("Websocket disconnect: ", event);

  const connectionId = event.requestContext.connectionId;

  await docClient
    .delete({
      TableName: connectionTable,
      Key: {
        connectionId,
      },
    })
    .promise();

  return {
    statusCode: 200,
    body: "",
  };
};
