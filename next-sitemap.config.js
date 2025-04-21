const { callApi } = require("./scripts/callApiForCommonjs");

/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: "https://iaman.kr",
  generateRobotsTxt: true, // (optional)
  sitemapSize: 7000,
  lastmod: true,

  additionalPaths: async (config) => {
    const result = await callApi();

    return result.list.map((obj) => ({
      loc: `/${obj.data.slug}`,
      lastmod: `${obj.data.date}`,
    }));
  },
};
