import { helperCallApi } from "../utils/helperCallApi";

export const generateStaticParams = async () => {
  try {
    const data = await helperCallApi();
    // console.log(data.list.map((obj) => ({ slug: obj.data.slug })));
    return data.list.map((obj) => ({ slug: obj.data.slug }));
  } catch (error) {
    console.log("building error in generateStaticParams", error);
    return [];
  }
};

// 페이지네이션을 위한 generateStaticParams
export const generateStaticParamsWithPagination = async () => {
  try {
    const data = await helperCallApi();
    const pageSize = 5;
    const totalPages = Math.ceil(data.list.length / pageSize);

    const params = [];

    // 모든 slug에 대해 페이지 조합 생성
    for (let page = 1; page <= totalPages; page++) {
      params.push({ slug: "all", page: page.toString() });
    }

    // 개별 slug들에 대해서도 페이지 조합 생성 (필요한 경우)
    // 예: javascript, react 등 태그별 페이지
    const uniqueSlugs = [
      ...new Set(data.list.flatMap((item) => item.data.tags)),
    ];

    for (const slug of uniqueSlugs) {
      const filteredData = data.list.filter((item) =>
        item.data.tags.includes(slug)
      );
      const slugPages = Math.ceil(filteredData.length / pageSize);

      for (let page = 1; page <= slugPages; page++) {
        params.push({ slug, page: page.toString() });
      }
    }

    console.log("Generated params:", params);
    return params;
  } catch (error) {
    console.log("building error in generateStaticParamsWithPagination", error);
    return [];
  }
};
