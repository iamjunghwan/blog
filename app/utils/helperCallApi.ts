import { callApi } from "./callApi";
import { ApiResponse } from "@/type/index";

export async function helperCallApi(): Promise<ApiResponse> {
  const result = await callApi();

  if (!("list" in result)) {
    throw new Error("Invalid API response: missing 'list'");
  }

  return result;
}
