import InnerHeader from "@/components/Layout/InnerHeader";
import { ApiResponse } from "@/type/index";
import NotFound from "./not-found";
import { helperCallApi } from "./utils/helperCallApi";
import MainArticleList from "@/components/MainArticleList";

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
      <MainArticleList postData={postData} />
    </>
  );
};

export default Page;
