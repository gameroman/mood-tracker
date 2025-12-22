import { DEFAULT_COLORS, DEFAULT_MOODS } from "~/lib/constants";
import { authPlugin } from "./auth";

import { Elysia } from "elysia";
import * as z from "zod";

const SETTING_CATEGORIES = {
  account: "Account",
  customization: "Customization",
  privacy: "Privacy",
} as const;

export const router = new Elysia({ prefix: "/settings" })
  .use(authPlugin)
  // .use((req, res, next) => {
  //   res.locals.categories = SETTING_CATEGORIES;
  //   res.locals.user = {
  //     ...req.user,
  //     custom_labels: req.user.custom_labels.length > 0 ? req.user.custom_labels : DEFAULT_MOODS,
  //     custom_colors:
  //       req.user.custom_colors.length > 0
  //         ? req.user.custom_colors.map((x) => `#${x.toString(16).padStart(6, "0")}`)
  //         : DEFAULT_COLORS,
  //     custom_font_size: req.user.custom_font_size || 1.2,
  //   };

  //   next();
  // })
  .get(
    "/:category?",
    ({ params }) => {
      const category = params.category || "account";

      res.render("/settings", { category });
    },
    {
      params: z.object({ category: z.literal(["account", "customization", "privacy"]).optional() }),
    },
  );
