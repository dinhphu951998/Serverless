import { S3Event, SNSEvent, SNSHandler } from "aws-lambda";
import * as AWS from "aws-sdk";

const docClient = new AWS.DynamoDB.DocumentClient();

const connectionTable = process.env.CONNECTION_TABLES;
const stage = process.env.STAGE;
const region = process.env.REGION;
const apiId = process.env.API_ID;

const connectionParams = {
  apiVersion: "2018-11-29",
  endpoint: `${apiId}.execute-api.${region}.amazonaws.com/${stage}`,
};

const apiGateway = new AWS.ApiGatewayManagementApi(connectionParams);

export const handler: SNSHandler = async (event: SNSEvent) => {
  console.log('Processing SNS event ', JSON.stringify(event))
  for (const snsRecord of event.Records) {
    const s3EventStr = snsRecord.Sns.Message
    console.log('Processing S3 event', s3EventStr)
    const s3Event = JSON.parse(s3EventStr)

    await processS3Event(s3Event)
  }
}

export const processS3Event = async (event: S3Event) => {
  for (const record of event.Records) {
    const key = record.s3.object.key;

    const item = {
      imageId: key,
    };

    console.log("Record: ", record);
    console.log("Processing S3 item with key: ", key);

    const connectionResult = await docClient
      .scan({
        TableName: connectionTable,
      })
      .promise();

    for (const con of connectionResult.Items) {
      await sendMessageToClient(con.connectionId, item);
    }
  }
};

async function sendMessageToClient(connectionId, payload) {
  try {
    console.log("Sending message to connection", connectionId);
    await apiGateway
      .postToConnection({
        ConnectionId: connectionId,
        Data: JSON.stringify(payload),
      })
      .promise();
  } catch (error) {
    console.log("Failed to send message", JSON.stringify(error));
    if (error.statusCode === 410) {
      console.log("Stale connection");

      await docClient
        .delete({
          TableName: connectionTable,
          Key: {
            connectionId,
          },
        })
        .promise();
    }
  }
}
