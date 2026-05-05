import { ConflictError, NotFoundError } from "../utils/errors.js";

const toPublicViewer = (viewer) => {
  return {
    id: viewer.id,
    email: viewer.email,
    name: viewer.name,
    allowedAt: viewer.created_at,
  };
};

export const allowLocationViewer = async (ownerUserId, payload, db) => {
  const viewerEmail = payload.email.trim().toLowerCase();
  const viewer = db
    .prepare(
      `
        SELECT id, email, name
        FROM users
        WHERE email = ?
      `,
    )
    .get(viewerEmail);

  if (!viewer) {
    throw new NotFoundError("Viewer user not found");
  }

  if (viewer.id === ownerUserId) {
    throw new ConflictError("You already have access to your own location");
  }

  db.prepare(
    `
      INSERT OR IGNORE INTO location_permissions (owner_user_id, viewer_user_id)
      VALUES (?, ?)
    `,
  ).run(ownerUserId, viewer.id);

  return {
    id: viewer.id,
    email: viewer.email,
    name: viewer.name,
  };
};

export const listLocationViewers = async (ownerUserId, db) => {
  const viewers = db
    .prepare(
      `
        SELECT users.id, users.email, users.name, location_permissions.created_at
        FROM location_permissions
        INNER JOIN users
          ON users.id = location_permissions.viewer_user_id
        WHERE location_permissions.owner_user_id = ?
        ORDER BY location_permissions.created_at DESC
      `,
    )
    .all(ownerUserId);

  return {
    data: viewers.map(toPublicViewer),
  };
};

export const removeLocationViewer = async (ownerUserId, viewerUserId, db) => {
  db.prepare(
    `
      DELETE FROM location_permissions
      WHERE owner_user_id = ?
        AND viewer_user_id = ?
    `,
  ).run(ownerUserId, viewerUserId);

  return {
    removed: true,
  };
};

export const listPermittedViewerIds = (ownerUserId, db) => {
  return db
    .prepare(
      `
        SELECT viewer_user_id
        FROM location_permissions
        WHERE owner_user_id = ?
      `,
    )
    .all(ownerUserId)
    .map((row) => row.viewer_user_id);
};
