import {
  loginSchema,
  meSchema,
  registerSchema,
  updateProfileSchema,
} from "../schemas/auth.schemas.js";
import { authenticate } from "../middleware/auth.middleware.js";
import {
  getProfile,
  login,
  register,
  updateProfile,
} from "../services/auth.service.js";

export const authRoutes = async (app) => {
  app.post("/register", { schema: registerSchema }, async (request, reply) => {
    const user = await register(request.body, app.db);

    return reply.code(201).send(user);
  });

  app.post("/login", { schema: loginSchema }, async (request) => {
    return login(request.body, app.db, app.jwt);
  });

  // JWT testing toute
  app.get(
    "/me",
    { preHandler: authenticate, schema: meSchema },
    async (request) => {
      return {
        user: await getProfile(request.user.id, app.db),
      };
    },
  );

  app.patch(
    "/me",
    { preHandler: authenticate, schema: updateProfileSchema },
    async (request) => {
      return {
        user: await updateProfile(request.user.id, request.body, app.db),
      };
    },
  );
};
