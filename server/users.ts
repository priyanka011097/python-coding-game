/* =====================================================================
   users.ts — the account list.

   "Sign up" is simply the first Google sign-in: if the Google account id
   is new, a user record is created; otherwise its last-login is updated.

   Stored in MongoDB (`users` collection) when MONGODB_URI is set, and in
   .data/users.json (git-ignored) otherwise.
   ===================================================================== */

import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import type { Mongo } from "./db";

export interface UserRecord {
  id: string; // Google's stable account id ("sub")
  email: string;
  name: string;
  picture: string;
  createdAt: string;
  lastLoginAt: string;
}

export type UserProfile = Omit<UserRecord, "createdAt" | "lastLoginAt">;

export interface UserStore {
  /** Creates or updates the user. Says whether this was a new sign-up. */
  upsert(profile: UserProfile): Promise<{ user: UserRecord; isNew: boolean }>;
}

export class FileUserStore implements UserStore {
  private readonly file: string;

  constructor(root: string) {
    this.file = join(root, ".data", "users.json");
  }

  private load(): Record<string, UserRecord> {
    try {
      return JSON.parse(readFileSync(this.file, "utf8")) as Record<string, UserRecord>;
    } catch {
      return {};
    }
  }

  async upsert(profile: UserProfile): Promise<{ user: UserRecord; isNew: boolean }> {
    const users = this.load();
    const now = new Date().toISOString();
    const existing = users[profile.id];
    const user: UserRecord = existing
      ? { ...existing, ...profile, lastLoginAt: now }
      : { ...profile, createdAt: now, lastLoginAt: now };
    users[profile.id] = user;
    mkdirSync(dirname(this.file), { recursive: true });
    // Write-then-rename, so a crash mid-write cannot leave half a file.
    const tmp = `${this.file}.tmp`;
    writeFileSync(tmp, JSON.stringify(users, null, 2));
    renameSync(tmp, this.file);
    return { user, isNew: !existing };
  }
}

interface UserDoc extends Omit<UserRecord, "id"> {
  _id: string;
}

export class MongoUserStore implements UserStore {
  constructor(private readonly mongo: Mongo) {}

  async upsert(profile: UserProfile): Promise<{ user: UserRecord; isNew: boolean }> {
    const users = await this.mongo.collection<UserDoc>("users");
    const now = new Date().toISOString();
    const { id, ...fields } = profile;
    const before = await users.findOneAndUpdate(
      { _id: id },
      { $set: { ...fields, lastLoginAt: now }, $setOnInsert: { createdAt: now } },
      { upsert: true, returnDocument: "before" },
    );
    return {
      user: { id, ...fields, createdAt: before?.createdAt ?? now, lastLoginAt: now },
      isNew: before === null,
    };
  }
}
