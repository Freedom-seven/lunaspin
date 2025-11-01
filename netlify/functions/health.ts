export const handler = async () => {
  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
    },
    body: JSON.stringify({
      status: "healthy",
      timestamp: new Date().toISOString(),
      functions: "working",
      message: "Netlify functions are operational",
    }),
  };
};
