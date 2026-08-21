import TagList from "./TagList";
import { allPosts } from "@/app/lib/posts/repository";
import { allTags } from "@/app/lib/posts/queries";

const Tags = ({ currTag }: { currTag: string }) => {
  return <TagList currTag={currTag} tagNames={allTags(allPosts())} />;
};

export default Tags;
