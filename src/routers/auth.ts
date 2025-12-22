import config from "#config" assert { type: "json" };

import { exec$, fetch$, db } from "~/db";
import { randomBytes } from "node:crypto";
import * as bcrypt from "bcrypt";
import { eq } from "drizzle-orm";
import { users as usersTable } from "~/db/schema";

import { Elysia } from "elysia";
import * as z from "zod";

export const authPlugin = new Elysia({ name: "auth" })
  .macro({
    user: {
      async resolve({ cookie }) {
        const token = cookie.token?.value;
        if (typeof token !== "string") return { user: null };
        const user = (await db.select().from(usersTable).where(eq(usersTable.token, token)))[0];
        return { user };
      },
    },
  })
  .macro("auth", {
    user: true,
    beforeHandle({ redirect, user }) {
      if (!user) {
        return redirect("/auth/login");
      }
      if (user?.changepass) {
        return redirect("/auth/changepass");
      }
      return;
    },
  });

export const router = new Elysia({ prefix: "/auth" })
  .use(authPlugin)
  .post("/logout", ({ cookie: { token }, redirect }) => {
    token?.remove();
    return redirect("/");
  })
  .post(
    "/login",
    async ({ redirect, cookie: { token }, body: { username, password } }) => {
      const user = (await db.select().from(usersTable).where(eq(usersTable.username, username)))[0];

      if (!user || !(await bcrypt.compare(password, user.password_hash))) {
        return res.status(403).render("/auth/login", {
          error: "Invalid username or password",
        });
      }

      token?.set({ value: user.token, maxAge: 365 * 24 * 3600 * 1000 });

      return redirect("/");
    },
    { body: z.object({ username: z.string(), password: z.string() }) },
  )

  .post(
    "/register",
    async ({ redirect, cookie, body: { username, password } }) => {
      if (!username.match(/^[a-z0-9_-]{3,32}$/)) {
        return res.status(400).render("/auth/register", {
          error: "Username validation failed",
        });
      }

      if (config.blacklisted_usernames.includes(username)) {
        return res.status(400).render("/auth/register", {
          error: "You cannot use that username",
        });
      }

      if (await fetch$("select 1 from users where username=$1", [username])) {
        return res.status(409).render("/auth/register", {
          error: "Username taken",
        });
      }

      const hash = await bcrypt.hash(password, 10);
      const token = randomBytes(48).toString("base64url");

      await exec$("insert into users values (default, $1, $2, $3, $4)", [
        username,
        hash,
        token,
        Date.now(),
      ]);

      cookie.token?.set({ value: token, maxAge: 365 * 24 * 3600 * 1000 });

      return redirect("/");
    },
    { body: z.object({ username: z.string(), password: z.string() }) },
  )

  .post(
    "/changepass",
    async ({ redirect, cookie, body: { newpass } }) => {
      const user = await fetch$("select * from users where token=$1", [cookie.token]);
      if (!user) {
        return res.status(401).send("Unauthorized");
      }

      const hash = await bcrypt.hash(newpass, 10);
      const token = randomBytes(48).toString("base64url");

      await exec$("update users set token=$1, password_hash=$2, changepass=false where id=$3", [
        token,
        hash,
        user.id,
      ]);

      cookie.token?.set({ value: token, maxAge: 365 * 24 * 3600 * 1000 });
      return redirect("/");
    },
    { body: z.object({ newpass: z.string() }) },
  );
