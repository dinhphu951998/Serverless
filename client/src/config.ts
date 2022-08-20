export const apiId = process.env.REACT_APP_API_ID
export const stage = process.env.REACT_APP_STAGE

console.log(process.env)

export const apiEndpoint = `https://${apiId}.execute-api.us-east-1.amazonaws.com/${stage}`
