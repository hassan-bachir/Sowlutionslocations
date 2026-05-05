import { randomUUID } from "node:crypto";
import { ConflictError, NotFoundError } from "../utils/errors.js";

const toPublicLocationPoint = (point) => {
  return {
    id: point.id,
    sessionId: point.session_id,
    latitude: point.latitude,
    longitude: point.longitude,
    recordedAt: point.recorded_at,
    createdAt: point.created_at,
  };
};

const findSessionForUser = (db, sessionId, userId) => {
  return db
    .prepare(
      `
        SELECT id, user_id, is_active
        FROM location_sessions
        WHERE id = ?
          AND user_id = ?
        LIMIT 1
      `,
    )
    .get(sessionId, userId);
};

const findVisibleSessionForUser = (db, sessionId, userId) => {
  return db
    .prepare(
      `
        SELECT location_sessions.id, location_sessions.user_id, location_sessions.is_active
        FROM location_sessions
        LEFT JOIN location_permissions
          ON location_permissions.owner_user_id = location_sessions.user_id
          AND location_permissions.viewer_user_id = ?
        WHERE location_sessions.id = ?
          AND (
            location_sessions.user_id = ?
            OR location_permissions.viewer_user_id IS NOT NULL
          )
        LIMIT 1
      `,
    )
    .get(userId, sessionId, userId);
};

export const saveLocationPoint = async (sessionId, userId, payload, db) => {
  const session = findSessionForUser(db, sessionId, userId);

  if (!session) {
    throw new NotFoundError("Location session not found");
  }

  if (!session.is_active) {
    throw new ConflictError("Cannot save points to a stopped session");
  }

  const point = {
    id: randomUUID(),
    sessionId,
    latitude: payload.latitude,
    longitude: payload.longitude,
    recordedAt: payload.recordedAt ?? new Date().toISOString(),
  };

  db.prepare(
    `
      INSERT INTO location_points (
        id,
        session_id,
        latitude,
        longitude,
        recorded_at
      )
      VALUES (
        @id,
        @sessionId,
        @latitude,
        @longitude,
        @recordedAt
      )
    `,
  ).run(point);

  const createdPoint = db
    .prepare(
      `
        SELECT id, session_id, latitude, longitude, recorded_at, created_at
        FROM location_points
        WHERE id = ?
      `,
    )
    .get(point.id);
  const publicPoint = toPublicLocationPoint(createdPoint);

  return publicPoint;
};

export const getLatestLocationPoint = async (sessionId, userId, db) => {
  const session = findVisibleSessionForUser(db, sessionId, userId);

  if (!session) {
    throw new NotFoundError("Location session not found");
  }

  const latestPoint = db
    .prepare(
      `
        SELECT id, session_id, latitude, longitude, recorded_at, created_at
        FROM location_points
        WHERE session_id = ?
        ORDER BY recorded_at DESC, created_at DESC
        LIMIT 1
      `,
    )
    .get(sessionId);

  if (!latestPoint) {
    throw new NotFoundError("Latest location not found");
  }

  const publicPoint = toPublicLocationPoint(latestPoint);

  return {
    location: publicPoint,
  };
};

export const getLocationHistory = async (sessionId, userId, query, db) => {
  const page = Number(query.page ?? 1);
  const limit = Number(query.limit ?? 20);
  const offset = (page - 1) * limit;
  const session = findVisibleSessionForUser(db, sessionId, userId);

  if (!session) {
    throw new NotFoundError("Location session not found");
  }

  const total = db
    .prepare(
      `
        SELECT COUNT(*) AS count
        FROM location_points
        WHERE session_id = ?
      `,
    )
    .get(sessionId).count;
  const rows = db
    .prepare(
      `
        SELECT id, session_id, latitude, longitude, accuracy, altitude, speed, heading, recorded_at, created_at
        FROM location_points
        WHERE session_id = ?
        ORDER BY recorded_at ASC, created_at ASC
        LIMIT ?
        OFFSET ?
      `,
    )
    .all(sessionId, limit, offset);
  const history = {
    data: rows.map(toPublicLocationPoint),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };

  return {
    ...history,
  };
};
