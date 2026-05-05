import Fastify from "fastify";
import fastifyCors from "@fastify/cors";
import fastifyJwt from "@fastify/jwt";
import { AppError } from "./utils/errors.js";
import { database } from "./db/database.js";
import { runMigrations } from "./db/migrations.js";
import { authRoutes } from "./routes/auth.routes.js";
import { locationPermissionRoutes } from "./routes/location-permission.routes.js";
import { locationSessionRoutes } from "./routes/location-session.routes.js";

export const buildApp = async () => {
  const app = Fastify({
    logger: true,
  });

  await app.register(fastifyCors, {
    origin: true,
  });

  const db = database.connect();
  runMigrations(db);

  app.decorate("db", db);
  app.addHook("onClose", async () => {
    database.close();
  });

  await app.register(fastifyJwt, {
    secret: process.env.JWT_SECRET || "secretkey",
    sign: {
      expiresIn: "1h",
    },
  });

  app.setErrorHandler((error, request, reply) => {
    if (error instanceof AppError) {
      return reply.code(error.statusCode).send({
        error: error.name,
        message: error.message,
      });
    }

    if (error.statusCode && error.statusCode < 500) {
      return reply.code(error.statusCode).send({
        error: error.name || "BadRequestError",
        message: error.message,
      });
    }

    return reply.code(500).send({
      error: "InternalServerError",
      message: "Something went wrong",
    });
  });

  app.get("/", async () => {
    return {
      status: "ok",
      message: "Server is running",
    };
  });

  await app.register(authRoutes, { prefix: "/api/auth" });
  await app.register(locationPermissionRoutes, {
    prefix: "/api/location-permissions",
  });
  await app.register(locationSessionRoutes, {
    prefix: "/api/location-sessions",
  });
  return app;
};
