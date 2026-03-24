import Ably from "ably";

export async function handler() {
  try {
    const client = new Ably.Rest(process.env.ABLY_API_KEY);

    const tokenRequest = await client.auth.createTokenRequest({
      clientId: Math.random().toString(36)
    });

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },
      body: JSON.stringify(tokenRequest)
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: err.toString()
    };
  }
}
