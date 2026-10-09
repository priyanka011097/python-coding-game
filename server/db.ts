/* =====================================================================
   db.ts — one shared MongoDB connection, opened on first use.

   Configure with MONGODB_URI (and optionally MONGODB_DB) in .env. The
   connection string holds the database password, so it lives only on the
   server and never reaches the browser.
   ===================================================================== */

import { MongoClient } from "mongodb";
import type { Collection, Db, Document } from "mongodb";

const DEFAULT_DB = "interview_prep";

export class Mongo {
  private client: MongoClient | null = null;
  private ready: Promise<Db> | null = null;

  constructor(
    private readonly uri: string,
    private readonly dbName: string | undefined,
  ) {}

  private connect(): Promise<Db> {
    if (!this.ready) {
      this.client = new MongoClient(this.uri, {
        serverSelectionTimeoutMS: 10_000,
        appName: "interview-prep",
      });
      this.ready = this.client
        .connect()
        .then(async (client) => {
          // The database named in the URI wins; otherwise MONGODB_DB, then a default.
          const db = this.dbName ? client.db(this.dbName) : client.db(undefined);
          const named = db.databaseName === "test" && !this.dbName ? client.db(DEFAULT_DB) : db;
          // One document per user per key. The progress endpoint relies on
          // this uniqueness to reject stale writes.
          await named.collection("progress").createIndex({ userId: 1, key: 1 }, { unique: true });
          return named;
        })
        .catch((err: unknown) => {
          // Let the next request try again rather than caching the failure.
          this.ready = null;
          void this.client?.close().catch(() => undefined);
          this.client = null;
          throw err;
        });
    }
    return this.ready;
  }

  async collection<T extends Document>(name: string): Promise<Collection<T>> {
    return (await this.connect()).collection<T>(name);
  }

  async ping(): Promise<void> {
    await (await this.connect()).command({ ping: 1 });
  }
}

/** Turns driver errors into something a person can act on. */
export function describeDbError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  if (/bad auth|authentication failed/i.test(msg)) {
    return "MongoDB rejected the username or password in MONGODB_URI.";
  }
  if (/ENOTFOUND|querySrv/i.test(msg)) {
    return "MongoDB host not found. Check the cluster address in MONGODB_URI.";
  }
  if (/Server selection timed out|ECONNREFUSED|timed out/i.test(msg)) {
    return "Could not reach MongoDB. In Atlas, open Network Access and allow this computer's IP address.";
  }
  return `MongoDB error: ${msg.slice(0, 200)}`;
}
