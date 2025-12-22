import {
  pgTable,
  serial,
  bigint,
  doublePrecision,
  integer,
  varchar,
  boolean,
  index,
} from "drizzle-orm/pg-core";

export const mood = pgTable(
  "mood",
  {
    id: serial("id").primaryKey(),
    timestamp: bigint("timestamp", { mode: "number" }).notNull(),
    pleasantness: doublePrecision("pleasantness").notNull(),
    energy: doublePrecision("energy").notNull(),
    user_id: integer("user_id").notNull(),
  },
  ({ user_id }) => [index("mood_user_id_idx").on(user_id)],
);

export const users = pgTable(
  "users",
  {
    id: serial("id").primaryKey(),
    username: varchar("username", { length: 32 }).unique().notNull(),
    password_hash: varchar("password_hash", { length: 60 }).notNull(), // bcrypt
    token: varchar("token", { length: 64 }),
    created_at: bigint("created_at", { mode: "number" }).notNull(),

    stats_mood_sets: integer("stats_mood_sets").default(0),

    custom_labels: varchar("custom_labels", { length: 64 }).array().default([]).notNull(),
    custom_colors: integer("custom_colors").array().default([]).notNull(),
    custom_font_size: doublePrecision("custom_font_size").default(1.2),

    is_profile_private: boolean("is_profile_private").default(false),
    is_history_private: boolean("is_history_private").default(false),
    history_threshold_days: integer("history_threshold_days").default(-1),

    changepass: boolean("changepass").default(false),
  },
  ({ username, token }) => [
    index("users_username_idx").on(username),
    index("users_token_idx").on(token),
  ],
);
