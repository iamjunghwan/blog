export interface ApiItem {
  uid: string;
  createdAt: string;
  data: {
    slug: string;
    content: string;
    title: {
      KO: string;
    };
    tags: string;
  };
}

export interface ApiResponse {
  list: ApiItem[];
}

export interface ApiResponseError {
  error: string;
  status: number;
  message: string;
}

export interface TagListProps extends TagsProps {
  tagNames: string[];
}

export interface TagsProps {
  currTag: string;
}
