export interface ApiItem {
  title: string;
  content: string;
  slug: string;
  tag: string;
  createdAt: string;
}

export interface TagListProps extends TagsProps {
  tagNames: string[];
}

export interface TagsProps {
  currTag: string;
}
