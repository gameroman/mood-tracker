import { Elysia } from "elysia";

import { DEFAULT_MOODS, DEFAULT_COLORS } from "~/lib/constants";
import { db } from "~/db";
import { fetchMood } from "~/lib/util";
import { authPlugin } from "./auth";
import { eq } from "drizzle-orm";
import { users as usersTable } from "~/db/schema";
import * as z from "zod";

export const router = new Elysia()
  .use(authPlugin)
  .get(
    "/",
    async ({ user }) => {
      res.render("/index", { user });
    },
    { auth: true },
  )
  .get(
    "/:username",
    async ({ params, user }) => {
      const userToRender = (
        await db.select().from(usersTable).where(eq(usersTable.username, params.username))
      )[0];

      if (!userToRender) return;
      if (userToRender.is_profile_private && user?.id != userToRender.id) return;

      res.render("/profile/view", {
        auth: user,
        user: userToRender,
        username: userToRender.username,
        mood: await fetchMood(userToRender),

        labels: userToRender.custom_labels.length > 0 ? userToRender.custom_labels : DEFAULT_MOODS,
        colors:
          userToRender.custom_colors.length > 0
            ? userToRender.custom_colors.map((x) => `#${x.toString(16).padStart(6, "0")}`)
            : DEFAULT_COLORS,
        font_size: userToRender.custom_font_size || 1.2,
      });
    },
    { auth: true, params: z.object({ username: z.string() }) },
  )
  .get(
    "/:username/analytics",
    async ({ params, user }) => {
      const userToRender = (
        await db.select().from(usersTable).where(eq(usersTable.username, params.username))
      )[0];

      if (!userToRender) return;
      if (userToRender.is_profile_private && user?.id != userToRender.id) return;

      res.render("/profile/analytics", {
        username: userToRender.username,

        labels: userToRender.custom_labels.length > 0 ? userToRender.custom_labels : DEFAULT_MOODS,
        colors:
          userToRender.custom_colors.length > 0
            ? userToRender.custom_colors.map((x) => `#${x.toString(16).padStart(6, "0")}`)
            : DEFAULT_COLORS,
        font_size: userToRender.custom_font_size || 1.2,
      });
    },
    { auth: true, params: z.object({ username: z.string() }) },
  );
