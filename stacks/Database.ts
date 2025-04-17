import { StackContext, cloudflare } from "sst";

export function Database({ stack }: StackContext) {
  // Create a D1 database (SQLite on Cloudflare)
  const database = new cloudflare.D1(stack, "Database", {
    name: "telegram-db",
  });

  return {
    database,
  };
}