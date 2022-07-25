import {
  APIGatewayProxyHandler,
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
} from "aws-lambda";
import "source-map-support/register";
import * as AWS from "aws-sdk";
import * as uuid from "uuid";

const docClient = new AWS.DynamoDB.DocumentClient();

const groupsTable = process.env.GROUPS_TABLE;
const imagesTable = process.env.IMAGES_TABLE;
const imageBucket = process.env.IMAGE_BUCKET;
const expirationTime = process.env.PRESIGNED_URL_EXPIRATION;

const s3 = new AWS.S3({
  signatureVersion: "v4", // Use Sigv4 algorithm
});

export const handler: APIGatewayProxyHandler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  console.log("Caller event", event);
  const groupId = event.pathParameters.groupId;
  const validGroupId = await groupExists(groupId);

  if (!validGroupId) {
    return {
      statusCode: 404,
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        error: "Group does not exist",
      }),
    };
  }

  const imageId = uuid.v4();
  const newItem = await createImage(groupId, imageId, event);
  const presignedUrl = getPresignedUrl(imageId);

  return {
    statusCode: 201,
    headers: {
      "Access-Control-Allow-Origin": "*",
    },
    body: JSON.stringify({
      newItem: newItem,
      uploadUrl: presignedUrl,
    }),
  };
};

async function groupExists(groupId: string) {
  const result = await docClient
    .get({
      TableName: groupsTable,
      Key: {
        id: groupId,
      },
    })
    .promise();

  console.log("Get group: ", result);
  return !!result.Item;
}

async function createImage(groupId: string, imageId: string, event: any) {
  const timestamp = new Date().toISOString();
  const newImage = JSON.parse(event.body);

  const newItem = {
    groupId,
    timestamp,
    imageId,
    ...newImage,
    imageUrl: `https://${imageBucket}.s3.amazonaws.com/${imageId}`,
  };
  console.log("Storing new item: ", newItem);

  await docClient
    .put({
      TableName: imagesTable,
      Item: newItem,
    })
    .promise();

  return newItem;
}

function getPresignedUrl(imageId: string) {
  const presignedUrl = s3.getSignedUrl("putObject", {
    // The URL will allow to perform the PUT operation
    Bucket: imageBucket, // Name of an S3 bucket
    Key: imageId, // id of an object this URL allows access to
    Expires: expirationTime, // A URL is only valid for 5 minutes
  });
  return presignedUrl;
}
