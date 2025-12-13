import config from "../../config.json" assert { type: "json" };

import { exec$, fetch$ } from "~/lib/db";
import { randomBytes } from "node:crypto";
import bcrypt from "bcrypt";

import { Elysia } from "elysia";

export function getAuth(required = false) {
  return async function (req, res, next) {
    if (req.cookies.token) {
      req.user = await fetch$("select * from users where token=$1", [req.cookies.token]);
    }

    if (required && !req.user) {
      res.status(401).redirect("/auth/login");
    } else if (req.user && req.user.changepass) {
      res.render("pages/auth/changepass");
    } else {
      next();
    }
  };
}

export const router = new Elysia({ prefix: "/auth" })
  .get("/login", (req, res) => res.render("pages/auth/login"))
  .get("/register", (req, res) => res.render("pages/auth/register"))
  .get("/logout", (req, res) => {
    res.clearCookie("token").redirect("/");
  })
  .post("/login", async (req, res) => {
    if (typeof req.body.username != "string" || typeof req.body.password != "string")
      return res.status(400).send("Bad Request");

    const user = await fetch$("select * from users where username=$1", [req.body.username]);

    if (!user || !(await bcrypt.compare(req.body.password, user.password_hash))) {
      return res.status(403).render("pages/auth/login", {
        error: "Invalid username or password",
      });
    }

    res
      .cookie("token", user.token, {
        maxAge: 365 * 24 * 3600 * 1000,
      })
      .redirect("/");
  })
  .post("/register", async (req, res) => {
    if (typeof req.body.username != "string" || typeof req.body.password != "string") {
      return res.status(400).send("Bad Request");
    }

    if (!req.body.username.match(/^[a-z0-9_-]{3,32}$/)) {
      return res.status(400).render("pages/auth/register", {
        error: "Username validation failed",
      });
    }

    if (config.blacklisted_usernames.includes(req.body.username)) {
      return res.status(400).render("pages/auth/register", {
        error: "You cannot use that username",
      });
    }

    if (await fetch$("select 1 from users where username=$1", [req.body.username])) {
      return res.status(409).render("pages/auth/register", {
        error: "Username taken",
      });
    }

    const hash = await bcrypt.hash(req.body.password, 10);
    const token = randomBytes(48).toString("base64url");

    await exec$("insert into users values (default, $1, $2, $3, $4)", [
      req.body.username,
      hash,
      token,
      Date.now(),
    ]);

    res
      .cookie("token", token, {
        maxAge: 365 * 24 * 3600 * 1000,
      })
      .redirect("/");
  })
  .post("/changepass", async (req, res) => {
    if (typeof req.body.oldpass != "string" || typeof req.body.newpass != "string") {
      return res.status(400).send("Bad Request");
    }

    if (req.body.newpass != req.body.newpassconfirm) {
      return res.render("pages/auth/changepass", {
        error: "New password confirmation does not match",
      });
    }

    const user = await fetch$("select * from users where token=$1", [req.cookies.token]);
    if (!user) {
      return res.status(401).send("Unauthorized");
    }

    const hash = await bcrypt.hash(req.body.newpass, 10);
    const token = randomBytes(48).toString("base64url");

    await exec$("update users set token=$1, password_hash=$2, changepass=false where id=$3", [
      token,
      hash,
      user.id,
    ]);

    return res
      .cookie("token", token, {
        maxAge: 365 * 24 * 3600 * 1000,
      })
      .redirect("/");
  });
