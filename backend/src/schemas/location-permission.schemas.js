const viewerResponse = {
  type: "object",
  required: ["id", "email"],
  properties: {
    id: { type: "string" },
    email: { type: "string" },
    name: { type: ["string", "null"] },
    allowedAt: { type: "string" },
  },
};

export const allowLocationViewerSchema = {
  body: {
    type: "object",
    required: ["email"],
    additionalProperties: false,
    properties: {
      email: { type: "string", format: "email" },
    },
  },
  response: {
    201: viewerResponse,
  },
};

export const listLocationViewersSchema = {
  response: {
    200: {
      type: "object",
      required: ["data"],
      properties: {
        data: {
          type: "array",
          items: viewerResponse,
        },
      },
    },
  },
};

export const removeLocationViewerSchema = {
  params: {
    type: "object",
    required: ["viewerUserId"],
    properties: {
      viewerUserId: { type: "string" },
    },
  },
  response: {
    200: {
      type: "object",
      required: ["removed"],
      properties: {
        removed: { type: "boolean" },
      },
    },
  },
};
