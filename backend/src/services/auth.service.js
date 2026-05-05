import { randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import { ConflictError, UnauthorizedError } from "../utils/errors.js";

const PASSWORD_SALT_ROUNDS = 12;

const toPublicUser = (user) => {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    createdAt: user.created_at,
    updatedAt: user.updated_at,
  };
};

export const register = async (payload, db) => {
  const email = payload.email.trim().toLowerCase();
  const existingUser = db
    .prepare("SELECT id FROM users WHERE email = ?")
    .get(email);

  if (existingUser) {
    throw new ConflictError("Email is already registered");
  }

  const user = {
    id: randomUUID(),
    email,
    name: payload.name?.trim() || null,
    passwordHash: await bcrypt.hash(payload.password, PASSWORD_SALT_ROUNDS),
  };

  db.prepare(
    `
      INSERT INTO users (id, email, name, password_hash)
      VALUES (@id, @email, @name, @passwordHash)
    `,
  ).run(user);

  const createdUser = db
    .prepare(
      `
        SELECT id, email, name, created_at, updated_at
        FROM users
        WHERE id = ?
      `,
    )
    .get(user.id);

  return toPublicUser(createdUser);
};

export const login = async (payload, db, jwt) => {
  const email = payload.email.trim().toLowerCase();
  const user = db
    .prepare(
      `
        SELECT id, email, name, password_hash, created_at, updated_at
        FROM users
        WHERE email = ?
      `,
    )
    .get(email);

  if (!user) {
    throw new UnauthorizedError("Invalid email or password");
  }

  const passwordMatches = await bcrypt.compare(
    payload.password,
    user.password_hash,
  );

  if (!passwordMatches) {
    throw new UnauthorizedError("Invalid email or password");
  }

  return {
    accessToken: jwt.sign({
      sub: user.id,
      email: user.email,
    }),
    user: toPublicUser(user),
  };
};

export const getProfile = async (userId, db) => {
  const user = db
    .prepare(
      `
        SELECT id, email, name, created_at, updated_at
        FROM users
        WHERE id = ?
      `,
    )
    .get(userId);

  return toPublicUser(user);
};

export const updateProfile = async (userId, payload, db) => {
  db.prepare(
    `
      UPDATE users
      SET name = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `,
  ).run(payload.name.trim(), userId);

  return getProfile(userId, db);
};
