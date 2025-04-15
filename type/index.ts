export interface ApiResponse {
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

export interface ApiResponseError {
  error: string;
  status: number;
  message: string;
}
