import serverless from "serverless-http";
import { createServerlessServer } from "../../server/index-serverless";

const app = createServerlessServer();
export const handler = serverless(app);
