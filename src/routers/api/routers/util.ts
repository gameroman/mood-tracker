import { fromZodError } from "zod-validation-error";
import { fetch$ } from "~/db";
import * as z from "zod";

export function auth() {
  return async function (req, res, next) {
    if (req.headers.authorization) {
      req.user = await fetch$("select * from users where token=$1", [req.headers.authorization]);
    }

    if (req.params.user) {
      if (!req.params.user.match(/^[a-z0-9_-]{3,32}$/)) return next();

      req.user = await fetch$(
        "select * from users where username=$1 and ((is_profile_private=false and is_history_private=false) or id=$2)",
        [req.params.user, req.user?.id ?? -1],
      );
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
