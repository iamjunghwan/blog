export interface PostData {
  uid: string;
  createdAt: string;
  data: {
    slug: string;
    content: string;
    title: {
      KO: string;
    };
  };
}
