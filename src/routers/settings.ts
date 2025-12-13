import { DEFAULT_COLORS, DEFAULT_MOODS } from "~/lib/constants";
import { getAuth } from "./auth";

import { Elysia } from "elysia";

export const SETTING_CATEGORIES = {
  account: "Account",
  customization: "Customization",
  privacy: "Privacy",
};

export const router = new Elysia({ prefix: "/settings" })
  .use(getAuth(true))
  .use((req, res, next) => {
    res.locals.categories = SETTING_CATEGORIES;
    res.locals.user = {
      ...req.user,
      custom_labels: req.user.custom_labels.length > 0 ? req.user.custom_labels : DEFAULT_MOODS,
      custom_colors:
        req.user.custom_colors.length > 0
          ? req.user.custom_colors.map((x) => `#${x.toString(16).padStart(6, "0")}`)
          : DEFAULT_COLORS,
      custom_font_size: req.user.custom_font_size || 1.2,
    };

    next();
  })
  .get("/:category?", (req, res, next) => {
    const category = req.params.category || "account";

    // need to check for string because javascript moment (__proto__)
    if (typeof SETTING_CATEGORIES[category] != "string") return next();

    res.render("pages/settings", {
      category,
    });
  });
