export const locationPointResponse = {
  type: "object",
  required: [
    "id",
    "sessionId",
    "latitude",
    "longitude",
    "recordedAt",
    "createdAt",
  ],
  properties: {
    id: { type: "string" },
    sessionId: { type: "string" },
    latitude: { type: "number" },
    longitude: { type: "number" },
    recordedAt: { type: "string" },
    createdAt: { type: "string" },
  },
};

export const saveLocationPointSchema = {
  params: {
    type: "object",
    required: ["sessionId"],
    properties: {
      sessionId: { type: "string" },
    },
  },
  body: {
    type: "object",
    required: ["latitude", "longitude"],
    additionalProperties: false,
    properties: {
      latitude: { type: "number" },
      longitude: { type: "number" },
      recordedAt: { type: "string" },
    },
  },
  response: {
    201: locationPointResponse,
  },
};

export const latestLocationPointSchema = {
  params: {
    type: "object",
    required: ["sessionId"],
    properties: {
      sessionId: { type: "string" },
    },
  },
  response: {
    200: {
      type: "object",
      required: ["location"],
      properties: {
        location: locationPointResponse,
      },
    },
  },
};

export const locationHistorySchema = {
  params: {
    type: "object",
    required: ["sessionId"],
    properties: {
      sessionId: { type: "string" },
    },
  },
  querystring: {
    type: "object",
    additionalProperties: false,
    properties: {
      page: { type: "integer", minimum: 1, default: 1 },
      limit: { type: "integer", minimum: 1, maximum: 100, default: 20 },
    },
  },
  response: {
    200: {
      type: "object",
      required: ["cached", "data", "pagination"],
      properties: {
        cached: { type: "boolean" },
        data: {
          type: "array",
          items: locationPointResponse,
        },
        pagination: {
          type: "object",
          required: ["page", "limit", "total", "totalPages"],
          properties: {
            page: { type: "integer" },
            limit: { type: "integer" },
            total: { type: "integer" },
            totalPages: { type: "integer" },
          },
        },
      },
    },
  },
};
