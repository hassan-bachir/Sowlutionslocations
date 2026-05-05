import { randomUUID } from "node:crypto";
import { ConflictError, NotFoundError } from "../utils/errors.js";

const toPublicSession = (session) => {
  const publicSession = {
    id: session.id,
    userId: session.user_id,
    startedAt: session.started_at,
    endedAt: session.ended_at,
    isActive: Boolean(session.is_active),
    createdAt: session.created_at,
    updatedAt: session.updated_at,
  };

  if (session.location_count !== undefined) {
    publicSession.locationCount = session.location_count;
  }

  return publicSession;
};

const findActiveSession = (db, userId) => {
  return db
    .prepare(
      `
        SELECT id, user_id, started_at, ended_at, is_active, created_at, updated_at
        FROM location_sessions
        WHERE user_id = ?
          AND is_active = 1
        LIMIT 1
      `,
    )
    .get(userId);
};

const findSessionForUser = (db, sessionId, userId) => {
  return db
    .prepare(
      `
        SELECT id, user_id, started_at, ended_at, is_active, created_at, updated_at
        FROM location_sessions
        WHERE id = ?
          AND user_id = ?
        LIMIT 1
      `,
    )
    .get(sessionId, userId);
};

export const startLocationSession = async (userId, db) => {
  const activeSession = findActiveSession(db, userId);

  if (activeSession) {
    throw new ConflictError("User already has an active location session");
  }

  const sessionId = randomUUID();

  db.prepare(
    `
      INSERT INTO location_sessions (id, user_id)
      VALUES (?, ?)
    `,
  ).run(sessionId, userId);

  const createdSession = findActiveSession(db, userId);
  const publicSession = toPublicSession(createdSession);

  return publicSession;
};

export const stopLocationSession = async (sessionId, userId, db) => {
  const session = findSessionForUser(db, sessionId, userId);

  if (!session) {
    throw new NotFoundError("Location session not found");
  }

  if (!session.is_active) {
    throw new ConflictError("Location session is already stopped");
  }

  db.prepare(
    `
      UPDATE location_sessions
      SET is_active = 0,
          ended_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
        AND user_id = ?
    `,
  ).run(sessionId, userId);

  const stoppedSession = findSessionForUser(db, sessionId, userId);
  const publicSession = toPublicSession(stoppedSession);

  return publicSession;
};

export const listLocationSessions = async (userId, db) => {
  const sessions = db
    .prepare(
      `
        SELECT
          location_sessions.id,
          location_sessions.user_id,
          location_sessions.started_at,
          location_sessions.ended_at,
          location_sessions.is_active,
          location_sessions.created_at,
          location_sessions.updated_at,
          COUNT(location_points.id) AS location_count
        FROM location_sessions
        LEFT JOIN location_points
          ON location_points.session_id = location_sessions.id
        WHERE location_sessions.user_id = ?
        GROUP BY location_sessions.id
        ORDER BY location_sessions.started_at DESC, location_sessions.created_at DESC
      `,
    )
    .all(userId)
    .map(toPublicSession);

  return {
    data: sessions,
  };
};
