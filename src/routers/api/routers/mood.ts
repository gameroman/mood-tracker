import { Elysia } from "elysia";
import * as z from "zod";

import { exec$, fetch$ } from "~/db";
import { fetchMood } from "~/lib/util";

import { auth } from "./util";

export const router = new Elysia({ prefix: "/mood" })
  .get("/:user?", auth(), async (req, res) => {
    res.json({
      status: "ok",
      mood: await fetchMood(req.user),
    });
  })
  .put(
    "/",
    async ({ body, status }) => {
      const lastMood = await fetch$(
        "select * from mood where user_id=$1 order by id desc limit 1",
        [req.user.id],
      );

      if (
        lastMood &&
        (req.user.history_threshold_days === 0 || parseInt(lastMood.timestamp) + 25000 > Date.now())
      ) {
        await exec$("update mood set pleasantness=$1, energy=$2, timestamp=$3 where id=$4", [
          body.pleasantness,
          body.energy,
          Date.now(),
          lastMood.id,
        ]);
      } else {
        await exec$("insert into mood values (default, $1, $2, $3, $4)", [
          Date.now(),
          body.pleasantness,
          body.energy,
          req.user.id,
        ]);

        await exec$("update users set stats_mood_sets=stats_mood_sets + 1 where id=$1", [
          req.user.id,
        ]);
      }

      status(200);

      return { status: "ok" };
    },
    {
      auth,
      body: z.object({
        pleasantness: z.number().min(-1).max(1),
        energy: z.number().min(-1).max(1),
      }),
    },
  )
  .delete(
    "/",
    async ({ body }) => {
      if (
        !Array.isArray(body.timestamps) ||
        req.body.timestamps.find((x) => !Number.isInteger(x))
      ) {
        return res.status(400).json({
          status: "error",
          message: "`timestamps` needs to be an array of integers",
        });
      }

      const deleted = await exec$(
        "delete from mood where user_id=$1 and timestamp=any($2) returning *",
        [req.user.id, body.timestamps],
      );

      res.json({ status: "ok", deleted: deleted.length });
    },
    {
      auth,
      body: z.object({ timestamps: z.array(z.number().int().positive()) }),
    },
  );
