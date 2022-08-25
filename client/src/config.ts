
export const apiId = process.env.REACT_APP_API_ID
export const stage = process.env.REACT_APP_STAGE

console.log(process.env)

export const apiEndpoint = `https://${apiId}.execute-api.us-east-1.amazonaws.com/${stage}`

export const authConfig = {
  domain: 'dev-mp9ket6w.us.auth0.com',
  clientId: '8LnhRxZ0IEmLbJhxb8Q3eGBUkdTo21fl',
  callbackUrl: 'http://localhost:3000/callback'
}
