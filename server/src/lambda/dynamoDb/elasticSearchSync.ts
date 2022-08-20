import { DynamoDBStreamEvent, DynamoDBStreamHandler } from "aws-lambda";
import * as elasticsearch from "elasticsearch";
import * as httpAwsEs from "http-aws-es";

const esHost = process.env.ES_ENDPOINT;

const es = new elasticsearch.Client({
  hosts: [esHost],
  connectionClass: httpAwsEs,
});
 
export const handler: DynamoDBStreamHandler = async (
  event: DynamoDBStreamEvent
) => {
  console.log("Processing dynamodb stream", JSON.stringify(event));

  for (const record of event.Records) {

    const newImage = record.dynamodb.NewImage
    const imageId = newImage.imageId.S;
    const title = newImage.title.S;
    const imageUrl = newImage.imageUrl.S;

    await es.index({
        index: "images-index",
        type: "images",
        id: imageId, // Document ID
        body: {
          // Document to store
          title: title,
          imageUrl: imageUrl,
        },
      });

    console.log("Processing record: ", JSON.stringify(record));
  }
};
