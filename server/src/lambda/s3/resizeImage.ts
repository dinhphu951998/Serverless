import { S3Event, S3EventRecord, SNSEvent, SNSHandler } from "aws-lambda";
import * as AWS from "aws-sdk";
import Jimp from 'jimp/es'

const s3 = new AWS.S3({
  signatureVersion: "v4", // Use Sigv4 algorithm
});

const imageBucket = process.env.IMAGE_BUCKET;
const thumbnailBucket = process.env.THUMBNAILS_S3_BUCKET;

export const handler: SNSHandler = async (event: SNSEvent) => {
  console.log("Processing SNS event ", JSON.stringify(event));
  for (const snsRecord of event.Records) {
    const s3EventStr = snsRecord.Sns.Message;
    console.log("Processing S3 event", s3EventStr);
    const s3Event: S3Event = JSON.parse(s3EventStr);

    for (const record of s3Event.Records) {
      // "record" is an instance of S3EventRecord
      await processImageAsync(record); // A function that should resize each image
    }
  }
};

async function processImageAsync(record: S3EventRecord) {
  const key = record.s3.object.key;
  console.log("Download image", key)
  const body: string = await downloadImageAsync(key);

  console.log("Resize image", key)
  // Read an image with the Jimp library
  const image = await Jimp.read(body);
  // Resize an image maintaining the ratio between the image's width and height
  image.resize(150, Jimp.AUTO);
  // Convert an image to a buffer that we can write to a different bucket
  const convertedBuffer = await image.getBufferAsync(Jimp.AUTO);

  console.log("Upload image", key)
  await uploadImageAsync(convertedBuffer, key);
}

async function downloadImageAsync(key: string) {
  const response = await s3
    .getObject({
      Bucket: imageBucket,
      Key: key,
    })
    .promise();

  return response.Body as string;
}

async function uploadImageAsync(imageBuffer: Buffer, key: string) {
  await s3
    .putObject({
      Bucket: thumbnailBucket,
      Key: `${key}.jpeg`,
      Body: imageBuffer,
    })
    .promise();
}
