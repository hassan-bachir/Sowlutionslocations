import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";

const DATABASE_PATH = process.env.DATABASE_PATH || "data/app.sqlite";

let connection;

export const database = {
  connect: () => {
    if (connection) {
      return connection;
    }

    const filePath = resolve(process.cwd(), DATABASE_PATH);
    mkdirSync(dirname(filePath), { recursive: true });

    connection = new Database(filePath);
    connection.pragma("foreign_keys = ON");

    return connection;
  },
  getConnection: () => {
    if (!connection) {
      return database.connect();
    }

    return connection;
  },
  close: () => {
    if (!connection) {
      return;
    }

    connection.close();
    connection = undefined;
  },
};
