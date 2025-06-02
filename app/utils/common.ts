export const check = (htmlString: string): string => {
  const regex = /<img[^>]*>/;
  const firstImageTag = htmlString.match(regex);
  if (firstImageTag === null) {
    return "/iaman.png";
  }

  const regex2 = /<img[^>]+src=["']([^"']+)["']/;
  const match = firstImageTag[0].match(regex2);

  if (match) {
    const srcValue = match[1];
    return "/" + srcValue;
  } else {
    return "/iaman.png";
  }
};
