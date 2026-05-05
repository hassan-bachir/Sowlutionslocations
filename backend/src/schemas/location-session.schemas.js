const locationSessionResponse = {
  type: "object",
  required: ["id", "userId", "startedAt", "isActive", "createdAt", "updatedAt"],
  properties: {
    id: { type: "string" },
    userId: { type: "string" },
    startedAt: { type: "string" },
    endedAt: { type: ["string", "null"] },
    isActive: { type: "boolean" },
    createdAt: { type: "string" },
    updatedAt: { type: "string" },
  },
};

const locationSessionWithCountResponse = {
  ...locationSessionResponse,
  required: [...locationSessionResponse.required, "locationCount"],
  properties: {
    ...locationSessionResponse.properties,
    locationCount: { type: "integer" },
  },
};

export const listLocationSessionsSchema = {
  response: {
    200: {
      type: "object",
      required: ["cached", "data"],
      properties: {
        cached: { type: "boolean" },
        data: {
          type: "array",
          items: locationSessionWithCountResponse,
        },
      },
    },
  },
};

export const startLocationSessionSchema = {
  response: {
    201: locationSessionResponse,
  },
};

export const stopLocationSessionSchema = {
  params: {
    type: "object",
    required: ["sessionId"],
    properties: {
      sessionId: { type: "string" },
    },
  },
  response: {
    200: locationSessionResponse,
  },
};
