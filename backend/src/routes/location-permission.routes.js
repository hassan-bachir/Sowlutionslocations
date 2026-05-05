import { authenticate } from "../middleware/auth.middleware.js";
import {
  allowLocationViewerSchema,
  listLocationViewersSchema,
  removeLocationViewerSchema,
} from "../schemas/location-permission.schemas.js";
import {
  allowLocationViewer,
  listLocationViewers,
  removeLocationViewer,
} from "../services/location-permission.service.js";

export const locationPermissionRoutes = async (app) => {
  app.get(
    "/viewers",
    { preHandler: authenticate, schema: listLocationViewersSchema },
    async (request) => {
      return listLocationViewers(request.user.id, app.db);
    },
  );

  app.post(
    "/viewers",
    { preHandler: authenticate, schema: allowLocationViewerSchema },
    async (request, reply) => {
      const viewer = await allowLocationViewer(
        request.user.id,
        request.body,
        app.db,
      );

      return reply.code(201).send(viewer);
    },
  );

  app.delete(
    "/viewers/:viewerUserId",
    { preHandler: authenticate, schema: removeLocationViewerSchema },
    async (request) => {
      return removeLocationViewer(
        request.user.id,
        request.params.viewerUserId,
        app.db,
      );
    },
  );
};
