const authBodySchema = {
  type: "object",
  required: ["email", "password"],
  additionalProperties: false,
  properties: {
    email: { type: "string", format: "email" },
    name: { type: "string", minLength: 1 },
    password: { type: "string", minLength: 6 },
  },
};

const publicUserResponse = {
  type: "object",
  required: ["id", "email", "createdAt", "updatedAt"],
  properties: {
    id: { type: "string" },
    email: { type: "string" },
    name: { type: ["string", "null"] },
    createdAt: { type: "string" },
    updatedAt: { type: "string" },
  },
};

export const registerSchema = {
  body: authBodySchema,
  response: {
    201: publicUserResponse,
  },
};

export const loginSchema = {
  body: authBodySchema,
  response: {
    200: {
      type: "object",
      required: ["accessToken", "user"],
      properties: {
        accessToken: { type: "string" },
        user: {
          ...publicUserResponse,
        },
      },
    },
  },
};

export const meSchema = {
  response: {
    200: {
      type: "object",
      required: ["user"],
      properties: {
        user: {
          ...publicUserResponse,
        },
      },
    },
  },
};

export const updateProfileSchema = {
  body: {
    type: "object",
    required: ["name"],
    additionalProperties: false,
    properties: {
      name: { type: "string", minLength: 1 },
    },
  },
  response: {
    200: {
      type: "object",
      required: ["user"],
      properties: {
        user: publicUserResponse,
      },
    },
  },
};
