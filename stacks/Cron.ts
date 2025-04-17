import { StackContext, cloudflare } from "sst";
import { Database } from "./Database";

export function Cron({ stack }: StackContext) {
  const { database } = stack.use(Database);

  // Create a cron job
  const cron = new cloudflare.Cron(stack, "TelegramCron", {
    job: "api/cron.ts",
    schedules: ["0 * * * *"], // Runs hourly
    link: [database],
  });

  return {
    cron,
  };
}