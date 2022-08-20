import * as elasticsearch from "elasticsearch";
import * as httpAwsEs from "http-aws-es";

const esHost = process.env.ES_ENDPOINT;

export const handler = async () => {
  const es = new elasticsearch.Client({
    hosts: [esHost],
    connectionClass: httpAwsEs,
  });

  await es.index({
    index: "images-index",
    type: "images",
    id: "id", // Document ID
    body: {
      // Document to store
      title: "title",
      imageUrl: "https://example.com/image.png",
    },
  });
};
