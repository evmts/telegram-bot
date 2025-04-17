import { StackContext, cloudflare } from "sst";
import { Database } from "./Database";

export function API({ stack }: StackContext) {
  const { database } = stack.use(Database);

  // Create a Hono API worker
  const api = new cloudflare.Worker(stack, "API", {
    url: true,
    handler: "api/server.ts",
    link: [database],
    cf: {
      routes: ["api/*"],
    },
  });

  stack.addOutputs({
    ApiUrl: api.url,
  });

  return {
    api,
  };
}