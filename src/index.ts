import { Elysia } from "elysia";

import config from "#config" with { type: "json" };
import { initDatabase } from "~/db";
import { initTasks } from "~/lib/tasks";

import { router as apiRouter } from "./routers/api";
import { router as appRouter } from "./routers/app";
import { router as authRouter } from "./routers/auth";
import { router as settingsRouter } from "./routers/settings";

process.on("uncaughtException", (e) => console.error(e));
process.on("unhandledRejection", (e) => console.error(e));

const app = new Elysia().use(appRouter).use(apiRouter).use(authRouter).use(settingsRouter);

app.listen(config.port, async () => {
  await initDatabase();
  await initTasks();

  console.log(`Listening on :${config.port}`);
});
