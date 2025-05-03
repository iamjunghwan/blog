import { helperCallApi } from "../utils/helperCallApi";

export const generateStaticParams = async () => {
  try {
    const data = await helperCallApi();

    return data.list.map((obj) => ({ slug: obj.data.slug }));
  } catch (error) {
    console.log("building error in generateStaticParams", error);
    return [];
  }
};
