import InnerHeader from "@/components/InnerHeader";
import { ApiResponse } from "@/type/index";
import NotFound from "./not-found";
import { helperCallApi } from "./utils/helperCallApi";
import ArticleList from "@/components/ArticleList";

const Page = async () => {
  let postData: ApiResponse = { list: [] };
  try {
    postData = await helperCallApi();
  } catch (error) {
    return <NotFound />;
  }

  return (
    <>
      <InnerHeader title={`The Latest Article`} />
      <ArticleList postData={postData} />
    </>
  );
};

export default Page;
