export const getErrorMessage = (error: any): string => {
  if (error.code === "ECONNABORTED") {
    return "The server is waking up — this can take up to a minute on the first request. Please try again shortly.";
  }

  if (!error.response) {
    return "Can't reach the server. Check your internet connection and try again.";
  }

  return (
    error.response?.data?.message || "Something went wrong. Please try again."
  );
};
