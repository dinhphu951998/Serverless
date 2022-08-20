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
  console.log("Websocket connect: ", event);

  const connectionId = event.requestContext.connectionId;
  const timestamp = new Date().toISOString();

  const newItem = {
    connectionId,
    timestamp,
  };
  console.log("Connection item: ", newItem);

  try {
    await docClient
      .put({
        TableName: connectionTable,
        Item: newItem,
      })
      .promise();
  } catch (error) {
    console.log("Error to save connection: ", JSON.stringify(error));
  }

  return {
    statusCode: 200,
    body: "",
  };
};
