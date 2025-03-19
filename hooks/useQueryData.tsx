import { useQuery } from "@tanstack/react-query";

const getData = async () => {
  const response = await fetch(
    "https://api.memexdata.io/memex/api/projects/0e9c148b/models/blog/contents/search/v2",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Access-Token":
          "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJSRUJFTDkiLCJpYXQiOjE3Mzk3NzcxMzUsImV4cCI6MjA1NTEzNzEzNSwiSUQiOiIwZTljMTQ4YiIsIkRPTUFJTiI6WyIqIl0sIlRZUEUiOiJFWFRFUk5BTCJ9.i-PuX7QzNpJiqncP06Tc5FyDbFpAg11D-W5csSTdRkg",
        "X-Forwarded-Host": "localhost:3000",
      },

      body: JSON.stringify({
        size: 20,
        page: 0,
        direction: "DESC",
        orderCond: {
          type: "DATE_CREATE",
        },
      }),
    }
  );

  return await response.json();
};

const useQueryData = ({ queryKeyName }: { queryKeyName: string[] }) => {
  const {
    isPending,
    error,
    data: postData,
    isFetching,
  } = useQuery({
    queryKey: queryKeyName,
    queryFn: getData,
  });

  return { isPending, error, postData, isFetching };
};

export default useQueryData;
