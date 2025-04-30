import { callApi } from "../utils/callApi";

export const generateStaticParams = async () => {
  try {
    const data = await callApi();
    if ("error" in data) {
      throw new Error("Failed to fetch posts");
    }
    return data.list.map((obj) => ({ slug: obj.data.slug }));
  } catch (error) {
    console.log("building error in generateStaticParams", error);
    return [];
  }
};
