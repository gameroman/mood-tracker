import { eq, and, or } from "drizzle-orm";
import * as z from "zod";
import { fromZodError } from "zod-validation-error";

import { db } from "~/db";
import { users as usersTable } from "~/db/schema";

export function auth() {
  return async function (req, res, next) {
    if (req.headers.authorization) {
      req.user = (
        await db.select().from(usersTable).where(eq(usersTable.token, req.headers.authorization))
      )[0];
    }

    if (req.params.user) {
      if (!req.params.user.match(/^[a-z0-9_-]{3,32}$/)) return next();

      req.user = (
        await db
          .select()
          .from(usersTable)
          .where(
            and(
              eq(usersTable.username, req.params.user),
              or(
                and(
                  eq(usersTable.is_profile_private, false),
                  eq(usersTable.is_history_private, false),
                ),
                eq(usersTable.id, req.user?.id),
              ),
            ),
          )
      )[0];
    }

    if (!req.user) {
      return res.status(req.params.user ? 404 : 401).json({
        status: "error",
        message: req.params.user ? "User not found" : "Unauthorized",
      });
    }

    next();
  };
}

export function validateBody(shape, error = null) {
  const obj = z.object(shape);

  return async function (req, res, next) {
    const body = await obj.safeParseAsync(req.body);

    if (body.success) {
      next();
    } else if (error) {
      res.status(400).json(error);
    } else {
      res.status(400).json({
        status: "error",
        message: fromZodError(body.error, {
          prefix: "Invalid body",
        }).toString(),
      });
    }
  };
}

export function validateQuery(shape, error = null) {
  const obj = z.object(shape);

  return async function (req, res, next) {
    const query = await obj.safeParseAsync(req.query);

    if (query.success) {
      next();
    } else if (error) {
      res.status(400).json(error);
    } else {
      res.status(400).json({
        status: "error",
        message: fromZodError(query.error, {
          prefix: "Invalid query",
        }).toString(),
      });
    }
  };
}
