import { SSTConfig } from "sst";
import { API } from "./stacks/API";
import { Cron } from "./stacks/Cron";
import { Database } from "./stacks/Database";

export default {
  config(_input) {
    return {
      name: "ai-telegram",
      region: "auto", // Cloudflare automatically handles regions
    };
  },
  stacks(app) {
    app
      .stack(Database)
      .stack(API)
      .stack(Cron);
  }
} satisfies SSTConfig;