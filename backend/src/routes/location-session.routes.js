import { authenticate } from "../middleware/auth.middleware.js";
import {
  listLocationSessionsSchema,
  startLocationSessionSchema,
  stopLocationSessionSchema,
} from "../schemas/location-session.schemas.js";
import {
  listLocationSessions,
  startLocationSession,
  stopLocationSession,
} from "../services/location-session.service.js";

export const locationSessionRoutes = async (app) => {
  app.get(
    "/",
    {
      preHandler: authenticate,
      schema: listLocationSessionsSchema,
    },
    async (request) => {
      return listLocationSessions(request.user.id, app.db);
    },
  );

  app.post(
    "/start",
    {
      preHandler: authenticate,
      schema: startLocationSessionSchema,
    },
    async (request, reply) => {
      const session = await startLocationSession(request.user.id, app.db);

      return reply.code(201).send(session);
    },
  );

  app.post(
    "/:sessionId/stop",
    {
      preHandler: authenticate,
      schema: stopLocationSessionSchema,
    },
    async (request) => {
      return stopLocationSession(
        request.params.sessionId,
        request.user.id,
        app.db,
      );
    },
  );

  app.post(
    "/:sessionId/locations",
    {
      preHandler: authenticate,
      schema: saveLocationPointSchema,
    },
    async (request, reply) => {
      const point = await saveLocationPoint(
        request.params.sessionId,
        request.user.id,
        request.body,
        app.db,
      );

      return reply.code(201).send(point);
    },
  );

  app.get(
    "/:sessionId/locations",
    {
      preHandler: authenticate,
      schema: locationHistorySchema,
    },
    async (request) => {
      return getLocationHistory(
        request.params.sessionId,
        request.user.id,
        request.query,
        app.db,
      );
    },
  );

  app.get(
    "/:sessionId/latest-location",
    {
      preHandler: authenticate,
      schema: latestLocationPointSchema,
    },
    async (request) => {
      return getLatestLocationPoint(
        request.params.sessionId,
        request.user.id,
        app.db,
      );
    },
  );
};
