const API_URL =
  "https://api.memexdata.io/memex/api/projects/0e9c148b/models/blog/contents/search/v2";
const API_TOKEN =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJSRUJFTDkiLCJpYXQiOjE3Mzk3NzcxMzUsImV4cCI6MjA1NTEzNzEzNSwiSUQiOiIwZTljMTQ4YiIsIkRPTUFJTiI6WyIqIl0sIlRZUEUiOiJFWFRFUk5BTCJ9.i-PuX7QzNpJiqncP06Tc5FyDbFpAg11D-W5csSTdRkg";

export async function callApi() {
  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Access-Token": API_TOKEN,
      },
      cache: "force-cache",
      body: JSON.stringify({
        size: 20,
        page: 0,
        direction: "DESC",
        orderCond: {
          type: "DATE_CREATE",
        },
      }),
    });

    if (!response.ok) {
      throw {
        message: `Server Error ${response.status}`,
        status: response.status,
        error: "UNKNOWN_SERVER_ERROR",
      };
    }

    return await response.json();
  } catch (error) {
    const errorObj = error;
    return errorObj;
  }
}
