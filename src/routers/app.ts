import { Elysia } from "elysia";

import { DEFAULT_MOODS, DEFAULT_COLORS } from "~/lib/constants";
import { fetch$ } from "~/lib/db";
import { fetchMood } from "~/lib/util";
import { getAuth } from "./auth";

export const router = new Elysia()
  .get("/", getAuth(), async (req, res) => {
    res.render("pages/index", {
      user: req.user,
    });
  })
  .get("/:username", getAuth(), async (req, res, next) => {
    const user = await fetch$("select * from users where username=$1", [req.params.username]);

    if (!user) return next();
    if (user.is_profile_private && req.user?.id != user.id) return next();

    res.render("pages/profile/view", {
      auth: req.user,
      user: user,
      username: user.username,
      mood: await fetchMood(user),

      labels: user.custom_labels.length > 0 ? user.custom_labels : DEFAULT_MOODS,
      colors:
        user.custom_colors.length > 0
          ? user.custom_colors.map((x) => `#${x.toString(16).padStart(6, "0")}`)
          : DEFAULT_COLORS,
      font_size: user.custom_font_size || 1.2,
    });
  })
  .get("/:username/analytics", getAuth(), async (req, res, next) => {
    const user = await fetch$("select * from users where username=$1", [req.params.username]);

    if (!user) return next();
    if (user.is_profile_private && req.user?.id != user.id) return next();

    res.render("pages/profile/analytics", {
      username: user.username,

      labels: user.custom_labels.length > 0 ? user.custom_labels : DEFAULT_MOODS,
      colors:
        user.custom_colors.length > 0
          ? user.custom_colors.map((x) => `#${x.toString(16).padStart(6, "0")}`)
          : DEFAULT_COLORS,
      font_size: user.custom_font_size || 1.2,
    });
  });
