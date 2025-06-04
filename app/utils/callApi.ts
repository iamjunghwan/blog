// import { ApiResponse, ApiResponseError } from "@/type/index";
// const API_URL =
//   "https://api.memexdata.io/memex/api/projects/0e9c148b/models/blog/contents/search/v2";

// export async function callApi(): Promise<ApiResponse | ApiResponseError> {
//   try {
//     const response = await fetch(API_URL, {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//         "Access-Token": `${process.env.API_TOKEN}`,
//       },

//       body: JSON.stringify({
//         size: 20,
//         page: 0,
//         direction: "DESC",
//         orderCond: {
//           type: "DATE_CREATE",
//         },
//       }),
//     });

//     if (!response.ok) {
//       throw {
//         message: `Server Error ${response.status}`,
//         status: response.status,
//         error: "UNKNOWN_SERVER_ERROR",
//       };
//     }

//     return await response.json();
//   } catch (error: unknown) {
//     const errorObj = error as ApiResponseError;
//     return errorObj;
//   }
// }
